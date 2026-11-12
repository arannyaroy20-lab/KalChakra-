import { INDIA_BENGALI_MONTHS, INDIA_BENGALI_WEEKDAYS, DEFAULT_LOCATION } from "./constants.js";
import { siderealSunLongitude } from "./astronomy/meeus.js";
import type { GeoLocation, IndiaBengaliDate, IndiaBengaliDateInput, Sankranti, ValidationResult } from "./types.js";
import { addDays, assertValidDate, dayDifference, localDateAt, validateLocation } from "./services/date-time.js";

const DAY_MS = 86_400_000;
const metadata = (location: GeoLocation) => ({
  method: "meeus-analytical" as const,
  ayanamsa: "lahiri-chitrapaksha-approximation" as const,
  location,
  timeZone: location.timeZone,
  precisionNote: "Analytical Meeus-based approximation; not an official published Panjika and not a substitute for a named family almanac.",
  provenance: "calculated" as const
});

function signedAngle(value: number): number { return ((value + 540) % 360) - 180; }

export function findSankranti(gregorianYear: number, month: number, location: GeoLocation = DEFAULT_LOCATION): Sankranti {
  validateLocation(location);
  if (!Number.isInteger(gregorianYear) || gregorianYear < 1800 || gregorianYear > 2200) throw new RangeError("Supported Gregorian years are 1800–2200");
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError("Month must be 1–12");
  const target = (month - 1) * 30;
  const approxMonth = (month + 2) % 12;
  const approxYear = gregorianYear;
  const approx = Date.UTC(approxYear, approxMonth, 15, 12);
  const start = approx - 11 * DAY_MS;
  const end = approx + 11 * DAY_MS;
  let previous = start;
  let previousDiff = signedAngle(siderealSunLongitude(previous / DAY_MS + 2_440_587.5) - target);
  let bracket: [number, number] | undefined;
  for (let current = start + 6 * 3_600_000; current <= end; current += 6 * 3_600_000) {
    const diff = signedAngle(siderealSunLongitude(current / DAY_MS + 2_440_587.5) - target);
    if (previousDiff <= 0 && diff >= 0 && diff - previousDiff < 10) { bracket = [previous, current]; break; }
    previous = current;
    previousDiff = diff;
  }
  if (!bracket) throw new Error(`Could not bracket ${month}° Sankranti for ${gregorianYear}`);
  let [low, high] = bracket;
  for (let i = 0; i < 48; i++) {
    const mid = (low + high) / 2;
    const diff = signedAngle(siderealSunLongitude(mid / DAY_MS + 2_440_587.5) - target);
    if (diff >= 0) high = mid; else low = mid;
  }
  const instant = new Date((low + high) / 2);
  const localDate = localDateAt(instant, location.timeZone);
  return { month, instant: instant.toISOString(), localDate, startsBengaliDate: addDays(localDate, 1) };
}

function monthStartForBengaliYear(year: number, month: number, location: GeoLocation): string {
  const gregorianYear = year + 593 + (month >= 10 ? 1 : 0);
  const ingress = findSankranti(gregorianYear, month, location);
  return ingress.startsBengaliDate;
}

export function validateIndiaBengaliDate(input: IndiaBengaliDateInput, location: GeoLocation = DEFAULT_LOCATION): ValidationResult {
  const errors: string[] = [];
  if (!Number.isInteger(input.year) || input.year < 1207 || input.year > 1606) errors.push("Bengali year must be an integer from 1207 to 1606");
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) errors.push("Bengali month must be an integer from 1 to 12");
  if (!Number.isInteger(input.day) || input.day < 1 || input.day > 32) errors.push("Bengali day must be an integer from 1 to 32");
  try { validateLocation(location); } catch (error) { errors.push(error instanceof Error ? error.message : "Invalid location"); }
  if (errors.length === 0) {
    try {
      const start = monthStartForBengaliYear(input.year, input.month, location);
      const nextMonth = input.month === 12 ? monthStartForBengaliYear(input.year + 1, 1, location) : monthStartForBengaliYear(input.year, input.month + 1, location);
      const length = dayDifference(start, nextMonth);
      if (input.day > length) errors.push(`Day ${input.day} is invalid; this Panjika month has ${length} days`);
    } catch (error) { errors.push(error instanceof Error ? error.message : "Could not validate date"); }
  }
  return { valid: errors.length === 0, errors };
}

export function bengaliToGregorian(input: IndiaBengaliDateInput, location: GeoLocation = DEFAULT_LOCATION): string {
  const result = validateIndiaBengaliDate(input, location);
  if (!result.valid) throw new RangeError(result.errors.join("; "));
  return addDays(monthStartForBengaliYear(input.year, input.month, location), input.day - 1);
}

export function gregorianToBengali(date: string, location: GeoLocation = DEFAULT_LOCATION): IndiaBengaliDate {
  assertValidDate(date);
  validateLocation(location);
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const bengaliYear = year - (month >= 4 ? 593 : 594);
  const approximateMonth = month >= 4 ? month - 3 : month + 9;
  const ingress = findSankranti(year, approximateMonth, location);
  let selectedMonth = approximateMonth;
  let startDate = ingress.startsBengaliDate;
  if (date < startDate) {
    selectedMonth = approximateMonth === 1 ? 12 : approximateMonth - 1;
    const previousYear = selectedMonth === 12 ? bengaliYear - 1 : bengaliYear;
    startDate = monthStartForBengaliYear(previousYear, selectedMonth, location);
  }
  const actualYear = selectedMonth === 12 && approximateMonth === 1 ? bengaliYear - 1 : bengaliYear;
  const monthDay = dayDifference(startDate, date) + 1;
  if (monthDay < 1 || monthDay > 32) throw new RangeError("Date falls outside the calculated Bengali solar month; check the location or calculation range");
  const weekdayIndex = new Date(`${date}T00:00:00Z`).getUTCDay();
  return {
    year: actualYear,
    month: selectedMonth,
    day: monthDay,
    monthName: INDIA_BENGALI_MONTHS[selectedMonth - 1]!,
    weekday: INDIA_BENGALI_WEEKDAYS[weekdayIndex]!,
    gregorianDate: date,
    calculation: metadata(location)
  };
}

export function getMonthStart(year: number, month: number, location: GeoLocation = DEFAULT_LOCATION): string {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError("Month must be 1–12");
  return monthStartForBengaliYear(year, month, location);
}

export function getCalculationMetadata(location: GeoLocation = DEFAULT_LOCATION) {
  validateLocation(location);
  return metadata(location);
}
