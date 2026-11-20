import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LOCATION,
  bengaliToGregorian,
  findSankranti,
  getMonthStart,
  getPanchangDay,
  getPanchangAt,
  gregorianToBengali,
  validateIndiaBengaliDate
} from '../../../dist/engines/india-bengali/index.js';

const localIsoToDate = (value) => new Date(value.replace(/\[.*\]$/, ''));

test('West Bengal (Surya Siddhanta) reference date: 10 November 2026 is 23 Kartik 1433', () => {
  const date = gregorianToBengali('2026-11-10');
  assert.deepEqual([date.year, date.month, date.day], [1433, 7, 23]);
  assert.equal(date.monthName.en, 'Kartik');
});

test('Drik-style convention remains available: 10 November 2026 is 24 Kartik 1433', () => {
  const date = gregorianToBengali('2026-11-10', undefined, 'drik');
  assert.deepEqual([date.year, date.month, date.day], [1433, 7, 24]);
  assert.equal(date.calculation.sankrantiMethod, 'drik');
});

test('Surya Siddhanta month starts match published West Bengal dates for Bengali year 1433', () => {
  // Reference: Applied Jyotish Bengali calendar pages (Boishakh 15 Apr, Ashwin 19 Sep, Kartik 19 Oct, Agrahayan 18 Nov, Poush 17 Dec 2026).
  assert.equal(getMonthStart(1433, 1), '2026-04-15');
  assert.equal(getMonthStart(1433, 6), '2026-09-19');
  assert.equal(getMonthStart(1433, 7), '2026-10-19');
  assert.equal(getMonthStart(1433, 8), '2026-11-18');
  assert.equal(getMonthStart(1433, 9), '2026-12-17');
  assert.equal(gregorianToBengali('2026-11-19').day, 2);
  assert.equal(gregorianToBengali('2026-11-19').monthName.en, 'Agrahayan');
  assert.equal(gregorianToBengali('2026-11-17').monthName.en, 'Kartik');
  assert.equal(gregorianToBengali('2026-11-17').day, 30);
  // Drik convention starts Agrahayan one day earlier.
  assert.equal(getMonthStart(1433, 8, undefined, 'drik'), '2026-11-17');
});

test('reference Panchang timings for Kolkata 12 November 2026 are within published minute-level values', () => {
  const day = getPanchangDay('2026-11-12');
  const seconds = (value) => {
    const time = value.match(/T(\d{2}):(\d{2}):(\d{2})/);
    return Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]);
  };
  const within = (actual, expected, toleranceSeconds = 150) => {
    assert.ok(Math.abs(seconds(actual) - expected) <= toleranceSeconds, `${actual} differs from published reference`);
  };
  assert.deepEqual([day.bengaliDate.year, day.bengaliDate.month, day.bengaliDate.day], [1433, 7, 25]);
  assert.equal(day.tithi.name, 'শুক্ল তৃতীয়া');
  assert.equal(day.nakshatra.name, 'জ্যেষ্ঠা');
  assert.equal(day.yoga.name, 'সুকর্মা');
  assert.equal(day.karana.name, 'গর');
  within(day.sunrise, 5 * 3600 + 47 * 60, 90);
  within(day.sunset, 16 * 3600 + 53 * 60, 90);
  within(day.tithi.endsAt, 18 * 3600 + 10 * 60, 150);
  within(day.nakshatra.endsAt, 14 * 3600 + 19 * 60, 90);
  within(day.yoga.endsAt, 4 * 3600 + 26 * 60, 90);
});

test('Mesha Sankranti and West Bengal month start are distinct instants/dates', () => {
  const sankranti = findSankranti(2026, 1);
  assert.equal(sankranti.localDate, '2026-04-14');
  assert.equal(sankranti.startsBengaliDate, '2026-04-15');
  assert.equal(getMonthStart(1433, 1), '2026-04-15');
});

test('month boundaries and month lengths are calculated from consecutive Sankrantis', () => {
  const starts = Array.from({ length: 12 }, (_, i) => getMonthStart(1433, i + 1));
  assert.equal(new Set(starts).size, 12);
  for (let i = 0; i < 11; i++) {
    const days = (Date.parse(`${starts[i + 1]}T00:00:00Z`) - Date.parse(`${starts[i]}T00:00:00Z`)) / 86_400_000;
    assert.ok(days >= 29 && days <= 32, `Unexpected solar month length: ${days}`);
  }
});

