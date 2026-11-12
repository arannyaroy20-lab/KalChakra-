# Bangladesh National Calendar — Data Sources

Last reviewed: 2026-11-10

## Primary authorities

1. **Ministry of Public Administration (MOPA)** — annual public-holiday notifications.
   - 2026 notification published 2025-11-09:
     https://mopa.gov.bd/pages/public-holiday/
   - Use this source for general holidays, holidays by executive order, optional holidays,
     regional applicability and the official dates/periods.
2. **Cabinet Division** — national and international day observance circular.
   - Circular published 2026-10-11:
     https://cabinet.gov.bd/pages/notification-circulars/
   - Use this source for national-level days, traditional/social observances and symbolic
     observances. The circular is not itself a public-holiday declaration.

## Secondary cross-check

- Bangladesh Bank holiday page: https://www.bb.org.bd/en/index.php/mediaroom/holiday
- Bank schedules are specific to banks and financial institutions. They must not be
  treated as the country's universal public-holiday authority.

## Dataset provenance

- `src/engines/bd-national/data/2026.json`: curated starter set. Holiday classifications
  come from the MOPA 2026 notification; national/observance dates use the Cabinet Division
  circular dated 2026-10-11.
- `src/engines/bd-national/data/2027.json`: fixed Gregorian observances only. The MOPA
  2027 holiday notice was published 2026-11-05, but the detailed attached schedule was not
  accessible for reliable row-by-row transcription when this dataset was prepared.
  Therefore 2027 holiday statuses remain `unknown` and variable religious dates are not
  guessed.

## Verification policy

- `verified`: source directly supports the event date and classification.
- `provisional`: date is published but is subject to moon sighting or official revision.
- `unverified`: insufficient authoritative evidence; do not present as confirmed.
- `dateStatus` separately describes whether a date is fixed, officially announced,
  provisional, moon-dependent or Panjika-dependent.
- A national observance is not automatically a public holiday.
- Preserve source URLs and publication/access dates on every event.
- Re-check current circulars annually; superseded circulars must not remain active.
