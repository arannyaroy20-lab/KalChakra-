import type { BangladeshNationalEvent } from "../engines/bd-national/types.js";
import type { BengaliDate, BengaliDateInput } from "../engines/bd-bengali/types.js";
import type { IndiaBengaliDate, IndiaBengaliDateInput } from "../engines/india-bengali/types.js";
import type { AstronomicalDay, MayapurFestival, EkadashiObservance } from "../engines/iskcon-mayapur/types.js";

export type CalendarId = "bd-national" | "bd-bengali" | "india-bengali" | "iskcon-mayapur";
export type DisplayLanguage = "bn" | "en";
export type CalendarType = "national" | "solar-bengali" | "vaishnava-lunisolar";
export type CalendarCapability =
  | "gregorian-to-calendar" | "calendar-to-gregorian" | "date-formatting"
  | "calendar-information" | "events" | "panchang" | "observances";

export interface LocalizedLabel { bn: string; en: string }
export interface CalendarMetadata {
  id: CalendarId;
  name: LocalizedLabel;
  description: LocalizedLabel;
  calendarType: CalendarType;
  capabilities: readonly CalendarCapability[];
  defaultLocation?: { name: string; latitude: number; longitude: number; timeZone: string };
  availability: "available" | "limited";
  availabilityNote?: LocalizedLabel;
}

export type CalendarDate = BengaliDate | IndiaBengaliDate;
export type CalendarDateInput = BengaliDateInput | IndiaBengaliDateInput;
export type CalendarEvents = BangladeshNationalEvent[] | (MayapurFestival | EkadashiObservance)[];
export type CalendarConversion =
  | { calendarId: "bd-bengali"; gregorianDate: string; date: BengaliDate }
  | { calendarId: "india-bengali"; gregorianDate: string; date: IndiaBengaliDate };

export interface CalendarEngineAdapter {
  readonly metadata: CalendarMetadata;
  fromGregorian?(date: string): CalendarConversion;
  toGregorian?(date: CalendarDateInput): string;
  formatDate?(date: string | CalendarDateInput, language: DisplayLanguage): string;
  getInfo?(date: string): AstronomicalDay;
  getEvents?(from: string, to: string): CalendarEvents;
}

export interface CalendarRegistryEntry extends CalendarMetadata {
  adapter: CalendarEngineAdapter;
}
