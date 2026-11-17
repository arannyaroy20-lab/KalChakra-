import { BangladeshNationalCalendarEngine } from "../../engines/bd-national/bd-national.engine.js";
import type { CalendarEngineAdapter, CalendarMetadata } from "../types.js";
import { formatGregorianDate } from "../formatting.js";

const engine = new BangladeshNationalCalendarEngine();
const metadata: CalendarMetadata = {
  id: "bd-national",
  name: { bn: "বাংলাদেশ জাতীয় ক্যালেন্ডার", en: "Bangladesh National Calendar" },
  description: { bn: "জাতীয় দিবস, সরকারি ছুটি ও অন্যান্য নথিভুক্ত অনুষ্ঠান", en: "National days, public holidays and other recorded observances" },
  calendarType: "national",
  capabilities: ["date-formatting", "events"],
  availability: "limited",
  availabilityNote: { bn: "বর্তমানে ২০২৬ ও ২০২৭ সালের ইভেন্ট ডেটাসেট অন্তর্ভুক্ত", en: "Event datasets currently cover 2026 and 2027" }
};

export const bdNationalAdapter: CalendarEngineAdapter = {
  metadata,
  formatDate: (date, language) => formatGregorianDate(typeof date === "string" ? date : (() => { throw new TypeError("Bangladesh National Calendar formats Gregorian ISO date strings only"); })(), language),
  getEvents: (from, to) => engine.getEventsInRange(from, to)
};
