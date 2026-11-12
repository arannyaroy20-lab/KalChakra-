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

`npm test` runs all three engine test folders under `tests/calendar/` using
Node's built-in test runner after compiling TypeScript to `dist/`.

## Data limitations

See `DATA_SOURCES.md` and `BD_BENGALI_ENGINE.md`. The Bengali engine is a deterministic
civil-calendar conversion engine, not a traditional sunrise-based or lunar Panjika.

## India Bengali Calendar (Phase 4C)

- Kolkata West Bengal Panjika reference date (12 November 2026 = 26 Kartik 1433)
- Sankranti instant versus following local Bengali month-start date
- Twelve variable solar month boundaries and derived month lengths
- Bengali ↔ Gregorian round trips at all month starts and every date in Bangabda 1433
- Pohela Boishakh/year boundary and Gregorian leap-day round trip
- Kolkata reference Panchang values: tithi, nakshatra, yoga, karana, sunrise and sunset
- Tithi and nakshatra transition checks immediately before and after calculated end instants
- Location/time-zone metadata and location-dependent sunrise calculations
- Invalid ISO dates, invalid Bengali dates, invalid IANA time zones and unsupported calculation years

The Phase 4C astronomy tests compare calculated Kolkata values with published minute-level references and use tolerances; they do not assert fabricated exact-second matches. See `INDIA_BENGALI_ENGINE.md` for methodology and source limitations.

## Latest full-suite result (Phase 4C delivery)

- TypeScript typecheck: passed
- Full test suite: 26 passed, 0 failed across Phases 4A, 4B and 4C
- Production TypeScript build: passed
