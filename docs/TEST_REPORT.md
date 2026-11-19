# MultiCal Engine, Integration and Unified Data Model Test Report

## Phase 5B verification

- Existing Phase 4A–4D engine suites remain included and unchanged.
- Phase 5A integration tests remain included.
- New Phase 5B tests cover all four normalizers, date-only day wrappers, Bengali/English labels, missing optional fields, national event/source preservation, Mayapur festival and Ekadashi preservation, Panchang/sunrise/sunset and calculation provenance, location/timezone metadata, invalid dates/timestamps, mismatched month names and separation of the two Bengali calendars.

## Current run

- `npm test`: **58 passed, 0 failed** (39 existing engine tests + 9 Phase 5A integration tests + 10 Phase 5B data-model tests).
- `npm run build`: passed.
- `npm run typecheck`: passed.
- `npm install`: attempted; timed out while contacting the package registry. No dependencies were added or changed and no package lockfile was created. The package has no new runtime dependencies; the available TypeScript compiler was used for build/typecheck.

## Model limitations

- Bangladesh National engine records Gregorian event dates rather than a separate national era date; native calendar year/month/day fields are therefore absent.
- ISKCON Mayapur does not currently calculate Gaurabda year/month/day. Panchang, sunrise/sunset, location and calculation metadata are preserved instead.
- India Bengali Panchang is not exposed by the Phase 5A adapter. This model preserves India Bengali date calculation metadata but does not independently call the Panchang engine.
- Bengali date-only normalizers return empty event arrays; no event is fabricated.
- Phase 4D Mayapur accuracy limitations remain unchanged: not certified as official GBC/GCAL output, partial published 2026–27 references, provisional general astronomical/Ekadashi calculations, and no moonrise/moonset or full Gaurabda/adhika-masa handling.
