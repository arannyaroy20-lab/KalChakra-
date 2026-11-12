# MultiCal — Calendar Engine Modules

Standalone TypeScript implementation package for the first two MultiCal calendar engines.

## Included engines

- **Bangladesh National Calendar** (`src/engines/bd-national/`): year-wise national event data, event loading, validation, filtering, duplicate detection and source provenance.
- **Bangladesh Bengali Calendar** (`src/engines/bd-bengali/`): deterministic Gregorian ↔ Bengali date conversion using Bangladesh's revised 2019 Bangla Academy calendar rules.

The Bangladesh Bengali engine is not the West Bengal traditional Panjika engine. The India Bengali and ISKCON Mayapur engines are not included in this package.

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
    └── bd-bengali/              # Bangladesh revised Bengali date conversion

tests/calendar/
├── bd-national/
└── bd-bengali/

docs/
```

See `docs/BD_NATIONAL_ENGINE.md`, `docs/BD_BENGALI_ENGINE.md` and `docs/DATA_SOURCES.md` for engine-specific details and source provenance.
