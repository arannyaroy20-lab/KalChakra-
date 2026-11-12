# Bangladesh National Calendar Engine

## Scope

This engine contains Bangladesh-specific national events, government observances,
religious/cultural events, international observances and public-holiday classifications.
It does not calculate or import dates from the Bangladesh Bengali, India Bengali or
ISKCON Mayapur calendars.

## Public API

```ts
import { BangladeshNationalCalendarEngine } from
  "./src/engines/bd-national/index.js";

const engine = new BangladeshNationalCalendarEngine();

const yearEvents = engine.getEvents(2026);
const holidays = engine.getEvents(2026, {
  holidayStatuses: ["general-holiday", "executive-holiday"]
});
const march = engine.getEvents(2026, {
  from: "2026-03-01",
  to: "2026-03-31"
});
const crossYear = engine.getEventsInRange("2026-12-20", "2027-01-10");
```

## Architecture

- Shared contracts: `src/core/types/calendar-event.types.ts`
- Engine facade: `src/engines/bd-national/bd-national.engine.ts`
- Year data: `src/engines/bd-national/data/YYYY.json`
- Loading, validation, filtering and duplicate detection are isolated services.
- The engine facade does not depend on UI, Electron, SQLite or another calendar engine.

## Dataset status

Datasets currently included: 2026 and 2027.
Both are intentionally marked `partial`; they are starter datasets and not exhaustive
official almanacs. See `DATA_SOURCES.md` for provenance and known gaps.
