import type { CalendarEvent, EventSource } from "../core/types/calendar-event.types.js";
import { BENGALI_MONTHS } from "../engines/bd-bengali/constants.js";
import { bengaliToGregorian as bdBengaliToGregorian } from "../engines/bd-bengali/bd-bengali.calendar.js";
import type { BengaliDate } from "../engines/bd-bengali/types.js";
import { INDIA_BENGALI_MONTHS } from "../engines/india-bengali/constants.js";
import { bengaliToGregorian as indiaBengaliToGregorian } from "../engines/india-bengali/calendar-conversion.js";
import type { IndiaBengaliDate } from "../engines/india-bengali/types.js";
import type { AstronomicalDay, EkadashiObservance, MayapurFestival } from "../engines/iskcon-mayapur/types.js";
import { formatGregorianDate, localizeDigits } from "../integration/formatting.js";
import type { DisplayLanguage } from "../integration/types.js";
import type { CalendarDateModel, NormalizationOptions, UnifiedCalendarDay, UnifiedCalendarEvent } from "./types.js";
import { assertCalendarId, assertIsoDate, assertIsoDateTime, assertLocalizedLabel, assertPositiveInteger, parseIsoDateTime } from "./validation.js";

const languageOf = (options?: NormalizationOptions): DisplayLanguage => options?.language ?? "en";
const dateLabels = (day: number, month: { bn: string; en: string }, year: number): { month: { bn: string; en: string }; date: { bn: string; en: string } } => ({
  month: { ...month },
  date: { bn: `${localizeDigits(String(day), "bn")} ${month.bn} ${localizeDigits(String(year), "bn")}`, en: `${day} ${month.en} ${year}` }
});

function validateBengaliDate(value: BengaliDate): void {
  assertIsoDate(value.gregorianDate, "gregorianDate");
  assertPositiveInteger(value.year, "calendarYear"); assertPositiveInteger(value.month, "calendarMonthNumber"); assertPositiveInteger(value.day, "calendarDay");
  if (value.month > 12 || value.day > 31) throw new RangeError("Bangladesh Bengali month must be 1–12 and day must be 1–31");
  assertLocalizedLabel(value.monthName, "monthName"); assertLocalizedLabel(value.weekday, "weekday");
  const expectedGregorian = bdBengaliToGregorian({ year: value.year, month: value.month, day: value.day });
  if (expectedGregorian !== value.gregorianDate) throw new RangeError(`Bangladesh Bengali date fields resolve to ${expectedGregorian}, not ${value.gregorianDate}`);
}

function validateIndiaDate(value: IndiaBengaliDate): void {
  assertIsoDate(value.gregorianDate, "gregorianDate");
  assertPositiveInteger(value.year, "calendarYear"); assertPositiveInteger(value.month, "calendarMonthNumber"); assertPositiveInteger(value.day, "calendarDay");
  if (value.month > 12 || value.day > 32) throw new RangeError("West Bengal Bengali month must be 1–12 and day must be 1–32");
  assertLocalizedLabel(value.monthName, "monthName"); assertLocalizedLabel(value.weekday, "weekday");
  if (!value.calculation || !value.calculation.location || !value.calculation.timeZone) throw new TypeError("West Bengal Bengali calculation metadata and location are required");
  if (value.calculation.location.timeZone !== value.calculation.timeZone) throw new TypeError("West Bengal Bengali location timezone does not match calculation timezone");
  const expectedGregorian = indiaBengaliToGregorian({ year: value.year, month: value.month, day: value.day }, value.calculation.location);
  if (expectedGregorian !== value.gregorianDate) throw new RangeError(`West Bengal Bengali date fields resolve to ${expectedGregorian}, not ${value.gregorianDate}`);
}

