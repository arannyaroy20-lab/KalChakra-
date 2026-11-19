import type { CalendarEvent, EventSource, VerificationStatus } from "../core/types/calendar-event.types.js";
import type { BengaliDate } from "../engines/bd-bengali/types.js";
import type { IndiaBengaliDate } from "../engines/india-bengali/types.js";
import type { AstronomicalDay, EkadashiObservance, MayapurFestival } from "../engines/iskcon-mayapur/types.js";
import type { CalendarId, DisplayLanguage, LocalizedLabel } from "../integration/types.js";

export interface LocalizedDateLabels {
  month: LocalizedLabel;
  date: LocalizedLabel;
}

export interface CalendarDateModel {
  gregorianDate: string;
  calendarId: CalendarId;
  /** Present only when the source engine exposes a native calendar date. */
  calendarYear?: number;
  calendarMonthNumber?: number;
  calendarMonthName?: LocalizedLabel;
  calendarDay?: number;
  labels: LocalizedDateLabels;
  weekday?: LocalizedLabel;
  astronomical?: {
    method?: string;
    source?: string;
    verification?: "verified-reference" | "calculated-unverified" | VerificationStatus;
    precisionNote?: string;
  };
  location?: { name: string; latitude: number; longitude: number };
  timeZone?: string;
  /** Retains the original engine result without translating or recalculating it. */
  original: BengaliDate | IndiaBengaliDate | AstronomicalDay | { gregorianDate: string; calendarId: "bd-national" };
}

export type UnifiedCalendarEvent =
  | { engine: "bd-national"; kind: "calendar-event"; value: CalendarEvent }
  | { engine: "iskcon-mayapur"; kind: "festival"; value: MayapurFestival }
  | { engine: "iskcon-mayapur"; kind: "ekadashi"; value: EkadashiObservance };

export interface UnifiedPanchang {
  engine: "iskcon-mayapur";
  tithi: AstronomicalDay["tithi"];
  nakshatra: string;
  yoga: string;
  karana: string;
  moonrise: null;
  moonset: null;
}

export interface UnifiedCalendarDay {
  date: CalendarDateModel;
  events: UnifiedCalendarEvent[];
  panchang?: UnifiedPanchang;
  sunrise?: string;
  sunset?: string;
  provenance: {
    sources: EventSource[];
    sourceIdentifiers: string[];
    verification: Array<string>;
    calculation?: AstronomicalDay["calculation"];
  };
}

export interface NormalizationOptions {
  language?: DisplayLanguage;
}
