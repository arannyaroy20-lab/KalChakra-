import type { DisplayLanguage } from "./types.js";
import { toBengaliNumerals } from "../engines/bd-bengali/bd-bengali.calendar.js";

export function formatGregorianDate(date: string, language: DisplayLanguage): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RangeError(`Invalid Gregorian date: ${date}`);
  const value = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(value.getTime()) || value.toISOString().slice(0, 10) !== date) throw new RangeError(`Invalid Gregorian date: ${date}`);
  const formatted = new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
  }).format(value);
  return language === "bn" ? formatted : formatted;
}

export function localizeDigits(value: string, language: DisplayLanguage): string {
  return language === "bn" ? toBengaliNumerals(value) : value;
}
