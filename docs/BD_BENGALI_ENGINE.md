# Bangladesh Bengali Calendar Engine

## Scope and separation

This engine implements the Bangladesh Bangla Academy calendar revised in 2019 and in force from 16 October 2019. It is a deterministic civil-calendar conversion engine. It is independent of `bd-national`, `india-bengali` and `iskcon-mayapur`; in particular, it does not use West Bengal's traditional lunisolar Panjika rules.

## Rules implemented

1. Bengali year starts on Gregorian 14 April (1 Boishakh).
2. The Bengali year number is the Gregorian year in which it starts minus 593.
3. Boishakh through Ashwin have 31 days each.
4. Kartik, Agrahayan, Poush, Magh and Chaitra have 30 days each.
5. Falgun has 29 days, or 30 when the Gregorian leap day falls during that Bengali year (the Gregorian year after the April start).
6. Dates are civil dates beginning at midnight; conversion is performed in UTC date arithmetic to avoid local timezone/DST drift.

Month lengths: `31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 29|30, 30`.

The implementation's reference anchors include 21 February = 8 Falgun, 26 March = 12 Chaitra, and 16 December = 1 Poush. The 2019 revision aligned these recurring national-day Bengali dates with their Gregorian dates.

## API

```ts
import {
  gregorianToBengali,
  bengaliToGregorian,
  getBengaliYearInfo,
  getBengaliMonthLengths,
  isValidBengaliDate,
  formatBengaliDate
} from "./src/engines/bd-bengali/index.js";

const bangla = gregorianToBengali("2026-02-21");
// { year: 1432, month: 11, day: 8, monthName: ..., weekday: ... }

const gregorian = bengaliToGregorian({ year: 1432, month: 11, day: 8 });
// "2026-02-21"

const yearInfo = getBengaliYearInfo(1430);
// leap year, 366 days; Falgun has 30 days.
```

## Public exports

- Gregorian ↔ Bengali conversion
- Bengali date validation
- Month lengths and Bengali year metadata
- Bengali month names, weekday names and Bengali digit formatting
- Human-readable Bengali date formatting

## Sources

- Bangla Academy's 2019 revision, effective 16 October 2019, described with its exact month lengths and leap-year rule in the Calendrical reference implementation: https://calendrical.hexdocs.pm/2.5.0/Calendrical.Bangla.Revised2019.html
- Bangla Academy director's explanation of the revision, including month lengths, fixed 14 April new year, and national-day anchors, reported by bdnews24.com (16 October 2019): https://bangla.bdnews24.com/bangladesh/article1677502.bdnews
- Bangladesh government Teachers' Portal reference for Bangladesh's 14 April date and distinction from West Bengal's 15 April observance: https://teachers.gov.bd/content/details/920358

## Supported range and limitations

The current implementation accepts Bengali years 1–9405 (four-digit Gregorian ISO output range). It uses Gregorian civil-date arithmetic and does not calculate sunrise-based traditional dates, lunar tithis, festivals, or Panjika observances. Those belong to other calendar engines.
