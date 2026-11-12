import { BENGALI_DIGITS, BENGALI_MONTHS, BENGALI_WEEKDAYS } from "./constants.js";
import { addUtcDays, daysBetween, formatIsoDate, isGregorianLeapYear, makeUtcDate, parseIsoDate } from "./date-utils.js";
import type { BengaliDate, BengaliDateInput, BengaliYearInfo } from "./types.js";

const YEAR_START_MONTH_INDEX = 3; // Gregorian April
const YEAR_START_DAY = 14;
const GREGORIAN_TO_BENGALI_YEAR_OFFSET = 593;

/**
 * In the revised Bangladesh calendar a Bangla year begins on 14 April.
 * Falgun is 30 days when the Gregorian leap day falls inside that Bangla
 * year (i.e. the Gregorian year after its starting April); otherwise 29.
 */
export function isBengaliLeapYear(bengaliYear: number): boolean {
  assertBengaliYear(bengaliYear);
  const gregorianFalgunYear = bengaliYear + GREGORIAN_TO_BENGALI_YEAR_OFFSET + 1;
  return isGregorianLeapYear(gregorianFalgunYear);
}

export function getBengaliMonthLengths(bengaliYear: number): readonly number[] {
  const falgunLength = isBengaliLeapYear(bengaliYear) ? 30 : 29;
  return [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgunLength, 30];
}

export function getBengaliYearInfo(bengaliYear: number): BengaliYearInfo {
  assertBengaliYear(bengaliYear);
  const gregorianStartYear = bengaliYear + GREGORIAN_TO_BENGALI_YEAR_OFFSET;
  const start = makeUtcDate(gregorianStartYear, YEAR_START_MONTH_INDEX, YEAR_START_DAY);
  const nextStart = makeUtcDate(gregorianStartYear + 1, YEAR_START_MONTH_INDEX, YEAR_START_DAY);
  const monthLengths = getBengaliMonthLengths(bengaliYear);
  return {
    year: bengaliYear,
    gregorianStartYear,
    startDate: formatIsoDate(start),
    endDate: formatIsoDate(addUtcDays(nextStart, -1)),
    isLeapYear: isBengaliLeapYear(bengaliYear),
    totalDays: monthLengths.reduce((sum, length) => sum + length, 0),
    monthLengths
  };
}

/** Convert a Gregorian ISO date (YYYY-MM-DD) to the revised Bangladesh date. */
export function gregorianToBengali(gregorianDate: string): BengaliDate {
  const gregorian = parseIsoDate(gregorianDate);
  if (!gregorian) throw new RangeError(`Invalid Gregorian date: ${gregorianDate}`);

  const gregorianYear = gregorian.getUTCFullYear();
  const currentYearStart = makeUtcDate(gregorianYear, YEAR_START_MONTH_INDEX, YEAR_START_DAY);
  const bengaliYear = gregorian >= currentYearStart
    ? gregorianYear - GREGORIAN_TO_BENGALI_YEAR_OFFSET
    : gregorianYear - GREGORIAN_TO_BENGALI_YEAR_OFFSET - 1;

  const yearInfo = getBengaliYearInfo(bengaliYear);
  const yearStart = parseIsoDate(yearInfo.startDate)!;
  let dayOfYear = daysBetween(yearStart, gregorian);
  const monthLengths = yearInfo.monthLengths;
  let monthIndex = 0;

  while (monthIndex < monthLengths.length - 1 && dayOfYear >= monthLengths[monthIndex]!) {
    dayOfYear -= monthLengths[monthIndex]!;
    monthIndex += 1;
  }

  const weekdayIndex = gregorian.getUTCDay();
  return {
    year: bengaliYear,
    month: monthIndex + 1,
    day: dayOfYear + 1,
    monthName: BENGALI_MONTHS[monthIndex]!,
    weekday: BENGALI_WEEKDAYS[weekdayIndex]!,
    gregorianDate
  };
}

/** Convert a revised Bangladesh Bengali date to a Gregorian ISO date. */
export function bengaliToGregorian(input: BengaliDateInput): string {
  validateBengaliDate(input);
  const yearInfo = getBengaliYearInfo(input.year);
  const start = parseIsoDate(yearInfo.startDate)!;
  const daysBeforeMonth = yearInfo.monthLengths
    .slice(0, input.month - 1)
    .reduce((sum, length) => sum + length, 0);
  return formatIsoDate(addUtcDays(start, daysBeforeMonth + input.day - 1));
}

export function isValidBengaliDate(input: BengaliDateInput): boolean {
  if (!Number.isInteger(input.year) || input.year < 1 || input.year > 9405) return false;
  if (!Number.isInteger(input.month) || input.month < 1 || input.month > 12) return false;
  if (!Number.isInteger(input.day) || input.day < 1) return false;
  return input.day <= getBengaliMonthLengths(input.year)[input.month - 1]!;
}

export function validateBengaliDate(input: BengaliDateInput): void {
  if (!isValidBengaliDate(input)) {
    throw new RangeError(`Invalid Bangladesh Bengali date: ${input.year}-${input.month}-${input.day}`);
  }
}

export function toBengaliNumerals(value: number | string): string {
  return String(value).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[Number(digit)]!);
}

export function formatBengaliDate(input: BengaliDateInput, includeWeekday = false): string {
  validateBengaliDate(input);
  const month = BENGALI_MONTHS[input.month - 1]!;
  const gregorianDate = bengaliToGregorian(input);
  const weekday = BENGALI_WEEKDAYS[parseIsoDate(gregorianDate)!.getUTCDay()]!;
  const date = `${toBengaliNumerals(input.day)} ${month.bn} ${toBengaliNumerals(input.year)}`;
  return includeWeekday ? `${weekday.bn}, ${date}` : date;
}

function assertBengaliYear(year: number): void {
  if (!Number.isInteger(year) || year < 1 || year > 9405) {
    throw new RangeError(`Unsupported Bengali year: ${year}`);
  }
}
