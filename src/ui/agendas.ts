import type { DisplayLanguage } from "../integration/types.js";
import type { IconName } from "./shared.js";

export type AgendaRepeat = "once" | "weekly" | "monthly" | "yearly" | "weekdays";
export type AgendaTypeId =
  | "marriage"
  | "birthday"
  | "exam"
  | "holiday"
  | "party"
  | "work"
  | "health"
  | "prayer"
  | "family"
  | "custom";

export interface AgendaTypeMeta {
  id: AgendaTypeId;
  icon: IconName;
  label: { bn: string; en: string };
  defaultComment: { bn: string; en: string };
}

export interface PersonalAgenda {
  id: string;
  title: string;
  date: string;
  isAllDay: boolean;
  time?: string;
  reminder: boolean;
  repeat: AgendaRepeat;
  weekdays?: number[];
  type: AgendaTypeId;
  comment?: string;
  createdAt: string;
}

export interface MultiCalDesktopBridge {
  isDesktop: boolean;
  loadAgendas: () => Promise<PersonalAgenda[]>;
  saveAgendas: (agendas: PersonalAgenda[]) => Promise<boolean>;
  setLanguage: (lang: DisplayLanguage) => void;
  onOpenMyAgenda: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    multiCalDesktop?: MultiCalDesktopBridge;
  }
}

export const AGENDA_TYPES: readonly AgendaTypeMeta[] = [
  {
    id: "marriage",
    icon: "heart",
    label: { bn: "বিবাহ / বার্ষিকী", en: "Marriage" },
    defaultComment: { bn: "ভালোবাসা ও সুন্দর মুহূর্তের বিশেষ দিন", en: "Celebrating love and cherished moments" }
  },
  {
    id: "birthday",
    icon: "cake",
    label: { bn: "জন্মদিন", en: "Birthday" },
    defaultComment: { bn: "শুভ জন্মদিন, আনন্দে কাটুক পুরো দিন", en: "Wishing you a joyful birthday" }
  },
  {
    id: "exam",
    icon: "book",
    label: { bn: "পরীক্ষা", en: "Exam" },
    defaultComment: { bn: "স্থির মন আর পূর্ণ আত্মবিশ্বাসে এগিয়ে চলো", en: "Stay calm, focused, and give your best" }
  },
  {
    id: "holiday",
    icon: "compass",
    label: { bn: "ছুটি ও ভ্রমণ", en: "Holiday" },
    defaultComment: { bn: "ব্যস্ততার মাঝে একটু স্বস্তি ও আনন্দের ছুটি", en: "Take a breather and enjoy your time off" }
  },
  {
    id: "party",
    icon: "party",
    label: { bn: "পার্টি ও আড্ডা", en: "Party" },
    defaultComment: { bn: "প্রিয়জনদের সাথে দারুণ একটি আয়োজন", en: "Good company and great memories ahead" }
  },
  {
    id: "work",
    icon: "briefcase",
    label: { bn: "কাজ ও মিটিং", en: "Work" },
    defaultComment: { bn: "গুরুত্বপূর্ণ কাজ ও লক্ষ্য পূরণের দিন", en: "Focused execution for key milestones" }
  },
  {
    id: "health",
    icon: "pulse",
    label: { bn: "স্বাস্থ্য", en: "Health" },
    defaultComment: { bn: "নিজের যত্ন ও সুস্থ থাকার অঙ্গীকার", en: "Taking care of your health comes first" }
  },
  {
    id: "prayer",
    icon: "prayer",
    label: { bn: "পূজা ও প্রার্থনা", en: "Prayer" },
    defaultComment: { bn: "শ্রদ্ধা, শান্তি ও পবিত্রতার দিন", en: "A peaceful day of devotion and grace" }
  },
  {
    id: "family",
    icon: "users",
    label: { bn: "পরিবার", en: "Family" },
    defaultComment: { bn: "পরিবারের সাথে উষ্ণ ও সুন্দর সময়", en: "Warm moments together with family" }
  },
  {
    id: "custom",
    icon: "star",
    label: { bn: "অন্যান্য", en: "Custom" },
    defaultComment: { bn: "আজকের জন্য আপনার বিশেষ পরিকল্পনা", en: "Your planned moment for today" }
  }
];

const STORAGE_KEY = "multical-personal-agendas";

export function getAgendaType(id: AgendaTypeId): AgendaTypeMeta {
  return AGENDA_TYPES.find(item => item.id === id) ?? AGENDA_TYPES[AGENDA_TYPES.length - 1]!;
}

export function resolveAgendaComment(agenda: PersonalAgenda, language: DisplayLanguage): string {
  const custom = agenda.comment?.trim();
  return custom ? custom : getAgendaType(agenda.type).defaultComment[language];
}

