import type { DisplayLanguage } from "../integration/types.js";
import type { IconName } from "./shared.js";

export type ScheduleRepeat = "once" | "weekly" | "monthly" | "yearly" | "weekdays";
export type TimePeriod = "AM" | "PM";

export type ScheduleTypeId =
  | "study"
  | "music"
  | "health"
  | "work"
  | "meal"
  | "rest"
  | "prayer"
  | "creative"
  | "meeting"
  | "custom";

export interface ScheduleTypeMeta {
  id: ScheduleTypeId;
  icon: IconName;
  label: { bn: string; en: string };
  defaultComment: { bn: string; en: string };
}

export interface PersonalSchedule {
  id: string;
  title: string;
  date: string;
  startMinutes: number;
  endMinutes: number;
  reminder: boolean;
  repeat: ScheduleRepeat;
  weekdays?: number[];
  type: ScheduleTypeId;
  campaignId?: string;
  comment?: string;
  completedDates?: string[];
  createdAt: string;
}

export type ScheduleStatus = "upcoming" | "active" | "done" | "passed";

export const SCHEDULE_TYPES: readonly ScheduleTypeMeta[] = [
  {
    id: "study",
    icon: "book",
    label: { bn: "পড়াশোনা", en: "Study" },
    defaultComment: { bn: "মনোযোগ দিয়ে শেখা ও অনুশীলনের সময়", en: "Focused learning and study block" }
  },
  {
    id: "music",
    icon: "music",
    label: { bn: "গান ও চর্চা", en: "Singing & Music" },
    defaultComment: { bn: "সুর ও রেয়াজের আনন্দময় সময়", en: "Music practice and singing session" }
  },
  {
    id: "health",
    icon: "pulse",
    label: { bn: "স্বাস্থ্য ও ব্যায়াম", en: "Health & Fitness" },
    defaultComment: { bn: "শরীরচর্চা ও সুস্থ থাকার নিয়মিত অভ্যাস", en: "Workout and daily wellness care" }
  },
  {
    id: "work",
    icon: "briefcase",
    label: { bn: "কাজ ও ফোকাস", en: "Work & Focus" },
    defaultComment: { bn: "নির্দিষ্ট কাজ গুছিয়ে শেষ করার স্লট", en: "Deep work session for priority tasks" }
  },
  {
    id: "meal",
    icon: "meal",
    label: { bn: "খাবার ও রান্না", en: "Meal & Prep" },
    defaultComment: { bn: "সময়মতো পুষ্টিকর খাবার ও বিরতি", en: "Nourishing meal and refreshment time" }
  },
  {
    id: "rest",
    icon: "night",
    label: { bn: "বিশ্রাম ও ঘুম", en: "Rest & Sleep" },
    defaultComment: { bn: "মন ও শরীরকে সতেজ করার বিশ্রাম", en: "Quiet rest to recharge your energy" }
  },
  {
    id: "prayer",
    icon: "prayer",
    label: { bn: "ধ্যান ও প্রার্থনা", en: "Prayer & Meditation" },
    defaultComment: { bn: "স্থিরতা ও আত্মিক প্রশান্তির সময়", en: "Calm reflection and mindful prayer" }
  },
  {
    id: "creative",
    icon: "sparkle",
    label: { bn: "সৃজনশীল কাজ", en: "Creative Hobby" },
    defaultComment: { bn: "নতুন আইডিয়া ও নিজের পছন্দের কাজ", en: "Creative time for personal projects" }
  },
  {
    id: "meeting",
    icon: "users",
    label: { bn: "মিটিং ও কল", en: "Meeting & Call" },
    defaultComment: { bn: "আলোচনা ও সমন্বয়ের নির্ধারিত সময়", en: "Scheduled discussion or call" }
  },
  {
    id: "custom",
    icon: "clock",
    label: { bn: "অন্যান্য", en: "Other" },
    defaultComment: { bn: "দিনের নির্ধারিত রুটিন কাজ", en: "Planned time block for today" }
  }
];

const STORAGE_KEY = "multical-personal-schedules";

export function getScheduleType(id: ScheduleTypeId): ScheduleTypeMeta {
  return SCHEDULE_TYPES.find(item => item.id === id) ?? SCHEDULE_TYPES[SCHEDULE_TYPES.length - 1]!;
}

export function resolveScheduleComment(schedule: PersonalSchedule, language: DisplayLanguage): string {
  const custom = schedule.comment?.trim();
  return custom ? custom : getScheduleType(schedule.type).defaultComment[language];
}

