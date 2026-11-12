import type {
  CalendarEvent,
  EventCategory,
  HolidayStatus,
  VerificationStatus
} from "../../core/types/calendar-event.types.js";

export type BangladeshNationalEvent = CalendarEvent & {
  engine: "bd-national";
};

export interface EventQuery {
  from?: string;
  to?: string;
  categories?: EventCategory[];
  holidayStatuses?: HolidayStatus[];
  verificationStatuses?: VerificationStatus[];
  includeUnverified?: boolean;
}

export interface DatasetMetadata {
  year: number;
  datasetVersion: string;
  generatedAt: string;
  completeness: "partial" | "reviewed";
  notes: string[];
}

export interface YearDataset {
  metadata: DatasetMetadata;
  events: BangladeshNationalEvent[];
}
