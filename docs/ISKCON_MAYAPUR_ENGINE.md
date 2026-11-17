# ISKCON Mayapur Calendar Engine — Phase 4D

## Scope and separation

The engine is isolated under `src/engines/iskcon-mayapur/`. It does not import any Bangladesh or West Bengal calendar module. Its astronomical model is copied into its own namespace so future changes to another engine cannot alter Mayapur results. It uses the shared project only for the TypeScript/Node conventions; it does not currently persist events in SQLite or depend on the UI/Electron layer.

Default reference location:

- Sri Mayapur, Nadia, West Bengal, India
- Coordinates: 23.4241° N, 88.3883° E
- Time zone: `Asia/Kolkata`

The location can be overridden with latitude, longitude and an IANA time-zone identifier.

## Authority and methodology

The ISKCON Law Book's Vaisnava Calendar provisions specify local-sunrise-based calculations, define sunrise/sunset using visibility of the Sun's upper limb, accept computerized calculations, and state that astronomical positions should be based on modern scientific observations. They also designate the Calendar Research Committee's generated calendar as the standard for ISKCON centres. The 2025 GBC Resolution 407.03 further directs centres to observe major festivals on their actual Vaishnava-calendar dates and lists the prescribed observance times: Gaura Purnima in the evening; Rama Navami at noon; Nrsimha Caturdasi in the evening; Balarama Purnima at noon; Janmastami at midnight; and Srila Prabhupada's appearance/disappearance days and Radhastami at noon.

Sources:

- ISKCON Mayapur official festival calendar, March 2026–March 2027: https://srimayapurdhama.com/festivals/2026-2027/
- GBC Resolutions 2025, resolution 407.03: https://gbc.iskcon.org/gbc-resolutions/resolutions-2025/
- ISKCON Law Book, section “Regulations Regarding Vaisnava Calendar”: https://iskconjusticeministry.eu/documents/ISKCON%20Lawbook.pdf
- IMD Rashtriya Panchanga explanation of sunrise/sunset upper-limb convention: https://packolkata.imd.gov.in/panchang/en/explanation
- Meeus lunar periodic-term implementation reference (Table 47.A): https://github.com/architest/pymeeus/blob/master/pymeeus/Moon.py
- NOAA solar calculation details: https://gml.noaa.gov/grad/solcalc/calcdetails.html

### Astronomical calculation profile

The engine currently uses an in-project, dependency-free analytical model:

1. Apparent tropical solar longitude: low-precision Meeus solar equations.
2. Geocentric tropical lunar longitude: Meeus Chapter 47, Table 47.A periodic terms.
3. Sidereal longitudes: compact Lahiri/Chitrapaksha polynomial approximation.
4. Tithi: Moon–Sun elongation in 12-degree divisions.
5. Nakshatra: sidereal lunar longitude in 27 equal divisions.
6. Yoga: sum of sidereal Sun and Moon longitudes in 27 divisions.
7. Karana: 6-degree half-tithi sequence.
8. Sunrise/sunset: NOAA/Meeus-style equation-of-time and declination with 90.833-degree apparent horizon convention.
9. Arunodaya: evaluated 96 minutes before the calculated local sunrise.

Every computed astronomical day carries the location, time zone, method, source statement and `calculated-unverified` verification status. Event timestamps include an explicit numeric UTC offset and the IANA zone in brackets.

## Vaishnava observances

The implementation separates the astronomical state from the observance decision layer. `decideEkadashiObservance` is a pure rule evaluator accepting sunrise/arunodaya facts. It explicitly models Shuddha Ekadashi, Dashami-at-arunodaya exclusion, a Vriddhi candidate, and a Kshaya candidate. The special Mahadvadashi subtype is retained when supplied by the published calendar; the engine does not infer a subtype from incomplete astronomical inputs.

The official Mayapur 2026–27 reference rows include the published Ekadashi fasting dates and Parana windows. Those exact local clock windows are marked `verified-reference` and take precedence over any generated candidate. A Parana window is never fabricated for a calculated-only candidate. `isWithinPublishedParanaWindow` accepts only a verified published interval.

This is intentionally a conservative partial implementation: the simplified general-purpose rule evaluator is not a complete reproduction of the GBC Calendar Research Committee's GCAL algorithm. Vriddhi/Kshaya/Mahadvadashi candidates outside the published reference period remain provisional and must not be presented as official observance advice.

## Festivals and monthly observances

The curated official Mayapur 2026–27 reference dataset includes published dates for Gaura Purnima, Rama Navami, Nrsimha Caturdasi, Ratha Yatra, Balarama Purnima, Sri Krishna Janmastami, Srila Prabhupada Vyasa-puja/disappearance, Radhastami, Govardhan Puja, Gita Jayanti, Nityananda/Advaita appearances, Caturmasya transitions, Purusottam-Adhika Masa, Bhisma Pancaka and other listed observances. Dates are stored as source-backed annual records, not generated from Gregorian-year hardcoding rules.

The GBC resolution defines the major festival observance timing; the Mayapur annual calendar supplies the Mayapur-specific date. The engine stores the published fasting annotation where the source provides one. It does not independently infer all fast-breaking rituals from tithi alone.

## Supported API

```ts
import { IskconMayapurCalendarEngine } from "./src/engines/iskcon-mayapur/index.js";

const engine = new IskconMayapurCalendarEngine();
const panchang = engine.getDay("2026-11-13");
const ekadashis = engine.getEkadashis("2026-11-01", "2026-11-30");
const festivals = engine.getFestivals("2026-01-01", "2027-03-31");
```

Additional exports include `getTithiAt`, `getArunodayaTithi`, `getSunriseSunset`, `decideEkadashiObservance`, `calculateEkadashiCandidates`, `getPublishedEkadashis`, `getPublishedFestivals` and `isWithinPublishedParanaWindow`.

## Accuracy, coverage and limitations

- **Not certified as official GBC/GCAL output.** The engine does not embed or execute the official GCAL source code. The official Mayapur calendar is the authority for the bundled annual observance dates.
- **Annual reference coverage:** curated major events and Ekadashi/Parana records from the official Mayapur March 2026–March 2027 calendar. This is not a complete transcription of every item on the page.
- **Outside the reference period:** tithi/Panchang values and generated Ekadashi candidates are analytical estimates marked unverified. Festival dates are not generated for arbitrary years.
- **Astronomical precision:** Meeus analytical series and a compact Lahiri approximation are not Swiss Ephemeris or JPL DE ephemerides. Small timing differences are expected.
- **Moonrise/moonset:** not implemented; returned as `null` rather than invented.
- **Parana:** only source-published windows are populated. Exact Hari Vasara boundary, Dvadashi-ending constraints and every exception are not recalculated for arbitrary dates.
- **Mahadvadashi:** published Mayapur classifications are retained. The generic evaluator only flags candidates; it does not claim to fully classify all eight traditional Mahadvadashi forms.
- **Adhika masa and lunar-month naming:** published Mayapur annual observance data is retained, but a complete Gaura-abda masa/adhika-masa engine is not yet implemented.
- **Festival timing:** GBC-specified noon/evening/midnight conventions are documented, while the current dataset stores the source's fasting annotation rather than computed muhurta windows.
- **Location:** annual published Mayapur observances are tied to Mayapur. Changing the location changes computed astronomy, but does not automatically recalculate the official Mayapur annual event dates or Parana times for another city.

No third-party runtime dependency was added. Swiss Ephemeris was not selected because its current licensing is dual AGPL/commercial and the project has not selected a licensing model that would justify that dependency.
