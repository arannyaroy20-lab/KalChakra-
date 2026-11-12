import type { GeoLocation } from "../types.js";

export function assertValidDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError(`Invalid ISO date: ${date}`);
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new RangeError(`Invalid ISO date: ${date}`);
  }
}

export function addDays(date: string, days: number): string {
  assertValidDate(date);
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dayDifference(from: string, to: string): number {
  assertValidDate(from); assertValidDate(to);
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function validateLocation(location: GeoLocation): void {
  if (!Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90) throw new RangeError("Latitude must be between -90 and 90");
  if (!Number.isFinite(location.longitude) || location.longitude < -180 || location.longitude > 180) throw new RangeError("Longitude must be between -180 and 180");
  try { new Intl.DateTimeFormat("en-US", { timeZone: location.timeZone }).format(new Date()); }
  catch { throw new RangeError(`Unsupported IANA time zone: ${location.timeZone}`); }
}

export function localDateAt(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function localTimeAt(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(instant);
}

export function timezoneOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

export function localDateTimeToUtc(date: string, time: string, timeZone: string): Date {
  assertValidDate(date);
  const parts = time.split(":").map(Number);
  const hour = parts[0] ?? 0;
  const minute = parts[1] ?? 0;
  const second = parts[2] ?? 0;
  const target = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), hour, minute, second);
  let instant = new Date(target);
  for (let i = 0; i < 3; i++) {
    instant = new Date(target - timezoneOffsetMinutes(instant, timeZone) * 60_000);
  }
  return instant;
}

export function formatLocalIso(instant: Date, timeZone: string): string {
  const offset = timezoneOffsetMinutes(instant, timeZone);
  const sign = offset >= 0 ? "+" : "-";
  const absolute = Math.abs(offset);
  const offsetText = `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
  return `${localDateAt(instant, timeZone)}T${localTimeAt(instant, timeZone)}${offsetText}[${timeZone}]`;
}
