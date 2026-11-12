# Calendar Engines — Test Report

## Bangladesh National Calendar (Phase 4A)

- Dataset registry and year loading
- Missing-year error handling
- Bilingual title and description validation
- Gregorian ISO date validation (including impossible dates)
- Source metadata validation
- Date-range filtering
- Category and holiday-status filtering
- Duplicate event detection
- Engine facade metadata and event retrieval

## Bangladesh Bengali Calendar (Phase 4B)

- Fixed revised-calendar anchors (21 February, 26 March, 14 April, 16 December)
- All twelve month lengths
- Ordinary and leap Falgun handling
- Gregorian century leap-year edge cases (1900 and 2000)
- Month and Bengali-year boundary conversions
- Gregorian ↔ Bengali round trips, including every day across ten complete Bengali years
- Bengali date validation and invalid date rejection
- Bengali month, weekday and digit formatting

## Run

```bash
npm install
npm run typecheck
npm test
npm run build
```

`npm test` runs both `tests/calendar/bd-national/` and `tests/calendar/bd-bengali/` using
Node's built-in test runner after compiling TypeScript to `dist/`.

## Data limitations

See `DATA_SOURCES.md` and `BD_BENGALI_ENGINE.md`. The Bengali engine is a deterministic
civil-calendar conversion engine, not a traditional sunrise-based or lunar Panjika.
