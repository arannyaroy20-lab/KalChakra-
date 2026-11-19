# Phase 5B — Unified Calendar Date Data Model

## Purpose

`src/data-model/` defines a shared, strongly typed representation for dates and calendar-day data returned by the four independent engines. It is a normalization boundary only: it does not calculate dates, translate calendar rules, or add event data.

## Public API

```ts
import {
  normalizeBdNationalDate,
  normalizeBdBengaliDate,
  normalizeBdBengaliDay,
  normalizeIndiaBengaliDate,
  normalizeIndiaBengaliDay,
  normalizeIskconMayapurDay,
  getLocalizedCalendarDateLabel,
  getLocalizedCalendarMonthLabel
} from "../data-model/index.js";
```

- `normalizeBdNationalDate(gregorianDate, events?)` returns a `UnifiedCalendarDay`. The national engine is Gregorian-event based, so native Bengali year/month/day fields are intentionally absent.
- `normalizeBdBengaliDate(engineDate)` returns a `CalendarDateModel`; `normalizeBdBengaliDay(engineDate)` wraps it as a day with an empty event list.
- `normalizeIndiaBengaliDate(engineDate)` and `normalizeIndiaBengaliDay(engineDate)` preserve the separate West Bengal Panjika date, its Meeus calculation metadata, location and timezone.
- `normalizeIskconMayapurDay(astronomicalDay, events?)` preserves Panchang limbs, sunrise/sunset, location/timezone, calculation verification and supplied festival/Ekadashi records. An Ekadashi record is attached to both its fast date and Parana date when applicable.

`src/integration/index.ts` re-exports the data-model API for consumers that prefer one public integration entry point.

## Model semantics

`CalendarDateModel` always has the Gregorian ISO date and engine ID. Native calendar year, month number/name and day are optional and are populated only when that engine actually returns them. `labels.month` and `labels.date` always contain both `bn` and `en` display values. `getLocalizedCalendarDateLabel` and `getLocalizedCalendarMonthLabel` select a label without changing the engine ID or any date value.

`UnifiedCalendarDay` contains the normalized date, typed events, optional Panchang and sunrise/sunset, and provenance. Bangladesh National event source records are copied without changing publisher, title, URL, authority or timestamps. Mayapur source identifiers and verification labels remain source strings as supplied by the engine; no URL or publisher is inferred. Calculation metadata is retained separately.

The original engine result is retained in `CalendarDateModel.original` for traceability. Optional fields remain absent when unsupported. For example, this phase does not invent a national-calendar era year or a Gaurabda year/month/day for Mayapur.

## Validation

Normalizers validate Gregorian ISO dates, positive integer calendar fields, month-number/name consistency, localized labels, engine identity, event date ranges, Mayapur timezone-qualified sunrise/sunset timestamps and required calculation provenance. Invalid or mismatched records throw `TypeError` or `RangeError` with a field-specific message. Mayapur timestamps retain the engine's `[IANA/Zone]` suffix; validation checks the explicit numeric offset while preserving the original string.

## Boundaries and limitations

- No engine calculation source was modified or duplicated.
- The Bangladesh revised Bengali and West Bengal Bengali systems remain separate discriminated `calendarId` values and use their own month tables.
- Bengali date-only day wrappers intentionally have no events unless an engine actually provides them.
- India Bengali Panchang is not added to the integration model because Phase 5A's India adapter does not expose a Panchang operation; the native date's calculation metadata is preserved instead.
- Mayapur's known Phase 4D accuracy limitations remain unchanged. A `calculated-unverified` result stays marked as such.
- The model is an in-memory TypeScript contract, not a database schema or UI view model.
