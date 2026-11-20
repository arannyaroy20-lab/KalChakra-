import { CalendarManager } from "../integration/calendar-manager.js";
import { isCalendarId } from "../integration/calendar-registry.js";
import type { CalendarId, DisplayLanguage } from "../integration/types.js";
import { normalizeBdNationalDate, normalizeBdBengaliDay, normalizeIndiaBengaliDay, normalizeIskconMayapurDay } from "../data-model/normalize.js";
import type { UnifiedCalendarDay, UnifiedCalendarEvent } from "../data-model/types.js";
import { BangladeshNationalCalendarEngine } from "../engines/bd-national/bd-national.engine.js";
import { gregorianToBengali } from "../engines/bd-bengali/bd-bengali.calendar.js";
import { gregorianToBengali as gregorianToIndiaBengali, getPanchangDay } from "../engines/india-bengali/index.js";
import type { GeoLocation } from "../engines/india-bengali/types.js";
import { IskconMayapurCalendarEngine } from "../engines/iskcon-mayapur/iskcon-mayapur.engine.js";
import type { MayapurLocation } from "../engines/iskcon-mayapur/types.js";
import { formatGregorianDate } from "../integration/formatting.js";

export interface CalendarServiceOptions {
  location?: Partial<GeoLocation & MayapurLocation>;
  timeZone?: string;
  signal?: AbortSignal;
}

export interface CalendarPanchang {
  engine: "india-bengali" | "iskcon-mayapur";
  sunrise: string;
  sunset: string;
  tithi: { name: string; startsAt?: string; endsAt?: string };
  nakshatra: { name: string; startsAt?: string; endsAt?: string };
  yoga: { name: string; startsAt?: string; endsAt?: string };
  karana: { name: string; startsAt?: string; endsAt?: string };
}

export interface UserCalendarDay extends Omit<UnifiedCalendarDay, "panchang"> {
  displayLanguage: DisplayLanguage;
  calendarName: { bn: string; en: string };
  gregorian: { formatted: { bn: string; en: string }; weekday: { bn: string; en: string }; year: number; month: number; day: number };
  nativeDateAvailable: boolean;
  panchang?: CalendarPanchang;
  availability: "available" | "limited";
  availabilityNote?: { bn: string; en: string };
}

const manager = new CalendarManager();
const nationalEngine = new BangladeshNationalCalendarEngine();
const MONTH_LIMIT_DAYS = 42;

