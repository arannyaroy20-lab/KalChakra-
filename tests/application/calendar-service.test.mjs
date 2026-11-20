import test from 'node:test';
import assert from 'node:assert/strict';
import { getCalendarDay, getCalendarMonth, formatSelectedCalendarDate, listCalendarOptions } from '../../dist/application/calendar-service.js';

const date = '2026-11-12';

test('all four independent engines return a daily response for a valid Gregorian date', () => {
  const ids = ['bd-national', 'bd-bengali', 'india-bengali', 'iskcon-mayapur'];
  for (const id of ids) {
    const result = getCalendarDay(date, id, 'en');
    assert.equal(result.date.gregorianDate, date);
    assert.equal(result.date.calendarId, id);
    assert.equal(result.displayLanguage, 'en');
    assert.ok(Array.isArray(result.events));
    assert.ok(result.gregorian.formatted.en.includes('2026'));
  }
});

test('Bangladesh revised Bengali date matches independent published anchor dates', () => {
  const day = getCalendarDay('2026-04-14', 'bd-bengali', 'bn');
  assert.deepEqual([day.date.calendarYear, day.date.calendarMonthNumber, day.date.calendarDay], [1433, 1, 1]);
  assert.equal(formatSelectedCalendarDate(day, 'bn'), '১ বৈশাখ ১৪৩৩');
  assert.equal(formatSelectedCalendarDate(day, 'en'), '1 Boishakh 1433');
});

test('national calendar keeps Gregorian as its native event date and does not invent a Bangla date', () => {
  const day = getCalendarDay('2026-02-21', 'bd-national', 'bn');
  assert.equal(day.nativeDateAvailable, false);
  assert.match(formatSelectedCalendarDate(day, 'en'), /Gregorian date/);
  assert.ok(day.events.length > 0);
  assert.ok(day.events.every(event => event.engine === 'bd-national'));
});

test('calendar selection and interface language are independent', () => {
  const bn = getCalendarDay('2026-04-14', 'bd-bengali', 'bn');
  const en = getCalendarDay('2026-04-14', 'bd-bengali', 'en');
  assert.equal(bn.date.calendarYear, en.date.calendarYear);
  assert.equal(bn.date.calendarMonthNumber, en.date.calendarMonthNumber);
  assert.equal(bn.calendarName.bn, en.calendarName.bn);
  assert.equal(bn.displayLanguage, 'bn');
  assert.equal(en.displayLanguage, 'en');
  assert.equal(listCalendarOptions().length, 4);
});

test('month service returns chronological Gregorian days across month and year boundaries', () => {
  const february = getCalendarMonth(2024, 2, 'bd-bengali', 'en');
  assert.equal(february.days.length, 29);
  assert.equal(february.days[0].date.gregorianDate, '2024-02-01');
  assert.equal(february.days.at(-1).date.gregorianDate, '2024-02-29');
  const april = getCalendarMonth(2026, 4, 'bd-bengali', 'bn');
  assert.deepEqual([april.days[12].date.calendarMonthNumber, april.days[12].date.calendarDay], [12, 30]);
  assert.deepEqual([april.days[13].date.calendarYear, april.days[13].date.calendarMonthNumber, april.days[13].date.calendarDay], [1433, 1, 1]);
});

test('invalid Gregorian dates, calendar IDs, language and month values fail clearly', () => {
  assert.throws(() => getCalendarDay('2026-02-30', 'bd-bengali', 'en'), /Invalid Gregorian date/);
  assert.throws(() => getCalendarDay('2026-02-28', 'unknown', 'en'), /Invalid calendar ID/);
  assert.throws(() => getCalendarDay('2026-02-28', 'bd-bengali', 'fr'), /Invalid display language/);
  assert.throws(() => getCalendarMonth(2026, 13, 'bd-bengali', 'en'), /month must be/i);
});

test('location and timezone overrides are applied to astronomical calculations', () => {
  const result = getCalendarDay('2026-11-12', 'india-bengali', 'en', {
    location: { name: 'Siliguri, India', latitude: 26.7271, longitude: 88.3953, timeZone: 'Asia/Kolkata' }
  });
  assert.equal(result.date.location.name, 'Siliguri, India');
  assert.ok(result.panchang.sunrise.startsWith('2026-11-12T'));
});

test('missing event data and unsupported native-date fields remain explicitly absent', () => {
  const national = getCalendarDay('2025-01-01', 'bd-national', 'en');
  const mayapur = getCalendarDay('2026-11-12', 'iskcon-mayapur', 'en');
  const bengali = getCalendarDay('2026-11-12', 'bd-bengali', 'en');
  assert.deepEqual(national.events, []);
  assert.equal(national.nativeDateAvailable, false);
  assert.equal(mayapur.nativeDateAvailable, false);
  assert.equal(mayapur.panchang.engine, 'iskcon-mayapur');
  assert.deepEqual(bengali.events, []);
  assert.equal(bengali.panchang, undefined);
});
