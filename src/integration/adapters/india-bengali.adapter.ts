import { bengaliToGregorian, gregorianToBengali } from "../../engines/india-bengali/calendar-conversion.js";
import { DEFAULT_LOCATION, INDIA_BENGALI_MONTHS } from "../../engines/india-bengali/constants.js";
import type { IndiaBengaliDateInput } from "../../engines/india-bengali/types.js";
import type { CalendarEngineAdapter, CalendarMetadata } from "../types.js";
import { localizeDigits } from "../formatting.js";

const metadata: CalendarMetadata = {
  id: "india-bengali",
  name: { bn: "পশ্চিমবঙ্গের বাংলা পঞ্জিকা", en: "India Bengali Calendar (West Bengal Panjika)" },
  description: { bn: "সঙ্ক্রান্তি-ভিত্তিক পশ্চিমবঙ্গীয় সৌর বাংলা পঞ্জিকা", en: "Sankranti-based West Bengal solar Bengali calendar" },
  calendarType: "solar-bengali", capabilities: ["gregorian-to-calendar", "calendar-to-gregorian", "date-formatting"],
  defaultLocation: { name: DEFAULT_LOCATION.name, latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude, timeZone: DEFAULT_LOCATION.timeZone }, availability: "limited",
  availabilityNote: { bn: "Meeus-ভিত্তিক গণনা; প্রকাশক-নির্দিষ্ট পঞ্জিকা নয়", en: "Meeus-based calculation; not a publisher-specific Panjika" }
};

export const indiaBengaliAdapter: CalendarEngineAdapter = {
  metadata,
  fromGregorian(date) { return { calendarId: "india-bengali", gregorianDate: date, date: gregorianToBengali(date) }; },
  toGregorian(date) { return bengaliToGregorian(date as IndiaBengaliDateInput); },
  formatDate(date, language) {
    const value = typeof date === "string" ? gregorianToBengali(date) : date as IndiaBengaliDateInput;
    const month = INDIA_BENGALI_MONTHS[value.month - 1]!;
    return `${localizeDigits(String(value.day), language)} ${month[language]} ${localizeDigits(String(value.year), language)}`;
  }
};