export function normalizeBdNationalDate(gregorianDate: string, events: readonly CalendarEvent[] = [], options?: NormalizationOptions): UnifiedCalendarDay {
  assertIsoDate(gregorianDate, "gregorianDate");
  const localized = { bn: formatGregorianDate(gregorianDate, "bn"), en: formatGregorianDate(gregorianDate, "en") };
  const monthDate = new Date(`${gregorianDate}T00:00:00.000Z`);
  const month = { bn: new Intl.DateTimeFormat("bn-BD", { month: "long", timeZone: "UTC" }).format(monthDate), en: new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(monthDate) };
  const matchingEvents = events.filter(event => {
    assertCalendarId(event.engine, "bd-national");
    assertIsoDate(event.startDate, `event ${event.id} startDate`); assertIsoDate(event.endDate, `event ${event.id} endDate`);
    if (event.endDate < event.startDate) throw new RangeError(`Event ${event.id} endDate must not precede startDate`);
    return event.startDate <= gregorianDate && event.endDate >= gregorianDate;
  });
  const dayEvents: UnifiedCalendarEvent[] = matchingEvents.map(value => ({ engine: "bd-national", kind: "calendar-event", value }));
  const sources = matchingEvents.flatMap(event => event.sources);
  const verification = matchingEvents.map(event => event.verificationStatus);
  const date: CalendarDateModel = {
    gregorianDate, calendarId: "bd-national", labels: { month, date: { ...localized } },
    original: { gregorianDate, calendarId: "bd-national" }
  };
  return { date, events: dayEvents, provenance: { sources: copySources(sources), sourceIdentifiers: [], verification } };
}

export function normalizeBdBengaliDate(value: BengaliDate, _options?: NormalizationOptions): CalendarDateModel {
  validateBengaliDate(value);
  const month = BENGALI_MONTHS[value.month - 1];
  if (!month || month.bn !== value.monthName.bn || month.en !== value.monthName.en) throw new TypeError("Bangladesh Bengali monthName does not match its month number");
  return {
    gregorianDate: value.gregorianDate, calendarId: "bd-bengali", calendarYear: value.year, calendarMonthNumber: value.month,
    calendarMonthName: { ...value.monthName }, calendarDay: value.day,
    labels: dateLabels(value.day, value.monthName, value.year), weekday: { ...value.weekday }, original: { ...value }
  };
}

export function normalizeBdBengaliDay(value: BengaliDate, options?: NormalizationOptions): UnifiedCalendarDay {
  return { date: normalizeBdBengaliDate(value, options), events: [], provenance: { sources: [], sourceIdentifiers: [], verification: [] } };
}

export function normalizeIndiaBengaliDate(value: IndiaBengaliDate, _options?: NormalizationOptions): CalendarDateModel {
  validateIndiaDate(value);
  const month = INDIA_BENGALI_MONTHS[value.month - 1];
  if (!month || month.bn !== value.monthName.bn || month.en !== value.monthName.en) throw new TypeError("West Bengal Bengali monthName does not match its month number");
  return {
    gregorianDate: value.gregorianDate, calendarId: "india-bengali", calendarYear: value.year, calendarMonthNumber: value.month,
    calendarMonthName: { ...value.monthName }, calendarDay: value.day,
    labels: dateLabels(value.day, value.monthName, value.year), weekday: { ...value.weekday },
    astronomical: { method: value.calculation.method, source: value.calculation.provenance, precisionNote: value.calculation.precisionNote },
    location: { name: value.calculation.location.name, latitude: value.calculation.location.latitude, longitude: value.calculation.location.longitude },
    timeZone: value.calculation.timeZone, original: structuredClone(value)
  };
}

export function normalizeIndiaBengaliDay(value: IndiaBengaliDate, options?: NormalizationOptions): UnifiedCalendarDay {
  const date = normalizeIndiaBengaliDate(value, options);
  return {
    date, events: [],
    provenance: {
      sources: [], sourceIdentifiers: [value.calculation.provenance],
      verification: [value.calculation.provenance]
    }
  };
}

