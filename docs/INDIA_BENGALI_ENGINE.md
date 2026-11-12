# India Bengali Calendar Engine — West Bengal Panjika (Phase 4C)

## Scope and independence

The engine lives under `src/engines/india-bengali/` and implements a West Bengal-style solar Bangabda date alongside sunrise-based Panchang limbs. It is independent of both Bangladesh engines. It does not import or reuse the fixed-length rules from `bd-bengali`.

Default reference location:

- Kolkata, West Bengal, India — 22.5726° N, 88.3639° E
- Time zone: `Asia/Kolkata`

All APIs accept an optional location object. The IANA time-zone identifier and coordinates are carried into calculation metadata.

## Selected calendar convention

This implementation uses a Drik-style sidereal solar calculation with Lahiri/Chitrapaksha ayanamsa and a West Bengal month-start convention in which the first Bengali civil date of a solar month is the local calendar date after the calculated Sankranti date. The Bengali months are the twelve 30-degree sidereal solar signs, from Mesha/Boishakh through Meena/Chaitra. Month lengths are therefore derived from successive Sankrantis and vary naturally; they are not hardcoded to Bangladesh's revised 2019 month lengths.

This is one explicit calculation profile, not a claim that every West Bengal printed Panjika follows identical rules. Drik/Visuddha Siddhanta and older Surya Siddhanta almanacs can differ. The selected profile must not be silently treated as a Surya Siddhanta result or as an exact reproduction of a particular publisher's printed almanac.

## Astronomical method

The implementation uses published analytical astronomical algorithms rather than an external runtime package:

1. Solar apparent ecliptic longitude uses the low-precision Meeus solar-position equations (Astronomical Algorithms, Chapter 25).
2. Geocentric lunar ecliptic longitude uses the Meeus lunar periodic series (Chapter 47, Table 47.A, 60 longitude terms), including eccentricity weighting and principal additive terms.
3. Sidereal longitudes are obtained by subtracting a compact Lahiri/Chitrapaksha ayanamsa polynomial approximation from tropical longitudes.
4. Tithi is derived from the Moon–Sun sidereal elongation in 12-degree divisions.
5. Nakshatra is derived from the Moon's sidereal longitude in 27 equal divisions.
6. Yoga is derived from the sum of sidereal Sun and Moon longitudes in 27 equal divisions.
7. Karana is derived from the 6-degree half-tithi divisions and the standard repeating/final karana sequence.
8. Sunrise and sunset use the Meeus/NOAA-style solar declination and equation-of-time method with a standard apparent sunrise zenith of 90.833 degrees.

Panchang limbs are evaluated at the selected location's calculated local sunrise. Their start/end instants are solved numerically from the same angular model. Output metadata labels every value as `calculated`; it is not copied from a published Panjika dataset.

## Reference checks and provenance

The implementation was checked against independent Kolkata Panchang pages for 12 November 2026. The reference pages report Shukla Tritiya, Jyeshtha, Sukarma, Garaja, sunrise near 05:47 IST, sunset near 16:53–16:54 IST, tithi end near 18:09–18:10 and nakshatra end near 14:18–14:20. The engine's calculated values fall within the test tolerances for those displayed minute-level values.

The Bengali solar date is also checked against the displayed Kolkata Bengali Panjika date of 26 Kartik 1433 on 12 November 2026. These are external comparison fixtures, not a bundled publisher dataset.

Reference material:

- IMD Positional Astronomy Centre, Rashtriya Panchang explanation: https://packolkata.imd.gov.in/panchang/en/explanation
- IMD Positional Astronomy Centre, Rashtriya Panchang preface: https://packolkata.imd.gov.in/panchang/ta/preface
- Drik Panchang, Kolkata Bengali month Panjika, 12 November 2026: https://www.drikpanchang.com/bengali/bengali-month-panjika.html?geoname-id=1275004
- Drik Panchang, Kolkata daily Panchang, 12 November 2026: https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=1275004
- Independent Kolkata Panchang cross-check (minute-level limb timings): https://vedicdrishti.in/panchang/kolkata/2026-11-12
- Independent Bengali solar-date cross-check for 10 November 2026 (24 Kartik 1433): https://nakshatrikaveda.com/panchang?region=Bengali+Panjika
- Meeus lunar periodic-term table implementation reference (PyMeeus, Table 47.A): https://github.com/architest/pymeeus/blob/master/pymeeus/Moon.py
- NOAA solar calculation details: https://gml.noaa.gov/grad/solcalc/calcdetails.html

## Supported API

- `gregorianToBengali(isoDate, location?)`
- `bengaliToGregorian({ year, month, day }, location?)`
- `findSankranti(gregorianYear, month, location?)`
- `getMonthStart(year, month, location?)`
- `validateIndiaBengaliDate(input, location?)`
- `getPanchangDay(isoDate, location?)`
- `getPanchangAt(instant, location?)`
- `getSunriseSunset(isoDate, location?)`

`month` in `findSankranti` is the one-based sidereal solar sign (1 = Mesha, 12 = Meena).

## Accuracy and limitations

- This is a Meeus-based analytical approximation, not Swiss Ephemeris, JPL DE, or a full official Positional Astronomy Centre ephemeris.
- Lahiri ayanamsa is approximated by a compact polynomial; exact implementations can differ slightly by epoch and convention.
- Sunrise/sunset use a standard refraction/solar-radius approximation. Local terrain, pressure, temperature, elevation modelling and horizon obstructions are not modelled in full.
- Published Panjikas may use different ayanamsa values, ephemerides, sunrise conventions, or Sankranti-to-date rules. A few minutes of timing difference or a date difference near a boundary is possible.
- The engine does not determine festival observance days, vrata rules, muhurta, adhika masa, lunar month naming, moonrise/moonset, planetary positions, or publisher-specific ritual decisions.
- No Surya Siddhanta mean-motion engine is implemented.
- Supported Sankranti search years are 1800–2200; supported Bengali input years are 1200–1600.
- If the requested location has no sunrise or sunset on the date, the sunrise/sunset calculation throws a clear range error.

For ritual observance, users should follow the named Panjika or temple authority they actually use. The engine intentionally exposes its calculation metadata so the UI can distinguish computed values from sourced almanac data.
