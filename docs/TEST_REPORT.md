# MultiCal Engine Test Report

## Phase 4D verification

- Bangladesh National Calendar: existing suite passed.
- Bangladesh Bengali Calendar: existing suite passed, including complete-year round trips.
- India Bengali Calendar: existing suite passed, including its Kolkata reference Panchang and solar-month fixtures.
- ISKCON Mayapur Calendar: tests cover default Mayapur coordinates/time zone, sunrise/sunset output, tithi transitions, arunodaya, Shuddha Ekadashi decision, Dashami-at-arunodaya/Mahadvadashi candidate, Vriddhi and Kshaya candidate classification, published Ekadashi/Parana reference dates, major festival fixtures, location override, invalid inputs and year boundaries.

The ISKCON annual reference fixtures are transcribed from the official ISKCON Mayapur Festival Calendar (March 2026–March 2027). The astronomical Panchang tests currently verify internal transition behavior and location handling; they do not constitute independent ephemeris certification. The generic Ekadashi rule evaluator is deliberately marked provisional outside published reference records.

## Current run

- `npm test`: 39 passed, 0 failed.
- `npm run build`: passed.
- `npm run typecheck`: passed.
- `npm install`: attempted but could not reach `registry.npmjs.org` (`EAI_AGAIN` DNS/network failure). No package dependencies changed and no package lockfile was generated.

The final build/test run is performed against the merged source tree. See `IMPLEMENTATION_MANIFEST.json` for included files and phase status.
