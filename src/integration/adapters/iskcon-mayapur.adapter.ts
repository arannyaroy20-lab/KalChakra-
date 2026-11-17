import { IskconMayapurCalendarEngine } from "../../engines/iskcon-mayapur/iskcon-mayapur.engine.js";
import { DEFAULT_LOCATION } from "../../engines/iskcon-mayapur/constants.js";
import type { CalendarEngineAdapter, CalendarMetadata } from "../types.js";
import { formatGregorianDate } from "../formatting.js";

const engine = new IskconMayapurCalendarEngine();
const metadata: CalendarMetadata = {
  id: "iskcon-mayapur", name: { bn: "ইসকন মায়াপুর বৈষ্ণব ক্যালেন্ডার", en: "ISKCON Mayapur Calendar" },
  description: { bn: "মায়াপুরের পঞ্চাঙ্গ, একাদশী ও বৈষ্ণবীয় অনুষ্ঠান", en: "Mayapur Panchang, Ekadashi and Vaishnava observances" },
  calendarType: "vaishnava-lunisolar", capabilities: ["date-formatting", "calendar-information", "panchang", "events", "observances"],
  defaultLocation: { name: DEFAULT_LOCATION.name, latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude, timeZone: DEFAULT_LOCATION.timeZone },
  availability: "limited", availabilityNote: { bn: "প্রকাশিত ২০২৬–২৭ তথ্য সীমিত; অন্যান্য গণনা অনিশ্চিত", en: "Published 2026–27 reference coverage is partial; other calculations are provisional" }
};

export const iskconMayapurAdapter: CalendarEngineAdapter = {
  metadata,
  formatDate(date, language) {
    if (typeof date !== "string") throw new TypeError("ISKCON Mayapur formatting accepts Gregorian ISO date strings");
    return formatGregorianDate(date, language);
  },
  getInfo: date => engine.getDay(date),
  getEvents: (from, to) => engine.getEvents(from, to)
};
