# MultiCal — Calendar Engine Modules

Standalone TypeScript implementation package for the four independent MultiCal calendar engines. This package currently contains the engine modules, shared event contract, curated data, tests and engineering notes; it is not yet the complete Electron/React desktop application shell.

## Included engines

- **Bangladesh National Calendar** (`src/engines/bd-national/`): year-wise national event data, event loading, validation, filtering, duplicate detection and source provenance.
- **Bangladesh Bengali Calendar** (`src/engines/bd-bengali/`): deterministic Gregorian ↔ Bengali date conversion using Bangladesh's revised 2019 Bangla Academy calendar rules.
- **India Bengali Calendar** (`src/engines/india-bengali/`): independent West Bengal-style solar Bangabda conversion and Meeus-based sunrise Panchang calculations using a Lahiri/Chitrapaksha approximation.
- **ISKCON Mayapur Calendar** (`src/engines/iskcon-mayapur/`): independent Meeus-based astronomy, local sunrise/arunodaya, conservative Vaishnava observance evaluator and source-verified Mayapur annual festival/Ekadashi reference records for March 2026–March 2027.

## Install, build and test

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Structure

```text
src/
├── core/types/                  # Shared calendar contracts
├── data-model/                  # Unified date/day types and engine normalizers
├── integration/                 # Registry, adapters and CalendarManager
└── engines/
    ├── bd-national/             # Bangladesh national events
    ├── bd-bengali/              # Bangladesh revised Bengali date conversion
    ├── india-bengali/           # West Bengal solar calendar and Panchang
    └── iskcon-mayapur/          # Vaishnava astronomy, observances and references

tests/calendar/
├── bd-national/
├── bd-bengali/
├── india-bengali/
└── iskcon-mayapur/

docs/
```

See the engine-specific documentation in `docs/`, plus `docs/DATA_SOURCES.md`, `docs/IMPLEMENTATION.md` and `docs/TEST_REPORT.md`.

**Accuracy note:** ISKCON Mayapur annual observance dates in the bundled reference period are sourced from the official Mayapur calendar. Astronomical calculations outside that reference are analytical and marked unverified; this package does not claim to reproduce the official GBC Calendar Research Committee/GCAL software.

## Unified integration API (Phase 5A)

`src/integration/` provides `CalendarManager`, a four-engine registry, typed capabilities, engine adapters and Bengali/English metadata formatting. See [docs/CALENDAR_INTEGRATION.md](docs/CALENDAR_INTEGRATION.md) for the capability matrix and examples. The facade exposes only operations actually supported by each engine; selecting a calendar is independent of changing the display language.

## Unified date data model (Phase 5B)

`src/data-model/` normalizes actual results from all four engines into typed `CalendarDateModel` and `UnifiedCalendarDay` values. Gregorian date, engine identity, bilingual labels and provenance are retained; native calendar fields, Panchang and solar times remain optional when an engine does not supply them. Bangladesh's revised Bengali calendar and West Bengal Panjika remain distinct. See [docs/UNIFIED_DATE_MODEL.md](docs/UNIFIED_DATE_MODEL.md) for the normalization API, validation rules and field semantics.
