# Bangladesh National Calendar Engine — Test Report

## Automated coverage

- Dataset registry and year loading
- Missing-year error handling
- Bilingual title and description validation
- Gregorian ISO date validation (including impossible dates)
- Source metadata validation
- Date-range filtering
- Category and holiday-status filtering
- Duplicate event detection
- Engine facade metadata and event retrieval

## Run

```bash
npm install
npm run typecheck
npm test
```

## Data limitations

- 2026 is a curated starter set, not every optional/restricted holiday or every
  observance in the Cabinet Division circular.
- 2027 contains fixed Gregorian observances only. The 2027 public-holiday notice is
  recorded in the research notes, but the detailed schedule has not been transcribed
  into event records. 2027 holiday status is therefore unknown.
- Moon-dependent dates are provisional where they are included.
