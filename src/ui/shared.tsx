import type { UserCalendarDay } from "../application/calendar-service.js";
import type { DisplayLanguage } from "../integration/types.js";
import { ui } from "./i18n.js";

export type DayEvent = UserCalendarDay["events"][number];
export type IconName = "left" | "right" | "sunrise" | "sunset" | "afternoon" | "night" | "moon" | "star" | "yoga" | "karana" | "sun" | "moonTheme" | "check" | "checkCircle" | "xCircle" | "alert" | "external" | "cal" | "layers" | "grid" | "list" | "flag" | "om" | "home" | "sidebar" | "menu" | "close" | "sparkle" | "settings" | "agendaBook" | "heart" | "cake" | "book" | "compass" | "party" | "briefcase" | "pulse" | "prayer" | "users" | "bell" | "plus" | "trash" | "edit" | "grip" | "up" | "down" | "clock" | "repeat" | "music" | "meal" | "lock" | "play" | "target" | "trophy" | "flame" | "shield";

export const todayIso = () => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
};
export const toBn = (value: string | number) => String(value).replace(/[0-9]/g, x => "০১২৩৪৫৬৭৮৯"[Number(x)]!);
export const numFor = (language: DisplayLanguage) => (value: string | number) => language === "bn" ? toBn(value) : String(value);
export const shortDate = (iso: string, language: DisplayLanguage) =>
  new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00.000Z`));

/** strong = public/general holiday, soft = executive/optional/regional, none = not a holiday */
export type HolidayTier = "strong" | "soft" | "none";
export const holidayTier = (event: DayEvent): HolidayTier => {
  if (event.engine !== "bd-national") return "none";
  const status = event.value.holidayStatus;
  if (status === "none") return "none";
  return status === "general-holiday" ? "strong" : "soft";
};
export const holidayLabel = (status: string, language: DisplayLanguage) => {
  const u = ui[language];
  return ({ "general-holiday": u.holidayGeneral, "executive-holiday": u.holidayExecutive, "optional-holiday": u.holidayOptional, "regional-holiday": u.holidayRegional } as Record<string, string>)[status] ?? status;
};
export const eventTitle = (event: DayEvent, language: DisplayLanguage) => event.engine === "bd-national" ? event.value.title[language] : event.value.name;
export const eventStatus = (event: DayEvent) => event.engine === "bd-national" ? event.value.verificationStatus : event.value.verification;
export const eventSource = (event: DayEvent) => event.engine === "bd-national" ? event.value.sources.map(s => s.publisher).join(", ") : event.value.source;
const tierRank = (e: DayEvent) => ({ strong: 0, soft: 1, none: 2 }[holidayTier(e)]);
export const sortEvents = (events: DayEvent[]) => [...events].sort((a, b) => tierRank(a) - tierRank(b));
export const chipClass = (event: DayEvent) => `eng-${event.engine} ${holidayTier(event) === "strong" ? "tier-strong" : holidayTier(event) === "soft" ? "tier-soft" : ""}`;

export interface MonthSpan { key: string; name: string; year: number; count: number; from: string; to: string }
/** Groups consecutive days by their native (Bangla) month so both month systems can be shown in one strip. */
export const monthSpans = (days: UserCalendarDay[], language: DisplayLanguage): MonthSpan[] => {
  const spans: MonthSpan[] = [];
  for (const d of days) {
    const name = d.date.calendarMonthName; const year = d.date.calendarYear;
    if (!name || year === undefined) continue;
    const key = `${year}-${name.en}`; const last = spans[spans.length - 1];
    if (last && last.key === key) { last.count++; last.to = d.date.gregorianDate; }
    else spans.push({ key, name: name[language], year, count: 1, from: d.date.gregorianDate, to: d.date.gregorianDate });
  }
  return spans;
};

export const Icon = ({ name }: { name: IconName }) => {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
  switch (name) {
    case "left": return <svg {...p}><path d="m15 18-6-6 6-6" /></svg>;
    case "right": return <svg {...p}><path d="m9 18 6-6-6-6" /></svg>;
    case "sunrise": return <svg {...p}><path d="M12 3v4M5.6 8.6l2.2 2.2M18.4 8.6l-2.2 2.2M3 17h18M7 17a5 5 0 0 1 10 0M8 21h8" /></svg>;
    case "sunset": return <svg {...p}><path d="M12 9V4m0 0-2 2m2-2 2 2M5.6 10.6l2.2 2.2M18.4 10.6l-2.2 2.2M3 18h18M7 18a5 5 0 0 1 10 0M8 21h8" /></svg>;
    case "afternoon": return <svg {...p}><path d="M3 17h18M7 17a5 5 0 0 1 10 0M12 6v2M5.5 10.5l1.5 1.5M18.5 10.5 17 12" /></svg>;
    case "night": return <svg {...p}><path d="M19 14.5A7.5 7.5 0 1 1 9.5 5 6 6 0 0 0 19 14.5Z" /><path d="M16.5 5v2.5M15.25 6.25h2.5M20 9.5h.01" /></svg>;
    case "moon": return <svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z" /></svg>;
    case "star": return <svg {...p}><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7Z" /></svg>;
    case "yoga": return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17M3.5 12h17" /></svg>;
    case "karana": return <svg {...p}><path d="M12 3a9 9 0 1 0 0 18V3Z" /></svg>;
    case "sun": return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
    case "moonTheme": return <svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z" /></svg>;
    case "check": return <svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
    case "checkCircle": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.3 2.5 2.5 4.8-5.3" /></svg>;
    case "xCircle": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m9.5 9.5 5 5M14.5 9.5l-5 5" /></svg>;
    case "alert": return <svg {...p}><path d="M12 8v5M12 16.5v.01M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>;
    case "external": return <svg {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
    case "cal": return <svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>;
    case "layers": return <svg {...p}><path d="m12 3 9 5-9 5-9-5 9-5ZM3 12.5l9 5 9-5M3 16.5l9 5 9-5" /></svg>;
    case "grid": return <svg {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>;
    case "list": return <svg {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>;
    case "home": return <svg {...p}><path d="M3.5 11 12 3.5 20.5 11M5.5 9.5V20h5v-5.5h3V20h5V9.5" /></svg>;
    case "sidebar": return <svg {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><path d="M9.5 4.5v15" /></svg>;
    case "menu": return <svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "close": return <svg {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>;
    case "sparkle": return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>;
    case "flag": return <svg {...p}><path d="M5 21V4m0 0h11l-2 4 2 4H5" /></svg>;
    case "om": return <svg {...p}><path d="M12 3c-2 3-2 6 0 9s2 6 0 9M5 12c3-2 6-2 9 0s5 2 7 0" /></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></svg>;
    case "agendaBook": return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 9h6M9 13h4M8 2v4M16 2v4" /></svg>;
    case "heart": return <svg {...p}><path d="M19.5 12.6 12 20l-7.5-7.4a4.8 4.8 0 0 1 6.8-6.8l.7.7.7-.7a4.8 4.8 0 0 1 6.8 6.8Z" /></svg>;
    case "cake": return <svg {...p}><path d="M4 15.5a2.5 2.5 0 0 1 2.5-2.5h11a2.5 2.5 0 0 1 2.5 2.5V20H4v-4.5Z" /><path d="M4 16.5c1.5 1 3 1 4 0s2.5-1 4 0 3 1 4 0 2.5-1 4 0M12 7v6M8 10v3M16 10v3M12 4.2c.6.8.6 1.5 0 2-.6-.5-.6-1.2 0-2Z" /></svg>;
    case "book": return <svg {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 0 4 22V5.5ZM20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5A2.5 2.5 0 0 1 20 22V5.5Z" /></svg>;
    case "compass": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></svg>;
    case "party": return <svg {...p}><path d="M4 20 9.5 6.5l8 8L4 20Z" /><path d="M15 4v2M19 8h2M17.5 5.5 19 4M13.5 9.5c1-1.5 3-1.5 4 0" /></svg>;
    case "briefcase": return <svg {...p}><rect x="3.5" y="7" width="17" height="13" rx="2.5" /><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3.5 12h17" /></svg>;
    case "pulse": return <svg {...p}><path d="M3 12h4l2.5-6 4 12 2.5-6h5" /></svg>;
    case "prayer": return <svg {...p}><path d="M12 4c1.2 1.6 1.2 3.2 0 4.5-1.2-1.3-1.2-2.9 0-4.5ZM5 13c0 4 3 6.5 7 6.5s7-2.5 7-6.5H5ZM4 20h16" /></svg>;
    case "users": return <svg {...p}><circle cx="9.5" cy="8" r="3" /><path d="M4 19a5.5 5.5 0 0 1 11 0M16 7a2.5 2.5 0 0 1 0 5M18 19a4 4 0 0 0-2.5-3.7" /></svg>;
    case "bell": return <svg {...p}><path d="M6 15.5h12l-1.5-2V10a4.5 4.5 0 0 0-9 0v3.5l-1.5 2ZM10 18.5a2 2 0 0 0 4 0" /></svg>;
    case "plus": return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case "trash": return <svg {...p}><path d="M4 7h16M9 7V4.5h6V7M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>;
    case "edit": return <svg {...p}><path d="M4 20h4l10.5-10.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z" /></svg>;
    case "grip": return <svg {...p}><path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" /></svg>;
    case "up": return <svg {...p}><path d="m18 15-6-6-6 6" /></svg>;
    case "down": return <svg {...p}><path d="m6 9 6 6 6-6" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>;
    case "repeat": return <svg {...p}><path d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4" /></svg>;
    case "music": return <svg {...p}><path d="M9 18V5l10-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></svg>;
    case "meal": return <svg {...p}><path d="M5 4v7a3 3 0 0 0 6 0V4M8 4v16M17 4v16M17 4c2.2 0 3.5 2 3.5 4.5S19.2 13 17 13" /></svg>;
    case "lock": return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" /></svg>;
    case "play": return <svg {...p}><path d="m7 5 12 7-12 7V5Z" /></svg>;
    case "target": return <svg {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.2" /></svg>;
    case "trophy": return <svg {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5a1.5 1.5 0 0 0-1.5 1.5v1A3.5 3.5 0 0 0 7 12h1M16 6h3a1.5 1.5 0 0 1 1.5 1.5v1A3.5 3.5 0 0 1 17 12h-1M12 13v5M8.5 21h7" /></svg>;
    case "flame": return <svg {...p}><path d="M12 3c2.5 3.2 5.5 5.4 5.5 10a5.5 5.5 0 1 1-11 0c0-2.5 1.1-4.5 2.4-6.1.4 1.6 1.5 2.4 2.4 2.4C11.1 7.3 11.4 5 12 3Z" /></svg>;
    case "shield": return <svg {...p}><path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z" /><path d="m9.5 12 1.8 1.8L15 10" /></svg>;
  }
};
