# MultiCal — Bangladesh National Calendar Engine

A standalone TypeScript implementation of the Bangladesh National Calendar Engine
for the MultiCal project.

## Install and verify

```bash
npm install
npm run typecheck
npm test
```

## Included

- Shared calendar event types
- Bangladesh National Calendar engine facade
- 2026 and 2027 year-wise JSON datasets
- Event loader, validator, date/category/holiday filters and duplicate detection
- Bengali and English event names and descriptions
- Source provenance and verification/date status
- Node.js built-in test runner
- Data-source, engine and test documentation

## Integration

Copy `src/core/types/`, `src/engines/bd-national/`, `tests/calendar/bd-national/`,
and the relevant `docs/` files into the MultiCal repository. Merge the provided
`package.json` dev dependencies and TypeScript JSON import settings into the existing
project rather than replacing its package configuration.

This is an implementation package, not a replacement for the full Electron application.
