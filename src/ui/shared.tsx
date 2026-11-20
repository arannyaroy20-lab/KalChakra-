import type { UserCalendarDay } from "../application/calendar-service.js";
import type { DisplayLanguage } from "../integration/types.js";
import { ui } from "./i18n.js";

export type DayEvent = UserCalendarDay["events"][number];
export type IconName = "left" | "right" | "sunrise" | "sunset" | "moon" | "star" | "yoga" | "karana" | "sun" | "moonTheme" | "check" | "alert" | "external" | "cal" | "layers" | "grid" | "list" | "flag" | "om" | "home" | "sidebar" | "menu" | "close" | "sparkle";

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
    case "moon": return <svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z" /></svg>;
    case "star": return <svg {...p}><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7Z" /></svg>;
    case "yoga": return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5v17M3.5 12h17" /></svg>;
    case "karana": return <svg {...p}><path d="M12 3a9 9 0 1 0 0 18V3Z" /></svg>;
    case "sun": return <svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
    case "moonTheme": return <svg {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z" /></svg>;
    case "check": return <svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
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
  }
};