export function loadSchedules(): PersonalSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSchedules(schedules: PersonalSchedule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
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

export function scheduleMatchesDate(schedule: PersonalSchedule, isoDate: string): boolean {
  if (isoDate < schedule.date) return false;
  if (schedule.repeat === "once") return isoDate === schedule.date;
  const start = parseYmd(schedule.date);
  const target = parseYmd(isoDate);
  switch (schedule.repeat) {
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
      return (schedule.weekdays ?? []).includes(target.wd);
  }
}

export function from24Minutes(totalMinutes: number): { mins12: number; period: TimePeriod } {
  const safe = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  return {
    mins12: safe % 720,
    period: safe >= 720 ? "PM" : "AM"
  };
}

export function to24Minutes(mins12: number, period: TimePeriod): number {
  const wrapped = ((Math.round(mins12) % 720) + 720) % 720;
  return wrapped + (period === "PM" ? 720 : 0);
}

export function format12hMinutes(totalMinutes: number, language: DisplayLanguage): string {
  const safe = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  const hour24 = Math.floor(safe / 60);
  const min = safe % 60;
  const period: TimePeriod = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const pad = (n: number) => String(n).padStart(2, "0");
  const raw = `${hour12}:${pad(min)} ${period}`;
  if (language === "bn") {
    return `${raw.slice(0, raw.indexOf(" ")).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[Number(d)]!)} ${period}`;
  }
  return raw;
}

export function formatScheduleRange(startMinutes: number, endMinutes: number, language: DisplayLanguage): string {
  return `${format12hMinutes(startMinutes, language)} – ${format12hMinutes(endMinutes, language)}`;
}

export function formatDuration(startMinutes: number, endMinutes: number, language: DisplayLanguage): string {
  const diff = endMinutes - startMinutes;
  if (diff <= 0) return "";
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  const digit = (n: number) => (language === "bn" ? String(n).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[Number(d)]!) : String(n));
  if (language === "bn") {
    if (hours > 0 && mins > 0) return `${digit(hours)} ঘণ্টা ${digit(mins)} মিনিট`;
    if (hours > 0) return `${digit(hours)} ঘণ্টা`;
    return `${digit(mins)} মিনিট`;
  }
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function sortSchedulesChronologically(list: PersonalSchedule[]): PersonalSchedule[] {
  return [...list].sort((a, b) =>
    a.startMinutes !== b.startMinutes
      ? a.startMinutes - b.startMinutes
      : a.endMinutes !== b.endMinutes
        ? a.endMinutes - b.endMinutes
        : a.createdAt.localeCompare(b.createdAt)
  );
}

export const SCHEDULE_TICK_WINDOW_MINS = 10;

export function dhakaMinutesToMs(isoDate: string, totalMinutes: number): number {
  return Date.parse(`${isoDate}T00:00:00+06:00`) + totalMinutes * 60_000;
}

export function getScheduleStatus(
  schedule: PersonalSchedule,
  targetIso: string,
  todayIso: string,
  nowMinutes: number
): ScheduleStatus {
  if (schedule.completedDates?.includes(targetIso)) return "done";
  if (targetIso < todayIso) return "passed";
  if (targetIso > todayIso) return "upcoming";
  if (nowMinutes < schedule.startMinutes) return "upcoming";
  const activeLimit = schedule.campaignId ? schedule.endMinutes : schedule.startMinutes + SCHEDULE_TICK_WINDOW_MINS;
  if (nowMinutes < activeLimit) return "active";
  return "passed";
}

export function getScheduleTickMinutesLeft(schedule: PersonalSchedule, nowMinutes: number): number {
  const activeLimit = schedule.campaignId ? schedule.endMinutes : schedule.startMinutes + SCHEDULE_TICK_WINDOW_MINS;
  return Math.max(1, Math.ceil(activeLimit - nowMinutes));
}

export function getSegmentProgressPct(
  currentStartMinutes: number,
  nextStartMinutes: number,
  exactNowMinutes: number
): number {
  if (exactNowMinutes <= currentStartMinutes) return 0;
  if (exactNowMinutes >= nextStartMinutes) return 100;
  const span = Math.max(1, nextStartMinutes - currentStartMinutes);
  return Math.max(0, Math.min(100, ((exactNowMinutes - currentStartMinutes) / span) * 100));
}

export function isScheduleLockedForToday(
  schedule: PersonalSchedule,
  targetIso: string,
  todayIso: string,
  nowMinutes: number
): boolean {
  const status = getScheduleStatus(schedule, targetIso, todayIso, nowMinutes);
  if (status !== "upcoming") return true;
  if (scheduleMatchesDate(schedule, todayIso) && nowMinutes >= schedule.startMinutes) {
    return schedule.repeat === "once" || targetIso === todayIso;
  }
  return false;
}

export function resolveActiveHomeSchedule(
  schedules: PersonalSchedule[],
  todayIso: string,
  nowMinutes: number
): PersonalSchedule | null {
  const todayList = sortSchedulesChronologically(schedules.filter(s => scheduleMatchesDate(s, todayIso)));
  return todayList.find(s => nowMinutes >= s.startMinutes && nowMinutes < s.endMinutes) ?? null;
}

export function toggleScheduleDone(
  schedules: PersonalSchedule[],
  id: string,
  targetIso: string
): PersonalSchedule[] {
  return schedules.map(item => {
    if (item.id !== id) return item;
    const prev = item.completedDates ?? [];
    if (prev.includes(targetIso)) return item;
    return { ...item, completedDates: [...prev, targetIso] };
  });
}
