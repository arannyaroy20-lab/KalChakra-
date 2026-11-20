export interface GeoLocation {
  name: string;
  latitude: number;
  longitude: number;
  elevationMeters?: number;
  timeZone: string;
}

export interface IndiaBengaliDateInput {
  year: number;
  month: number;
  day: number;
}

export interface IndiaBengaliDate extends IndiaBengaliDateInput {
  monthName: { bn: string; en: string };
  weekday: { bn: string; en: string };
  gregorianDate: string;
  calculation: CalculationMetadata;
}

export type SankrantiMethod = "surya-siddhanta" | "drik";

export interface CalculationMetadata {
  method: "meeus-analytical";
  sankrantiMethod: SankrantiMethod;
  ayanamsa: "lahiri-chitrapaksha-approximation";
  location: GeoLocation;
  timeZone: string;
  precisionNote: string;
  provenance: "calculated";
}

export interface TimedLimb {
  name: string;
  number: number;
  startsAt: string;
  endsAt: string;
}

export interface PanchangDay {
  date: string;
  sunrise: string;
  sunset: string;
  tithi: TimedLimb;
  nakshatra: TimedLimb;
  yoga: TimedLimb;
  karana: TimedLimb;
  bengaliDate: IndiaBengaliDate;
  calculation: CalculationMetadata;
}

export interface Sankranti {
  month: number;
  instant: string;
  localDate: string;
  startsBengaliDate: string;
  method: SankrantiMethod;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PanchangOptions {
  location?: GeoLocation;
}
