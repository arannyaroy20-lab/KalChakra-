# MultiCal Engine Implementation Notes

## Phase 4A — Bangladesh National Calendar

See [BD_NATIONAL_ENGINE.md](./BD_NATIONAL_ENGINE.md) and [DATA_SOURCES.md](./DATA_SOURCES.md).

## Phase 4B — Bangladesh Bengali Calendar

See [BD_BENGALI_ENGINE.md](./BD_BENGALI_ENGINE.md).

The Bangladesh Bengali Engine is a pure TypeScript conversion module. It shares only the overall project conventions and remains independent of the national event engine. It does not depend on UI, Electron, SQLite, network access or other calendar engines.

## Phase 4C — India Bengali Calendar (West Bengal Panjika)

See [INDIA_BENGALI_ENGINE.md](./INDIA_BENGALI_ENGINE.md).

The India Bengali engine independently derives variable solar month boundaries from calculated Sankrantis and exposes a Meeus-based Drik-style Panchang profile (tithi, nakshatra, yoga, karana, sunrise and sunset). It records location, IANA time zone, method, ayanamsa profile and calculated provenance. It does not use Bangladesh's revised Bengali calendar rules and does not claim to reproduce Surya Siddhanta or every publisher's Panjika.

## Phase 4D — ISKCON Mayapur Calendar

See [ISKCON_MAYAPUR_ENGINE.md](./ISKCON_MAYAPUR_ENGINE.md). This engine owns a separate copy of its Meeus analytical astronomy and sunrise calculations, a local-sunrise/arunodaya observance decision layer, and source-backed Mayapur annual observances for March 2026–March 2027. It does not reuse the India Bengali engine's runtime modules. Published Mayapur reference dates and Parana windows are marked verified-reference; general astronomical candidates remain explicitly unverified.

## Phase 5A — Unified Calendar Integration Layer

See [CALENDAR_INTEGRATION.md](./CALENDAR_INTEGRATION.md). `src/integration/` contains the typed capability contract, registry, four adapters and `CalendarManager`. Adapters delegate to the existing engine APIs; no calendar calculation source was rewritten. Calendar selection and `bn`/`en` display language are independent. Unsupported conversion operations fail with `UnsupportedCalendarOperationError` rather than returning fabricated values.