test('Gregorian to Bengali to Gregorian round-trips at all 12 month starts', () => {
  for (let month = 1; month <= 12; month++) {
    const date = getMonthStart(1433, month);
    const bengali = gregorianToBengali(date);
    assert.deepEqual([bengali.year, bengali.month, bengali.day], [1433, month, 1]);
    assert.equal(bengaliToGregorian({ year: 1433, month, day: 1 }), date);
  }
});

test('every date in Bengali year 1433 round-trips through Gregorian conversion', () => {
  for (let month = 1; month <= 12; month++) {
    const start = getMonthStart(1433, month);
    const next = month === 12 ? getMonthStart(1434, 1) : getMonthStart(1433, month + 1);
    const length = (Date.parse(`${next}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000;
    for (let day = 1; day <= length; day++) {
      const gregorian = bengaliToGregorian({ year: 1433, month, day });
      const converted = gregorianToBengali(gregorian);
      assert.deepEqual([converted.year, converted.month, converted.day], [1433, month, day]);
    }
  }
});

test('Gregorian leap-day dates remain valid and reversible', () => {
  const converted = gregorianToBengali('2024-02-29');
  assert.equal(bengaliToGregorian({ year: converted.year, month: converted.month, day: converted.day }), '2024-02-29');
});

test('month/year boundaries around Pohela Boishakh are handled', () => {
  assert.deepEqual(
    (({ year, month, day }) => [year, month, day])(gregorianToBengali('2026-04-14')),
    [1432, 12, 30]
  );
  assert.deepEqual(
    (({ year, month, day }) => [year, month, day])(gregorianToBengali('2026-04-15')),
    [1433, 1, 1]
  );
  assert.equal(bengaliToGregorian({ year: 1433, month: 12, day: 1 }), '2027-03-16');
});

test('Panchang calculates tithi, nakshatra, yoga, karana and local sunrise/sunset', () => {
  const day = getPanchangDay('2026-11-12');
  assert.match(day.sunrise, /^2026-11-12T/);
  assert.match(day.sunset, /^2026-11-12T/);
  assert.ok(day.sunrise < day.sunset);
  for (const limb of [day.tithi, day.nakshatra, day.yoga, day.karana]) {
    assert.ok(limb.number >= 1);
    assert.ok(limb.name.length > 0);
    assert.ok(Date.parse(localIsoToDate(limb.startsAt)) < Date.parse(localIsoToDate(limb.endsAt)));
  }
  assert.equal(day.calculation.provenance, 'calculated');
  assert.equal(day.calculation.location.name, DEFAULT_LOCATION.name);
});

test('tithi and nakshatra transitions change on either side of their calculated end instant', () => {
  const day = getPanchangDay('2026-11-12');
  const tithiEnd = localIsoToDate(day.tithi.endsAt);
  const nakshatraEnd = localIsoToDate(day.nakshatra.endsAt);
  const beforeTithi = getPanchangAt(new Date(tithiEnd.getTime() - 60_000));
  const afterTithi = getPanchangAt(new Date(tithiEnd.getTime() + 60_000));
  const beforeNak = getPanchangAt(new Date(nakshatraEnd.getTime() - 60_000));
  const afterNak = getPanchangAt(new Date(nakshatraEnd.getTime() + 60_000));
  assert.notEqual(beforeTithi.tithi.number, afterTithi.tithi.number);
  assert.notEqual(beforeNak.nakshatra.number, afterNak.nakshatra.number);
});

test('location and timezone affect sunrise/sunset and are retained as metadata', () => {
  const kolkata = getPanchangDay('2026-11-12', DEFAULT_LOCATION);
  const siliguri = getPanchangDay('2026-11-12', {
    name: 'Siliguri, West Bengal, India', latitude: 26.7271, longitude: 88.3953, elevationMeters: 122, timeZone: 'Asia/Kolkata'
  });
  assert.notEqual(kolkata.sunrise, siliguri.sunrise);
  assert.equal(siliguri.calculation.location.name, 'Siliguri, West Bengal, India');
  assert.throws(() => getPanchangDay('2026-11-12', { ...DEFAULT_LOCATION, timeZone: 'Mars/Olympus' }), /time zone/i);
});

test('invalid dates and unsupported Bengali dates are rejected clearly', () => {
  assert.throws(() => gregorianToBengali('2026-02-30'), /Invalid ISO date/);
  assert.equal(validateIndiaBengaliDate({ year: 1433, month: 13, day: 1 }).valid, false);
  assert.throws(() => bengaliToGregorian({ year: 1433, month: 13, day: 1 }), /Month must be|month must be/i);
  assert.throws(() => findSankranti(2300, 1), /1800–2200/);
});
