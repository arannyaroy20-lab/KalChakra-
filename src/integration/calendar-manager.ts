import { CALENDAR_REGISTRY, isCalendarId, listCalendarRegistry } from "./calendar-registry.js";
import type { CalendarConversion, CalendarEngineAdapter, CalendarId, CalendarMetadata, DisplayLanguage } from "./types.js";

export class InvalidCalendarIdError extends Error {
  constructor(id: string) { super(`Unknown calendar engine ID: "${id}". Available IDs: ${Object.keys(CALENDAR_REGISTRY).join(", ")}`); this.name = "InvalidCalendarIdError"; }
}

export class UnsupportedCalendarOperationError extends Error {
  constructor(id: CalendarId, operation: string) { super(`Calendar "${id}" does not support operation "${operation}".`); this.name = "UnsupportedCalendarOperationError"; }
}

export interface LocalizedCalendarMetadata {
  id: CalendarId;
  name: string;
  description: string;
  calendarType: CalendarMetadata["calendarType"];
  capabilities: CalendarMetadata["capabilities"];
  defaultLocation?: CalendarMetadata["defaultLocation"];
  availability: CalendarMetadata["availability"];
  availabilityNote?: string;
}

export class CalendarManager {
  private selectedCalendarId: CalendarId;
  private displayLanguage: DisplayLanguage;

  constructor(options: { selectedCalendarId?: CalendarId; language?: DisplayLanguage } = {}) {
    this.selectedCalendarId = options.selectedCalendarId ?? "bd-national";
    this.displayLanguage = options.language ?? "en";
    this.assertCalendarId(this.selectedCalendarId);
  }

  listCalendars(): CalendarMetadata[] {
    return listCalendarRegistry().map(({ adapter: _adapter, ...metadata }) => metadata);
  }

  getCalendar(id: string): CalendarEngineAdapter {
    this.assertCalendarId(id);
    return CALENDAR_REGISTRY[id].adapter;
  }

  getSelectedCalendarId(): CalendarId { return this.selectedCalendarId; }

  setSelectedCalendar(id: string): void {
    this.assertCalendarId(id);
    this.selectedCalendarId = id;
  }

  setDisplayLanguage(language: DisplayLanguage): void {
    if (language !== "bn" && language !== "en") throw new RangeError(`Unsupported display language: ${String(language)}`);
    this.displayLanguage = language;
  }

  getDisplayLanguage(): DisplayLanguage { return this.displayLanguage; }

  getSelectedCalendarMetadata(): CalendarMetadata {
    const { adapter: _adapter, ...metadata } = CALENDAR_REGISTRY[this.selectedCalendarId];
    return metadata;
  }

  getLocalizedSelectedCalendarMetadata(): LocalizedCalendarMetadata {
    const metadata = this.getSelectedCalendarMetadata();
    const language = this.displayLanguage;
    return {
      id: metadata.id,
      name: metadata.name[language],
      description: metadata.description[language],
      calendarType: metadata.calendarType,
      capabilities: metadata.capabilities,
      ...(metadata.defaultLocation ? { defaultLocation: metadata.defaultLocation } : {}),
      availability: metadata.availability,
      ...(metadata.availabilityNote ? { availabilityNote: metadata.availabilityNote[language] } : {})
    };
  }

  convertGregorianDate(date: string): CalendarConversion {
    const adapter = this.getSelectedAdapter();
    if (!adapter.fromGregorian) throw new UnsupportedCalendarOperationError(this.selectedCalendarId, "gregorian-to-calendar");
    return adapter.fromGregorian(date);
  }

  convertCalendarDate(date: Parameters<NonNullable<CalendarEngineAdapter["toGregorian"]>>[0]): string {
    const adapter = this.getSelectedAdapter();
    if (!adapter.toGregorian) throw new UnsupportedCalendarOperationError(this.selectedCalendarId, "calendar-to-gregorian");
    return adapter.toGregorian(date);
  }

  formatDate(date: string | Parameters<NonNullable<CalendarEngineAdapter["toGregorian"]>>[0]): string {
    const adapter = this.getSelectedAdapter();
    if (!adapter.formatDate) throw new UnsupportedCalendarOperationError(this.selectedCalendarId, "date-formatting");
    return adapter.formatDate(date, this.displayLanguage);
  }

  getCalendarInfo(date: string) {
    const adapter = this.getSelectedAdapter();
    if (!adapter.getInfo) throw new UnsupportedCalendarOperationError(this.selectedCalendarId, "calendar-information");
    return adapter.getInfo(date);
  }

  getEvents(from: string, to: string) {
    const adapter = this.getSelectedAdapter();
    if (!adapter.getEvents) throw new UnsupportedCalendarOperationError(this.selectedCalendarId, "events");
    return adapter.getEvents(from, to);
  }

  private getSelectedAdapter(): CalendarEngineAdapter { return CALENDAR_REGISTRY[this.selectedCalendarId].adapter; }

  private assertCalendarId(id: string): asserts id is CalendarId {
    if (!isCalendarId(id)) throw new InvalidCalendarIdError(id);
  }
}
