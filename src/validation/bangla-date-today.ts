import type { BengaliDate } from "../engines/bd-bengali/types.js";
import { gregorianToBengali } from "../engines/bd-bengali/bd-bengali.calendar.js";

const API_BASE = "https://www.bangladatetoday.com/api/convert?date=";
const TTL_MS = 24 * 60 * 60 * 1000;
export type ValidationStatus = "matched" | "mismatch" | "offline" | "rate-limited" | "unavailable";
export interface BanglaDateValidation {
  date: string;
  status: ValidationStatus;
  internal: BengaliDate;
  external?: { year: number; month: number; day: number; monthName: { bn: string; en: string }; formatted?: { bn?: string; en?: string } };
  checkedAt?: string;
  message?: string;
  cached: boolean;
}
interface ApiPayload { date?: string; bengali?: { year?: number; month?: number; day?: number; monthName?: { bn?: string; en?: string }; formatted?: { bn?: string; en?: string } } }
interface CacheEntry { expiresAt: number; payload: ApiPayload }
const memoryCache = new Map<string, CacheEntry>();
const STORAGE_PREFIX = "multical:bangladatetoday:";
function readCache(date: string): CacheEntry | undefined {
  const memory = memoryCache.get(date);
  if (memory) return memory;
  try {
    if (typeof localStorage === "undefined") return undefined;
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${date}`);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry || typeof entry.expiresAt !== "number" || !entry.payload) return undefined;
    memoryCache.set(date, entry);
    return entry;
  } catch { return undefined; }
}
function writeCache(date: string, entry: CacheEntry): void {
  memoryCache.set(date, entry);
  try { if (typeof localStorage !== "undefined") localStorage.setItem(`${STORAGE_PREFIX}${date}`, JSON.stringify(entry)); } catch { /* Storage may be disabled or full; in-memory cache remains available. */ }
}

export interface ValidationOptions { fetcher?: typeof fetch; timeoutMs?: number; now?: () => number; forceRefresh?: boolean }

export async function validateBangladeshBengaliDate(date: string, options: ValidationOptions = {}): Promise<BanglaDateValidation> {
  const internal = gregorianToBengali(date);
  const requestedYear = Number(date.slice(0, 4));
  if (requestedYear < 1900 || requestedYear > 2199) return { date, status: "unavailable", internal, cached: false, message: "BanglaDateToday reference supports Gregorian years 1900–2199; internal conversion retained." };
  const now = options.now ?? Date.now;
  const fetcher = options.fetcher ?? fetch;
  const cached = readCache(date);
  if (!options.forceRefresh && cached && cached.expiresAt > now()) return compare(date, internal, cached.payload, true, now());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);
  try {
    const response = await fetcher(`${API_BASE}${encodeURIComponent(date)}`, { method: "GET", headers: { Accept: "application/json" }, signal: controller.signal });
    if (response.status === 429) return { date, status: "rate-limited", internal, cached: false, message: "BanglaDateToday rate limit reached; internal conversion retained." };
    if (!response.ok) return { date, status: "unavailable", internal, cached: false, message: `External validation returned HTTP ${response.status}; internal conversion retained.` };
    const payload = await response.json() as ApiPayload;
    if (payload.date && payload.date !== date) return { date, status: "unavailable", internal, cached: false, message: "External response date did not match the requested date; internal conversion retained." };
    const b = payload.bengali;
    if (!b || !Number.isInteger(b.year) || !Number.isInteger(b.month) || !Number.isInteger(b.day) || !b.monthName?.bn || !b.monthName?.en) {
      return { date, status: "unavailable", internal, cached: false, message: "External response did not contain the expected Bengali date fields." };
    }
    writeCache(date, { payload, expiresAt: now() + TTL_MS });
    return compare(date, internal, payload, false, now());
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "External validation timed out; internal conversion retained." : "External validation is offline or unreachable; internal conversion retained.";
    return { date, status: "offline", internal, cached: false, message };
  } finally { clearTimeout(timeout); }
}

function compare(date: string, internal: BengaliDate, payload: ApiPayload, cached: boolean, now: number): BanglaDateValidation {
  const b = payload.bengali!;
  const external = { year: b.year!, month: b.month!, day: b.day!, monthName: { bn: b.monthName!.bn!, en: b.monthName!.en! }, ...(b.formatted ? { formatted: b.formatted } : {}) };
  const matched = internal.year === external.year && internal.month === external.month && internal.day === external.day;
  return { date, status: matched ? "matched" : "mismatch", internal, external, checkedAt: new Date(now).toISOString(), cached, ...(matched ? {} : { message: "External reference differs from the internal engine. The internal result remains authoritative for MultiCal." }) };
}

export function clearBanglaDateValidationCache(): void {
  memoryCache.clear();
  try {
    if (typeof localStorage !== "undefined") {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key?.startsWith(STORAGE_PREFIX)) keys.push(key); }
      keys.forEach(key => localStorage.removeItem(key));
    }
  } catch { /* Ignore unavailable browser storage. */ }
}
