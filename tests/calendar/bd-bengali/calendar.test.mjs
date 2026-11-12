import test from "node:test";
import assert from "node:assert/strict";
import {
  bengaliToGregorian,
  formatBengaliDate,
  getBengaliMonthLengths,
  getBengaliYearInfo,
  gregorianToBengali,
  isBengaliLeapYear,
  isValidBengaliDate,
  toBengaliNumerals
} from "../../../dist/engines/bd-bengali/index.js";

test("fixed Bangladesh revised-calendar anchors", () => {
  assert.deepEqual(
    (({ year, month, day }) => ({ year, month, day }))(gregorianToBengali("2026-04-14")),
    { year: 1433, month: 1, day: 1 }
  );
  assert.deepEqual(
    (({ year, month, day }) => ({ year, month, day }))(gregorianToBengali("2026-02-21")),
    { year: 1432, month: 11, day: 8 }
  );
  assert.deepEqual(
    (({ year, month, day }) => ({ year, month, day }))(gregorianToBengali("2026-03-26")),
    { year: 1432, month: 12, day: 12 }
  );
  assert.deepEqual(
    (({ year, month, day }) => ({ year, month, day }))(gregorianToBengali("2026-12-16")),
    { year: 1433, month: 9, day: 1 }
  );
});

test("month lengths follow the 2019 Bangladesh revision", () => {
  assert.deepEqual(getBengaliMonthLengths(1432), [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 29, 30]);
  assert.deepEqual(getBengaliMonthLengths(1430), [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 30]);
  assert.equal(getBengaliYearInfo(1432).totalDays, 365);
  assert.equal(getBengaliYearInfo(1430).totalDays, 366);
});

test("Falgun receives the leap day when its Gregorian February is leap", () => {
  assert.equal(isBengaliLeapYear(1430), true); // Falgun 1430 falls in Feb–Mar 2024.
  assert.equal(isBengaliLeapYear(1431), false);
  assert.deepEqual(gregorianToBengali("2024-03-14").day, 30);
  assert.deepEqual(gregorianToBengali("2024-03-15").month, 12);
  assert.deepEqual(gregorianToBengali("2025-03-14").month, 11);
  assert.deepEqual(gregorianToBengali("2025-03-14").day, 29);
  assert.deepEqual(gregorianToBengali("2025-03-15").month, 12);
  assert.deepEqual(gregorianToBengali("2025-03-15").day, 1);
});

test("month and year boundaries convert in both directions", () => {
  assert.equal(bengaliToGregorian({ year: 1432, month: 1, day: 1 }), "2025-04-14");
  assert.equal(bengaliToGregorian({ year: 1432, month: 2, day: 1 }), "2025-05-15");
  assert.equal(bengaliToGregorian({ year: 1432, month: 11, day: 29 }), "2026-03-14");
  assert.equal(bengaliToGregorian({ year: 1432, month: 12, day: 1 }), "2026-03-15");
  assert.equal(bengaliToGregorian({ year: 1432, month: 12, day: 30 }), "2026-04-13");
  assert.equal(bengaliToGregorian({ year: 1433, month: 1, day: 1 }), "2026-04-14");
});

test("round-trips dates across leap, ordinary and year-boundary cases", () => {
  const dates = ["1900-04-14", "2000-02-29", "2024-02-29", "2024-03-14", "2024-03-15", "2025-04-13", "2025-04-14", "2026-12-31", "2096-04-13"];
  for (const date of dates) {
    const bengali = gregorianToBengali(date);
    assert.equal(bengaliToGregorian({ year: bengali.year, month: bengali.month, day: bengali.day }), date);
  }
});

test("validation and formatting", () => {
  assert.equal(isValidBengaliDate({ year: 1432, month: 11, day: 29 }), true);
  assert.equal(isValidBengaliDate({ year: 1432, month: 11, day: 30 }), false);
  assert.equal(isValidBengaliDate({ year: 1430, month: 11, day: 30 }), true);
  assert.equal(isValidBengaliDate({ year: 1432, month: 13, day: 1 }), false);
  assert.throws(() => bengaliToGregorian({ year: 1432, month: 11, day: 30 }), /Invalid Bangladesh Bengali date/);
  assert.equal(formatBengaliDate({ year: 1432, month: 11, day: 8 }), "৮ ফাল্গুন ১৪৩২");
  assert.equal(formatBengaliDate({ year: 1432, month: 11, day: 8 }, true), "শনিবার, ৮ ফাল্গুন ১৪৩২");
  assert.equal(toBengaliNumerals("1432-02-08"), "১৪৩২-০২-০৮");
});

test("Gregorian century leap-year rules are respected", () => {
  // Bengali year 1306 contains February 1900, which is not a Gregorian leap year.
  assert.equal(isBengaliLeapYear(1306), false);
  // Bengali year 1406 contains February 2000, which is a Gregorian leap year.
  assert.equal(isBengaliLeapYear(1406), true);
  assert.equal(gregorianToBengali("2000-03-14").day, 30);
});

test("every date in several complete Bengali years round-trips", () => {
  for (const year of [1425, 1426, 1427, 1428, 1429, 1430, 1431, 1432, 1433, 1434]) {
    const info = getBengaliYearInfo(year);
    for (let month = 1; month <= 12; month += 1) {
      for (let day = 1; day <= info.monthLengths[month - 1]; day += 1) {
        const gregorian = bengaliToGregorian({ year, month, day });
        const roundTrip = gregorianToBengali(gregorian);
        assert.deepEqual(
          { year: roundTrip.year, month: roundTrip.month, day: roundTrip.day },
          { year, month, day },
          `Round-trip failed for ${year}-${month}-${day}`
        );
      }
    }
  }
});