export function loadAgendas(): PersonalAgenda[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAgendas(agendas: PersonalAgenda[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agendas));
  } catch {
    /* storage unavailable */
  }
}

function parseYmd(iso: string): { y: number; m: number; d: number; wd: number } {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return { y, m, d, wd: dt.getUTCDay() };
}

function daysInMonthUtc(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function agendaMatchesDate(agenda: PersonalAgenda, isoDate: string): boolean {
  if (isoDate < agenda.date) return false;
  if (agenda.repeat === "once") return isoDate === agenda.date;
  const start = parseYmd(agenda.date);
  const target = parseYmd(isoDate);
  switch (agenda.repeat) {
    case "weekly":
      return target.wd === start.wd;
    case "monthly": {
      const clamped = Math.min(start.d, daysInMonthUtc(target.y, target.m));
      return target.d === clamped;
    }
    case "yearly": {
      if (target.m !== start.m) return false;
      const clamped = Math.min(start.d, daysInMonthUtc(target.y, target.m));
      return target.d === clamped;
    }
    case "weekdays":
      return (agenda.weekdays ?? []).includes(target.wd);
  }
}

function timeToMinutes(time?: string): number {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return -1;
  const [hh, mm] = time.split(":").map(Number) as [number, number];
  return hh * 60 + mm;
}

export function formatAgendaTime(agenda: PersonalAgenda, language: DisplayLanguage): string {
  if (agenda.isAllDay || !agenda.time) return language === "bn" ? "সারা দিন" : "All day";
  const [hh, mm] = agenda.time.split(":").map(Number) as [number, number];
  const dt = new Date(Date.UTC(2026, 0, 1, hh, mm));
  return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC"
  }).format(dt);
}

/**
 * Resolves the Hero Main agenda + remaining agendas for a specific date and clock time.
 * Rules:
 * - Preserves user drag-and-drop list order as priority.
 * - If all matching agendas are All-Day, the #1 item in priority order is Main.
 * - If timed agendas exist, each distinct-time agenda leads around/during its scheduled time of day;
 *   same-time ties follow user priority order.
 * - If both All-Day and timed agendas exist, a timed agenda takes the Hero spotlight during its
 *   active window (30m before start up to next timed agenda or +3h), otherwise user priority #1 leads.
 */
export function resolveHeroAgendas(
  agendas: PersonalAgenda[],
  isoDate: string,
  nowMinutes: number
): { main: PersonalAgenda | null; remaining: PersonalAgenda[] } {
  const matching = agendas.filter(item => agendaMatchesDate(item, isoDate));
  if (matching.length === 0) return { main: null, remaining: [] };

  const timed = matching
    .filter(item => !item.isAllDay && Boolean(item.time))
    .map(item => ({ item, mins: timeToMinutes(item.time) }))
    .filter(entry => entry.mins >= 0)
    .sort((a, b) => (a.mins !== b.mins ? a.mins - b.mins : matching.indexOf(a.item) - matching.indexOf(b.item)));

  const hasAllDay = matching.some(item => item.isAllDay || !item.time);
  let main: PersonalAgenda = matching[0]!;

  if (timed.length > 0) {
    if (!hasAllDay) {
      let chosen = timed[0]!;
      for (let i = 0; i < timed.length; i++) {
        const current = timed[i]!;
        const startLead = current.mins - 30;
        if (nowMinutes >= startLead) {
          chosen = current;
        }
      }
      main = chosen.item;
    } else {
      let activeTimed: PersonalAgenda | null = null;
      for (let i = 0; i < timed.length; i++) {
        const current = timed[i]!;
        const next = timed[i + 1];
        const windowStart = current.mins - 30;
        const windowEnd = next ? next.mins - 30 : Math.min(24 * 60, current.mins + 180);
        if (nowMinutes >= windowStart && nowMinutes < windowEnd) {
          activeTimed = current.item;
          break;
        }
      }
      main = activeTimed ?? matching[0]!;
    }
  }

  return {
    main,
    remaining: matching.filter(item => item.id !== main.id)
  };
}

export function reorderAgendasBySubset(
  allAgendas: PersonalAgenda[],
  fromId: string,
  toId: string
): PersonalAgenda[] {
  if (fromId === toId) return allAgendas;
  const fromIdx = allAgendas.findIndex(item => item.id === fromId);
  const toIdx = allAgendas.findIndex(item => item.id === toId);
  if (fromIdx === -1 || toIdx === -1) return allAgendas;
  const next = [...allAgendas];
  const [moved] = next.splice(fromIdx, 1);
  if (!moved) return allAgendas;
  next.splice(toIdx, 0, moved);
  return next;
}