const PANCHANG_ENGLISH: Record<string, string> = {
  "শুক্ল প্রতিপদ": "Shukla Pratipada", "শুক্ল দ্বিতীয়া": "Shukla Dvitiya", "শুক্ল তৃতীয়া": "Shukla Tritiya", "শুক্ল চতুর্থী": "Shukla Chaturthi", "শুক্ল পঞ্চমী": "Shukla Panchami", "শুক্ল ষষ্ঠী": "Shukla Shashthi", "শুক্ল সপ্তমী": "Shukla Saptami", "শুক্ল অষ্টমী": "Shukla Ashtami", "শুক্ল নবমী": "Shukla Navami", "শুক্ল দশমী": "Shukla Dashami", "শুক্ল একাদশী": "Shukla Ekadashi", "শুক্ল দ্বাদশী": "Shukla Dvadashi", "শুক্ল ত্রয়োদশী": "Shukla Trayodashi", "শুক্ল চতুর্দশী": "Shukla Chaturdashi", "পূর্ণিমা": "Purnima", "কৃষ্ণ প্রতিপদ": "Krishna Pratipada", "কৃষ্ণ দ্বিতীয়া": "Krishna Dvitiya", "কৃষ্ণ তৃতীয়া": "Krishna Tritiya", "কৃষ্ণ চতুর্থী": "Krishna Chaturthi", "কৃষ্ণ পঞ্চমী": "Krishna Panchami", "কৃষ্ণ ষষ্ঠী": "Krishna Shashthi", "কৃষ্ণ সপ্তমী": "Krishna Saptami", "কৃষ্ণ অষ্টমী": "Krishna Ashtami", "কৃষ্ণ নবমী": "Krishna Navami", "কৃষ্ণ দশমী": "Krishna Dashami", "কৃষ্ণ একাদশী": "Krishna Ekadashi", "কৃষ্ণ দ্বাদশী": "Krishna Dvadashi", "কৃষ্ণ ত্রয়োদশী": "Krishna Trayodashi", "কৃষ্ণ চতুর্দশী": "Krishna Chaturdashi", "অমাবস্যা": "Amavasya",
  "অশ্বিনী": "Ashwini", "ভরণী": "Bharani", "কৃত্তিকা": "Krittika", "রোহিণী": "Rohini", "মৃগশিরা": "Mrigashira", "আর্দ্রা": "Ardra", "পুনর্বসু": "Punarvasu", "পুষ্যা": "Pushya", "আশ্লেষা": "Ashlesha", "মঘা": "Magha", "পূর্বফাল্গুনী": "Purva Phalguni", "উত্তরফাল্গুনী": "Uttara Phalguni", "হস্তা": "Hasta", "চিত্রা": "Chitra", "স্বাতী": "Swati", "বিশাখা": "Vishakha", "অনুরাধা": "Anuradha", "জ্যেষ্ঠা": "Jyeshtha", "মূলা": "Mula", "পূর্বাষাঢ়া": "Purva Ashadha", "উত্তরাষাঢ়া": "Uttara Ashadha", "শ্রবণা": "Shravana", "ধনিষ্ঠা": "Dhanishta", "শতভিষা": "Shatabhisha", "পূর্বভাদ্রপদ": "Purva Bhadrapada", "উত্তরভাদ্রপদ": "Uttara Bhadrapada", "রেবতী": "Revati",
  "বিষ্কম্ভ": "Vishkambha", "প্রীতি": "Priti", "আয়ুষ্মান": "Ayushman", "সৌভাগ্য": "Saubhagya", "শোভন": "Shobhana", "অতিগণ্ড": "Atiganda", "সুকর্মা": "Sukarma", "ধৃতি": "Dhriti", "শূল": "Shula", "গণ্ড": "Ganda", "বৃদ্ধি": "Vriddhi", "ধ্রুব": "Dhruva", "ব্যাঘাত": "Vyaghata", "হর্ষণ": "Harshana", "বজ্র": "Vajra", "সিদ্ধি": "Siddhi", "ব্যতীপাত": "Vyatipata", "বরীয়ান": "Variyana", "পরিঘ": "Parigha", "শিব": "Shiva", "সিদ্ধ": "Siddha", "সাধ্য": "Sadhya", "শুভ": "Shubha", "শুক্ল": "Shukla", "ব্রহ্ম": "Brahma", "ইন্দ্র": "Indra", "বৈধৃতি": "Vaidhriti",
  "বব": "Bava", "বালব": "Balava", "কৌলব": "Kaulava", "তৈতিল": "Taitila", "গর": "Gara", "বণিজ": "Vanija", "বিষ্টি": "Vishti", "শকুনি": "Shakuni", "চতুষ্পদ": "Chatushpada", "নাগ": "Naga", "কিংস্তুঘ্ন": "Kimstughna"
};
function localizePanchangName(name: string, language: DisplayLanguage): string {
  return language === "en" ? (PANCHANG_ENGLISH[name] ?? name) : name;
}

function assertDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError(`Invalid Gregorian date: ${value}`);
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) throw new RangeError(`Invalid Gregorian date: ${value}`);
}
function addDays(date: string, amount: number): string { const d = new Date(`${date}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate() + amount); return d.toISOString().slice(0, 10); }
function dayOfWeek(date: string): { bn: string; en: string } {
  const d = new Date(`${date}T00:00:00.000Z`);
  return { bn: new Intl.DateTimeFormat("bn-BD", { weekday: "long", timeZone: "UTC" }).format(d), en: new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(d) };
}
function resolveIndiaLocation(options?: CalendarServiceOptions): GeoLocation {
  const base: GeoLocation = { name: "Kolkata, West Bengal, India", latitude: 22.5726, longitude: 88.3639, elevationMeters: 9, timeZone: "Asia/Kolkata" };
  return { ...base, ...options?.location, timeZone: options?.timeZone ?? options?.location?.timeZone ?? base.timeZone };
}
function resolveMayapurLocation(options?: CalendarServiceOptions): MayapurLocation {
  const base: MayapurLocation = { name: "Sri Mayapur, Nadia, West Bengal, India", latitude: 23.4241, longitude: 88.3883, elevationMeters: 15, timeZone: "Asia/Kolkata" };
  return { ...base, ...options?.location, timeZone: options?.timeZone ?? options?.location?.timeZone ?? base.timeZone };
}
function dedupeEvents(events: UnifiedCalendarEvent[]): UnifiedCalendarEvent[] {
  const seen = new Set<string>();
  return events.filter(event => {
    const value = event.value as { id?: string; date?: string; fastDate?: string; name?: string };
    const key = value.id ? `${event.engine}:${value.id}` : `${event.engine}:${event.kind}:${value.date ?? value.fastDate ?? ""}:${value.name ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function getCalendarDay(gregorianDate: string, calendarId: CalendarId | string, language: DisplayLanguage, options?: CalendarServiceOptions): UserCalendarDay {
  assertDate(gregorianDate);
  if (!isCalendarId(calendarId)) throw new RangeError(`Invalid calendar ID: ${calendarId}`);
  if (language !== "bn" && language !== "en") throw new RangeError(`Invalid display language: ${language}`);
  manager.setSelectedCalendar(calendarId);
  manager.setDisplayLanguage(language);
  const metadata = manager.listCalendars().find(item => item.id === calendarId)!;
  let day: UnifiedCalendarDay;
  let panchang: CalendarPanchang | undefined;

  switch (calendarId) {
    case "bd-national": {
      const events = nationalEngine.getEventsInRange(gregorianDate, gregorianDate);
      day = normalizeBdNationalDate(gregorianDate, events);
      break;
    }
    case "bd-bengali": {
      day = normalizeBdBengaliDay(gregorianToBengali(gregorianDate));
      break;
    }
    case "india-bengali": {
      const location = resolveIndiaLocation(options);
      const converted = gregorianToIndiaBengali(gregorianDate, location);
      day = normalizeIndiaBengaliDay(converted);
      const p = getPanchangDay(gregorianDate, location);
      panchang = { engine: "india-bengali", sunrise: p.sunrise, sunset: p.sunset,
        tithi: { ...p.tithi, name: localizePanchangName(p.tithi.name, language) }, nakshatra: { ...p.nakshatra, name: localizePanchangName(p.nakshatra.name, language) }, yoga: { ...p.yoga, name: localizePanchangName(p.yoga.name, language) }, karana: { ...p.karana, name: localizePanchangName(p.karana.name, language) } };
      day = { ...day, sunrise: p.sunrise, sunset: p.sunset };
      break;
    }
    case "iskcon-mayapur": {
      const engine = new IskconMayapurCalendarEngine(resolveMayapurLocation(options));
      const info = engine.getDay(gregorianDate);
      const events = engine.getEvents(addDays(gregorianDate, -1), gregorianDate);
      day = normalizeIskconMayapurDay(info, events);
      panchang = { engine: "iskcon-mayapur", sunrise: info.sunrise, sunset: info.sunset,
        tithi: { name: info.tithi.name, startsAt: info.tithi.startsAt, endsAt: info.tithi.endsAt },
        nakshatra: { name: info.nakshatra }, yoga: { name: info.yoga }, karana: { name: info.karana } };
      break;
    }
  }
  day.events = dedupeEvents(day.events);
  const [year, month, date] = gregorianDate.split("-").map(Number) as [number, number, number];
  const { panchang: _normalizedPanchang, ...dayWithoutPanchang } = day;
  const response: UserCalendarDay = {
    ...dayWithoutPanchang, displayLanguage: language,
    calendarName: metadata.name,
    gregorian: { formatted: { bn: formatGregorianDate(gregorianDate, "bn"), en: formatGregorianDate(gregorianDate, "en") }, weekday: dayOfWeek(gregorianDate), year, month, day: date },
    nativeDateAvailable: calendarId === "bd-bengali" || calendarId === "india-bengali",
    availability: metadata.availability,
    ...(metadata.availabilityNote ? { availabilityNote: metadata.availabilityNote } : {}),
    ...(panchang ? { panchang } : {})
  };
  return response;
}

export interface UserCalendarMonth {
  year: number;
  month: number;
  calendarId: CalendarId;
  language: DisplayLanguage;
  days: UserCalendarDay[];
}

export function getCalendarMonth(year: number, month: number, calendarId: CalendarId | string, language: DisplayLanguage, options?: CalendarServiceOptions): UserCalendarMonth {
  if (!Number.isInteger(year) || year < 1800 || year > 2200) throw new RangeError("Gregorian year must be between 1800 and 2200");
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError("Gregorian month must be 1–12");
  if (!isCalendarId(calendarId)) throw new RangeError(`Invalid calendar ID: ${calendarId}`);
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (count > MONTH_LIMIT_DAYS) throw new RangeError("Requested month exceeds the supported day limit");
  const days: UserCalendarDay[] = [];
  for (let day = 1; day <= count; day++) days.push(getCalendarDay(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, calendarId, language, options));
  return { year, month, calendarId, language, days };
}

export function formatSelectedCalendarDate(day: UserCalendarDay, language: DisplayLanguage): string {
  const date = day.date;
  if (!day.nativeDateAvailable) return language === "bn" ? "গ্রেগরিয়ান তারিখই এই ক্যালেন্ডারের তারিখ" : "Gregorian date (no separate native date)";
  if (date.calendarYear !== undefined && date.calendarMonthName && date.calendarDay !== undefined) {
    const numeral = (n: number) => language === "bn" ? String(n).replace(/[0-9]/g, x => "০১২৩৪৫৬৭৮৯"[Number(x)]!) : String(n);
    return `${numeral(date.calendarDay)} ${date.calendarMonthName[language]} ${numeral(date.calendarYear)}`;
  }
  return date.labels.date[language];
}

export function listCalendarOptions() { return manager.listCalendars(); }
