# MultiCal Application Test Report

## Baseline

The deliverable was reconstructed from the **Phase 5B** ZIP. The four engine suites, Phase 5A integration tests and Phase 5B unified data-model tests are retained. **Phase 5C is not included.**

## Current verification

- `tsc -p tsconfig.json --noEmit`: passed.
- `tsc -p tsconfig.json`: passed.
- Full Node test suite (`tests/calendar`, `tests/integration`, `tests/application`): **71 passed, 0 failed**.
- New application tests cover all four daily engine routes, independent Bangladesh Bengali reference dates, National Gregorian-only behaviour, language/selection independence, Gregorian leap-month and Bengali year boundaries, month ordering, location overrides, external validation match/mismatch/cache/offline/timeout/rate-limit/error handling.
- Existing Phase 4A–4D, Phase 5A and Phase 5B suites continue passing.

## Dependency installation and Vite bundle

`npm install` was attempted but the environment could not resolve `registry.npmjs.org` (`EAI_AGAIN`). React, React DOM, Vite and the React Vite plugin are declared in `package.json`, but could not be downloaded in this environment. Consequently, the production `vite build` command could not be executed here. The TypeScript source build and all Node tests were run using the available global TypeScript compiler. On a network-enabled Windows machine, run `npm install` followed by `npm run build`.

## Accuracy and coverage limitations

- Bangladesh National event datasets currently cover 2026 and 2027 only; event-free output outside that coverage is not proof that no observance exists.
- Bangladesh Bengali and India Bengali engines do not provide curated event datasets.
- India Bengali conversion/Panchang is a Meeus/Lahiri approximation and is not a named publisher's official Panjika.
- Mayapur does not expose a Gaurabda date or moonrise/moonset. Its analytical astronomy and calculated observances remain provisional; only bundled published 2026–27 reference records are marked reference-verified.
- BanglaDateToday is an optional third-party comparison source. Network failure or a discrepancy never changes the internal Bangladesh Bengali conversion.
- The delivered UI is Vite/React in a local browser. Electron packaging is not added because the source baseline contains no Electron shell.
