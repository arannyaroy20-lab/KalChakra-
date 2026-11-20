# MultiCal Working Converter and UI

## Baseline and scope

This application build starts from the **Phase 5B** archive. It contains the four existing engines, Phase 5A registry/adapters/`CalendarManager`, and Phase 5B unified date model. **Phase 5C is intentionally not included**: no Phase 5C aggregation service or Phase 5C changes are used as a baseline.

The existing engine calculations and calendar rules are preserved. The new application service composes existing APIs and the Phase 5B normalizers without merging regional calendar rules.

## Run on Windows PowerShell

From the extracted project root:

```powershell
npm install
npm run typecheck
npm test
npm run dev
```

Vite prints a local address, normally `http://127.0.0.1:5173`. Open it in a browser. To create the production web bundle:

```powershell
npm run build
```

There is no Electron shell in the Phase 5B repository, so this deliverable uses the requested React + TypeScript + Vite UI rather than adding a new Electron architecture.

## User-facing service

`src/application/calendar-service.ts` exports:

- `getCalendarDay(gregorianDate, calendarId, language, options?)`
- `getCalendarMonth(year, month, calendarId, language, options?)`
- `formatSelectedCalendarDate(day, language)`
- `listCalendarOptions()`

The month API returns the Gregorian month's actual days in chronological order. Each day uses the selected engine only. Date and language are independent arguments. Optional location/timezone overrides are applied by constructing location-scoped astronomy engines; global adapter instances and their default locations are not rewritten.

### Per-engine behaviour

| Engine | Native date shown | Events | Panchang / solar times |
|---|---|---|---|
| Bangladesh National | Gregorian date (no separate Bangla era date in this engine) | Bundled national events where year data exists | Not supplied |
| Bangladesh Bengali | Revised Bangladesh Bengali year/month/day | No event dataset in this engine | Not supplied |
| India Bengali | West Bengal Bengali year/month/day | No event dataset in this engine | Meeus-based Panchang and sunrise/sunset |
| ISKCON Mayapur | Gregorian day; no Gaurabda year/month/day is currently exposed | Published and calculated observances from the existing engine | Mayapur Panchang and sunrise/sunset |

No missing date, event, holiday, tithi, or astronomical value is synthesized by the application layer. A missing event list is displayed as empty, not as a claim that no real-world observance exists.

## Bangladesh Bengali external validation

`src/validation/bangla-date-today.ts` calls the explicitly dated BanglaDateToday endpoint only to compare the Bangladesh Bengali engine's result. Internal conversion remains primary. The provider result is cached by explicit Gregorian date for 24 hours in memory and browser `localStorage`; `forceRefresh` bypasses the cache. Mismatches are reported and never overwrite the internal date. HTTP 429, other HTTP errors, malformed responses, timeouts and offline failures are handled as validation statuses.

The provider documents the response schema, a 60-request-per-minute rate limit, explicit-date 24-hour cacheability and support for Gregorian years 1900–2199: https://www.bangladatetoday.com/bangla-date-api. The UI credits and links to BanglaDateToday in its About/Credits section. External validation is optional and does not block offline conversion.

## Known limitations

- The National engine's bundled event data covers 2026 and 2027 only. Other dates still show their Gregorian date and no fabricated events.
- The Bangladesh Bengali and India Bengali conversion engines do not currently own curated event datasets; the UI therefore shows no event records for those selections.
- The India Bengali calculation is a Meeus/Lahiri approximation, not a named publisher's official West Bengal Panjika. Panchang output is also calculated, not an official printed almanac.
- Mayapur does not currently expose Gaurabda year/month/day, moonrise/moonset or a complete official GBC ephemeris. Published 2026–27 observances are reference-backed; general calculated observances remain provisional/unverified.
- Mayapur festival names are shown in the source language supplied by the engine; the interface controls are localized independently.
- The UI is a local Vite web application. Electron packaging is not added because the Phase 5B repository has no Electron shell or desktop build structure.
