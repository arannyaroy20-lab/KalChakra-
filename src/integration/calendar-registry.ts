import { bdNationalAdapter } from "./adapters/bd-national.adapter.js";
import { bdBengaliAdapter } from "./adapters/bd-bengali.adapter.js";
import { indiaBengaliAdapter } from "./adapters/india-bengali.adapter.js";
import { iskconMayapurAdapter } from "./adapters/iskcon-mayapur.adapter.js";
import type { CalendarId, CalendarRegistryEntry } from "./types.js";

const adapters = [bdNationalAdapter, bdBengaliAdapter, indiaBengaliAdapter, iskconMayapurAdapter] as const;

export const CALENDAR_REGISTRY: Readonly<Record<CalendarId, CalendarRegistryEntry>> = Object.freeze(
  Object.fromEntries(adapters.map(adapter => [adapter.metadata.id, Object.freeze({ ...adapter.metadata, adapter })])) as Record<CalendarId, CalendarRegistryEntry>
);

export function isCalendarId(value: string): value is CalendarId {
  return Object.prototype.hasOwnProperty.call(CALENDAR_REGISTRY, value);
}

export function listCalendarRegistry(): CalendarRegistryEntry[] {
  return Object.values(CALENDAR_REGISTRY);
}
