import type { CalendarEvent } from "../../../core/types/calendar-event.types.js";
import type { BangladeshNationalEvent } from "../types.js";
import { isValidIsoDate } from "./date-utils.js";

export interface ValidationIssue {
  eventId: string;
  field: string;
  message: string;
}

export function validateEvent(event: BangladeshNationalEvent): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (field: string, message: string) =>
    issues.push({ eventId: event.id, field, message });

  if (!event.id.trim()) add("id", "Event id is required.");
  if (event.engine !== "bd-national") add("engine", "Wrong calendar engine.");
  if (!event.title.bn.trim()) add("title.bn", "Bengali title is required.");
  if (!event.title.en.trim()) add("title.en", "English title is required.");
  if (!event.description.bn.trim()) add("description.bn", "Bengali description is required.");
  if (!event.description.en.trim()) add("description.en", "English description is required.");
  if (!isValidIsoDate(event.startDate)) add("startDate", "Must be a real YYYY-MM-DD date.");
  if (!isValidIsoDate(event.endDate)) add("endDate", "Must be a real YYYY-MM-DD date.");
  if (isValidIsoDate(event.startDate) && isValidIsoDate(event.endDate) &&
      event.endDate < event.startDate) {
    add("endDate", "End date cannot be earlier than start date.");
  }
  if (event.verificationStatus === "verified" && event.sources.length === 0) {
    add("sources", "Verified events must have at least one source.");
  }
  for (const [index, source] of event.sources.entries()) {
    if (!source.publisher.trim()) add(`sources.${index}.publisher`, "Publisher is required.");
    if (!source.title.trim()) add(`sources.${index}.title`, "Source title is required.");
    try {
      const url = new URL(source.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        add(`sources.${index}.url`, "Source URL must use HTTP or HTTPS.");
      }
    } catch {
      add(`sources.${index}.url`, "Source URL must be valid.");
    }
    if (!isValidIsoDate(source.accessedAt)) {
      add(`sources.${index}.accessedAt`, "Access date must use YYYY-MM-DD.");
    }
  }
  return issues;
}

export function validateEvents(events: readonly BangladeshNationalEvent[]): ValidationIssue[] {
  return events.flatMap(validateEvent);
}

export function assertCalendarEventEngine(event: CalendarEvent): event is BangladeshNationalEvent {
  return event.engine === "bd-national";
}
