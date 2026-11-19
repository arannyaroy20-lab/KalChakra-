import type { CalendarId } from "../integration/types.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function assertIsoDate(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) throw new TypeError(`${field} must be a Gregorian ISO date (YYYY-MM-DD)`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new RangeError(`${field} is not a valid Gregorian date: ${value}`);
}

export function assertCalendarId(value: unknown, expected: CalendarId): void {
  if (value !== expected) throw new TypeError(`Calendar engine mismatch: expected "${expected}", received "${String(value)}"`);
}

export function assertPositiveInteger(value: unknown, field: string): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 1) throw new RangeError(`${field} must be a positive integer`);
}

export function assertLocalizedLabel(value: unknown, field: string): asserts value is { bn: string; en: string } {
  if (!value || typeof value !== "object" || typeof (value as any).bn !== "string" || !(value as any).bn.trim() || typeof (value as any).en !== "string" || !(value as any).en.trim()) {
    throw new TypeError(`${field} must contain non-empty Bengali (bn) and English (en) labels`);
  }
}

export function assertIsoDateTime(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})(?:\[[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)+\])?$/.test(value) || !Number.isFinite(parseIsoDateTime(value))) throw new TypeError(`${field} must be a valid ISO date-time string with an explicit timezone`);
  assertIsoDate(value.slice(0, 10), `${field} date`);
}

export function parseIsoDateTime(value: string): number {
  return Date.parse(value.replace(/\[[^\]]+\]$/, ""));
}