export function normalizeIskconMayapurDay(value: AstronomicalDay, events: readonly (MayapurFestival | EkadashiObservance)[] = [], options?: NormalizationOptions): UnifiedCalendarDay {
  assertIsoDate(value.date, "Mayapur date");
  assertIsoDateTime(value.sunrise, "sunrise"); assertIsoDateTime(value.sunset, "sunset");
  if (!value.sunrise.startsWith(`${value.date}T`) || !value.sunset.startsWith(`${value.date}T`)) throw new RangeError("Mayapur sunrise and sunset must belong to the supplied local date");
  if (parseIsoDateTime(value.sunset) <= parseIsoDateTime(value.sunrise)) throw new RangeError("sunset must occur after sunrise");
  if (!value.calculation || !value.calculation.location || !value.calculation.timeZone || !value.calculation.verification) throw new TypeError("Mayapur calculation provenance, location and verification are required");
  const localized = { bn: formatGregorianDate(value.date, "bn"), en: formatGregorianDate(value.date, "en") };
  const d = new Date(`${value.date}T00:00:00.000Z`);
  const month = { bn: new Intl.DateTimeFormat("bn-BD", { month: "long", timeZone: "UTC" }).format(d), en: new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(d) };
  const normalizedEvents: UnifiedCalendarEvent[] = [];
  const sourceIdentifiers: string[] = [];
  const verification: string[] = [value.calculation.verification];
  for (const event of events) {
    if ("fastDate" in event) {
      assertIsoDate(event.fastDate, "Ekadashi fastDate"); assertIsoDate(event.paranaDate, "Ekadashi paranaDate");
      if (!event.name || !event.source || !event.verification) throw new TypeError("Ekadashi event must include name, source and verification");
      if (event.fastDate === value.date || event.paranaDate === value.date) {
        normalizedEvents.push({ engine: "iskcon-mayapur", kind: "ekadashi", value: structuredClone(event) });
        sourceIdentifiers.push(event.source); verification.push(event.verification);
      }
    } else {
      assertIsoDate(event.date, "Mayapur festival date");
      if (!event.name || !event.source || !event.verification) throw new TypeError("Mayapur festival must include name, source and verification");
      if (event.date === value.date) {
        normalizedEvents.push({ engine: "iskcon-mayapur", kind: "festival", value: structuredClone(event) });
        sourceIdentifiers.push(event.source); verification.push(event.verification);
      }
    }
  }
  const date: CalendarDateModel = {
    gregorianDate: value.date, calendarId: "iskcon-mayapur", labels: { month, date: localized },
    astronomical: { method: value.calculation.method, source: value.calculation.source, verification: value.calculation.verification, precisionNote: value.calculation.precisionNote },
    location: { name: value.calculation.location.name, latitude: value.calculation.location.latitude, longitude: value.calculation.location.longitude },
    timeZone: value.calculation.timeZone, original: structuredClone(value)
  };
  return {
    date, events: normalizedEvents,
    panchang: { engine: "iskcon-mayapur", tithi: structuredClone(value.tithi), nakshatra: value.nakshatra, yoga: value.yoga, karana: value.karana, moonrise: value.moonrise, moonset: value.moonset },
    sunrise: value.sunrise, sunset: value.sunset,
    provenance: { sources: [], sourceIdentifiers: [...new Set(sourceIdentifiers)], verification: [...new Set(verification)], calculation: structuredClone(value.calculation) }
  };
}

export function normalizeCalendarDate(value: BengaliDate | IndiaBengaliDate, options?: NormalizationOptions): CalendarDateModel {
  if ("calculation" in value) return normalizeIndiaBengaliDate(value, options);
  return normalizeBdBengaliDate(value, options);
}

function copySources(sources: readonly EventSource[]): EventSource[] { return sources.map(source => ({ ...source })); }

export function getLocalizedCalendarDateLabel(value: CalendarDateModel, language: DisplayLanguage): string {
  return value.labels.date[language];
}

export function getLocalizedCalendarMonthLabel(value: CalendarDateModel, language: DisplayLanguage): string {
  return value.labels.month[language];
}
