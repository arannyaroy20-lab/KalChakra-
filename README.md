# MultiCal — Calendar Engine Modules

Standalone TypeScript implementation package for the first three MultiCal calendar engines.

## Included engines

- **Bangladesh National Calendar** (`src/engines/bd-national/`): year-wise national event data, event loading, validation, filtering, duplicate detection and source provenance.
- **Bangladesh Bengali Calendar** (`src/engines/bd-bengali/`): deterministic Gregorian ↔ Bengali date conversion using Bangladesh's revised 2019 Bangla Academy calendar rules.
- **India Bengali Calendar** (`src/engines/india-bengali/`): independent West Bengal-style solar Bangabda conversion and Meeus-based sunrise Panchang calculations using a Lahiri/Chitrapaksha approximation. It is not the Bangladesh revised calendar and does not claim to reproduce every printed Panjika.

The ISKCON Mayapur calendar engine is not included yet.

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
└── engines/
    ├── bd-national/             # Bangladesh national events
    ├── bd-bengali/              # Bangladesh revised Bengali date conversion
    └── india-bengali/           # West Bengal solar calendar and Panchang

tests/calendar/
├── bd-national/
├── bd-bengali/
└── india-bengali/

docs/
```

See `docs/BD_NATIONAL_ENGINE.md`, `docs/BD_BENGALI_ENGINE.md`, `docs/INDIA_BENGALI_ENGINE.md` and `docs/DATA_SOURCES.md` for engine details and provenance.
