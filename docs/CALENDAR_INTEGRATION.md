# Phase 5A — Unified Calendar Integration Layer

## Purpose

The integration layer provides one discovery and access API for the four independent calendar engines. It is a backend-only TypeScript module. It does not introduce UI, Electron, persistence, or a shared calculation implementation.

## Public API

Import from `src/integration/index.ts` (compiled path `dist/integration/index.js`):

- `CALENDAR_REGISTRY` — immutable registry keyed by calendar ID.
- `listCalendarRegistry()` / `CalendarManager.listCalendars()` — list metadata for all engines.
- `CalendarManager.getCalendar(id)` — retrieve the stable adapter for an engine.
- `setSelectedCalendar(id)` / `getSelectedCalendarId()` — select an engine independently of display language.
- `convertGregorianDate(date)` — convert through the selected engine only when it declares and implements that operation.
- `convertCalendarDate(date)` — reverse conversion when supported.
- `formatDate(date)` — format through the selected adapter using the current `bn` or `en` display language.
- `getCalendarInfo(date)` — retrieve detailed calendar-specific information where available (currently Mayapur Panchang).
- `getEvents(from, to)` — retrieve events/observances where available.
- `setDisplayLanguage(language)` — change labels and formatting without changing the selected engine or calculation rules.

Errors are explicit: `InvalidCalendarIdError` identifies unknown IDs; `UnsupportedCalendarOperationError` identifies a valid engine that does not support a requested operation.

## Registry and capability matrix

| Engine ID | Calendar type | Gregorian conversion | Reverse conversion | Formatting | Info / Panchang | Events |
|---|---|---:|---:|---:|---:|---:|
| `bd-national` | National | — | — | Yes (Gregorian date) | — | Yes |
| `bd-bengali` | Revised Bangladesh solar Bengali | Yes | Yes | Yes | — | — |
| `india-bengali` | West Bengal solar Bengali | Yes | Yes | Yes | — | — |
| `iskcon-mayapur` | Vaishnava lunisolar observances | — | — | Yes (Gregorian date) | Yes (Panchang) | Yes |

A dash means the operation is intentionally not exposed. It is not a missing placeholder for a guessed implementation.

## Independence and calculation provenance

Adapters call the existing engine functions. They do not reimplement date calculations. The Bangladesh revised Bengali adapter calls `bd-bengali` conversion and formatting functions; the West Bengal adapter calls the independent `india-bengali` conversion functions and their default Kolkata location. Their shared broad calendar family does not make their month-boundary rules interchangeable.

The Mayapur adapter delegates to `IskconMayapurCalendarEngine`, preserving its location, Panchang, published-reference and provisional-calculation behavior. The National adapter delegates to `BangladeshNationalCalendarEngine` for event ranges; it does not claim that the event catalog is a separate date-conversion calendar.

## Localization

Registry names and descriptions are stored as `{ bn, en }`. The manager's display language is separate state from the selected calendar ID. Bengali date formatting uses each Bengali engine's own month labels and rules. Gregorian-only displays use locale formatting. Localization never switches or mutates an engine.

## Example

```ts
import { CalendarManager } from "./integration/index.js";

const calendars = new CalendarManager({ language: "bn" });
calendars.setSelectedCalendar("bd-bengali");
const converted = calendars.convertGregorianDate("2026-04-14");
console.log(calendars.formatDate("2026-04-14"));

calendars.setSelectedCalendar("iskcon-mayapur");
const panchang = calendars.getCalendarInfo("2026-03-03");
console.log(panchang.tithi.name);
```

Calling `convertGregorianDate` while `bd-national` or `iskcon-mayapur` is selected throws `UnsupportedCalendarOperationError`, because those engines do not expose that conversion operation.

## Limitations

- This layer is an integration facade, not a unified date-calculation engine.
- Bangladesh National data coverage remains limited to registered datasets (currently 2026–2027).
- ISKCON Mayapur's general astronomical/Ekadashi calculations retain Phase 4D's documented provisional accuracy limits; the adapter does not upgrade them to official GCAL equivalence.
- Mayapur's date display is Gregorian; no Gaurabda calendar-date conversion is claimed.
- `getEvents` has a common range-shaped call, but returned event structures remain engine-specific unions. A later unified event-management phase should normalize these only while retaining each event's original source and calendar provenance.
- The adapters currently use each engine's existing default location. Location configuration can be added as an explicit manager option in a later phase without changing the independent engines.
