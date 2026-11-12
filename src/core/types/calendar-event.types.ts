export type CalendarEngine =
  | "bd-national"
  | "bd-bengali"
  | "india-bengali"
  | "iskcon-mayapur";

export type EventCategory =
  | "national"
  | "historical"
  | "religious"
  | "cultural"
  | "international"
  | "government"
  | "other";

export type HolidayStatus =
  | "none"
  | "general-holiday"
  | "executive-holiday"
  | "optional-holiday"
  | "restricted-holiday"
  | "regional-holiday"
  | "unknown";

export type VerificationStatus = "verified" | "provisional" | "unverified";

export type DateStatus =
  | "fixed"
  | "officially-announced"
  | "provisional"
  | "subject-to-moon-sighting"
  | "panjika-dependent";

export interface LocalizedText {
  bn: string;
  en: string;
}

export interface EventSource {
  publisher: string;
  title: string;
  url: string;
  publishedAt?: string;
  accessedAt: string;
  authority: "primary" | "secondary";
}

export interface OriginalCalendarDate {
  calendar: string;
  value: string;
}

export interface CalendarEvent {
  id: string;
  engine: CalendarEngine;
  title: LocalizedText;
  description: LocalizedText;
  startDate: string;
  endDate: string;
  category: EventCategory;
  holidayStatus: HolidayStatus;
  verificationStatus: VerificationStatus;
  dateStatus: DateStatus;
  sources: EventSource[];
  location?: string;
  originalDate?: OriginalCalendarDate;
  dateNote?: string;
  tags?: string[];
}
