import { bengaliToGregorian, formatBengaliDate, gregorianToBengali } from "../../engines/bd-bengali/bd-bengali.calendar.js";
import { BENGALI_MONTHS } from "../../engines/bd-bengali/constants.js";
import type { BengaliDateInput } from "../../engines/bd-bengali/types.js";
import type { CalendarEngineAdapter, CalendarMetadata } from "../types.js";

const metadata: CalendarMetadata = {
  id: "bd-bengali",
  name: { bn: "বাংলাদেশের সংশোধিত বাংলা বর্ষপঞ্জি", en: "Bangladesh Revised Bengali Calendar" },
  description: { bn: "বাংলা একাডেমির ২০১৯ সালের সংশোধিত বর্ষপঞ্জি", en: "Bangla Academy's revised 2019 Bengali calendar" },
  calendarType: "solar-bengali", capabilities: ["gregorian-to-calendar", "calendar-to-gregorian", "date-formatting"], availability: "available"
};

export const bdBengaliAdapter: CalendarEngineAdapter = {
  metadata,
  fromGregorian(date) { return { calendarId: "bd-bengali", gregorianDate: date, date: gregorianToBengali(date) }; },
  toGregorian(date) { return bengaliToGregorian(date as BengaliDateInput); },
  formatDate(date, language) {
    if (typeof date === "string") {
      const converted = gregorianToBengali(date);
      const month = BENGALI_MONTHS[converted.month - 1]!;
      const digits = language === "bn" ? `${converted.day} ${converted.year}`.replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[Number(d)]!) : `${converted.day} ${converted.year}`;
      return `${digits.split(" ")[0]} ${month[language]} ${digits.split(" ")[1]}`;
    }
    const input = date as BengaliDateInput;
    if (language === "bn") return formatBengaliDate(input);
    const month = BENGALI_MONTHS[input.month - 1]!;
    return `${input.day} ${month.en} ${input.year}`;
  }
};
