# MultiCal Engine and Integration Test Report

## Phase 5A verification

- Existing Phase 4A–4D engine suites remain included and unchanged.
- New integration tests verify registry completeness, adapter retrieval, selection stability, independent Bangladesh/West Bengal conversions, unsupported operations, Mayapur Panchang/event access, Bengali/English localization independence, invalid IDs and metadata capabilities.

## Current run

- `npm test`: **48 passed, 0 failed** (39 existing engine tests + 9 integration tests).
- `npm run build`: passed.
- `npm run typecheck`: passed.
- `npm install --no-audit --no-fund`: attempted; timed out while contacting the package registry. No dependencies were added or changed and no package lockfile was created. The project has no new runtime dependencies; the available TypeScript compiler was used for build/typecheck.

The integration layer does not modify existing engine calculation logic. See `docs/CALENDAR_INTEGRATION.md` for capability boundaries and `IMPLEMENTATION_MANIFEST.json` for the complete package inventory.

## Existing Phase 4D accuracy limitations remain

The ISKCON Mayapur implementation is not certified as official GBC/GCAL output. Published Mayapur reference records cover March 2026–March 2027 partially; general astronomical/Ekadashi calculations remain provisional, moonrise/moonset are unavailable, and full Gaurabda/adhika-masa handling is not implemented.
