import test from 'node:test';
import assert from 'node:assert/strict';
import { BangladeshNationalCalendarEngine } from '../../dist/engines/bd-national/bd-national.engine.js';
import { gregorianToBengali } from '../../dist/engines/bd-bengali/bd-bengali.calendar.js';
import { gregorianToBengali as indiaGregorianToBengali } from '../../dist/engines/india-bengali/calendar-conversion.js';
import { IskconMayapurCalendarEngine } from '../../dist/engines/iskcon-mayapur/iskcon-mayapur.engine.js';
import {
  normalizeBdNationalDate,
  normalizeBdBengaliDate,
  normalizeBdBengaliDay,
  normalizeIndiaBengaliDate,
  normalizeIndiaBengaliDay,
  normalizeIskconMayapurDay,
  getLocalizedCalendarDateLabel,
  getLocalizedCalendarMonthLabel
} from '../../dist/data-model/index.js';

const nationalEngine = new BangladeshNationalCalendarEngine();
const mayapurEngine = new IskconMayapurCalendarEngine();

test('normalizes Bangladesh National date and preserves matching event source provenance', () => {
  const events = nationalEngine.getEventsInRange('2026-03-26', '2026-03-27');
  const day = normalizeBdNationalDate('2026-03-26', events);
  assert.equal(day.date.calendarId, 'bd-national');
  assert.equal(day.date.gregorianDate, '2026-03-26');
  assert.equal(day.date.calendarYear, undefined);
  assert.equal(day.date.calendarMonthNumber, undefined);
  assert.ok(day.events.every(event => event.engine === 'bd-national'));
  assert.equal(day.provenance.sources.length, 2);
  assert.equal(day.provenance.verification[0], 'verified');
});

test('normalizes Bangladesh revised Bengali date without conflating West Bengal rules', () => {
  const original = gregorianToBengali('2026-04-14');
  const normalized = normalizeBdBengaliDate(original);
  assert.equal(normalized.calendarId, 'bd-bengali');
  assert.equal(normalized.calendarYear, original.year);
  assert.equal(normalized.calendarMonthNumber, 1);
  assert.equal(normalized.calendarMonthName.en, 'Boishakh');
  assert.equal(normalized.gregorianDate, '2026-04-14');
});

test('date-only Bengali engine results can be wrapped as unified calendar days without invented events', () => {
  const bdDay = normalizeBdBengaliDay(gregorianToBengali('2026-04-14'));
  const indiaDay = normalizeIndiaBengaliDay(indiaGregorianToBengali('2026-04-15'));
  assert.equal(bdDay.date.calendarId, 'bd-bengali');
  assert.deepEqual(bdDay.events, []);
  assert.equal(bdDay.date.astronomical, undefined);
  assert.equal(indiaDay.date.calendarId, 'india-bengali');
  assert.deepEqual(indiaDay.events, []);
  assert.equal(indiaDay.date.astronomical.method, 'meeus-analytical');
});

test('normalizes West Bengal Panjika date and preserves calculation metadata and location', () => {
  const original = indiaGregorianToBengali('2026-04-15');
  const normalized = normalizeIndiaBengaliDate(original);
  assert.equal(normalized.calendarId, 'india-bengali');
  assert.equal(normalized.calendarMonthNumber, original.month);
  assert.equal(normalized.astronomical.method, 'meeus-analytical');
  assert.equal(normalized.location.name, original.calculation.location.name);
  assert.equal(normalized.timeZone, original.calculation.timeZone);
});

test('the two Bengali calendar systems remain distinct even for the same Gregorian day', () => {
  const bd = normalizeBdBengaliDate(gregorianToBengali('2026-04-15'));
  const india = normalizeIndiaBengaliDate(indiaGregorianToBengali('2026-04-15'));
  assert.equal(bd.calendarId, 'bd-bengali');
  assert.equal(india.calendarId, 'india-bengali');
  assert.notDeepEqual(
    { year: bd.calendarYear, month: bd.calendarMonthNumber, day: bd.calendarDay },
    { year: india.calendarYear, month: india.calendarMonthNumber, day: india.calendarDay }
  );
});

test('normalizes Mayapur Panchang, sunrise/sunset, location and calculation provenance', () => {
  const original = mayapurEngine.getDay('2026-03-03');
  const events = mayapurEngine.getEvents('2026-03-03', '2026-03-03');
  const day = normalizeIskconMayapurDay(original, events);
  assert.equal(day.date.calendarId, 'iskcon-mayapur');
  assert.equal(day.date.calendarYear, undefined);
  assert.equal(day.panchang.engine, 'iskcon-mayapur');
  assert.equal(day.panchang.tithi.name, original.tithi.name);
  assert.equal(day.panchang.nakshatra, original.nakshatra);
  assert.equal(day.sunrise, original.sunrise);
  assert.equal(day.sunset, original.sunset);
  assert.equal(day.provenance.calculation.source, original.calculation.source);
  assert.equal(day.provenance.calculation.verification, 'calculated-unverified');
  assert.equal(day.date.timeZone, original.calculation.timeZone);
});

test('preserves Mayapur festival and Ekadashi observance fields and sources', () => {
  const original = mayapurEngine.getDay('2026-03-03');
  const festival = { date: '2026-03-03', name: 'Gaura Purnima', category: 'festival', source: 'official Mayapur annual calendar', verification: 'verified-reference' };
  const ekadashi = { name: 'Example Ekadashi', fastDate: '2026-03-03', paranaDate: '2026-03-04', paranaStart: '06:00', paranaEnd: '09:00', kind: 'shuddha-ekadashi', source: 'official Mayapur annual calendar', verification: 'verified-reference', notes: ['published reference'] };
  const day = normalizeIskconMayapurDay(original, [festival, ekadashi]);
  assert.equal(day.events.length, 2);
  assert.ok(day.events.some(event => event.kind === 'festival' && event.value.name === 'Gaura Purnima'));
  assert.ok(day.events.some(event => event.kind === 'ekadashi' && event.value.paranaStart === '06:00'));
  assert.ok(day.provenance.sourceIdentifiers.includes('official Mayapur annual calendar'));
  assert.ok(day.provenance.verification.includes('verified-reference'));
});

test('returns Bengali and English labels without changing the engine date identity', () => {
  const value = normalizeBdBengaliDate(gregorianToBengali('2026-04-14'));
  assert.match(getLocalizedCalendarDateLabel(value, 'bn'), /বৈশাখ/);
  assert.match(getLocalizedCalendarDateLabel(value, 'en'), /Boishakh/);
  assert.equal(getLocalizedCalendarMonthLabel(value, 'bn'), 'বৈশাখ');
  assert.equal(value.calendarId, 'bd-bengali');
});

test('validates malformed Gregorian dates and mismatched month metadata', () => {
  assert.throws(() => normalizeBdNationalDate('2026-02-30'), /valid Gregorian date/);
  const valid = gregorianToBengali('2026-04-14');
  assert.throws(() => normalizeBdBengaliDate({ ...valid, monthName: { bn: 'ভাদ্র', en: 'Bhadra' } }), /does not match/);
  assert.throws(() => normalizeBdBengaliDate({ ...valid, day: valid.day + 1 }), /resolve to/);
  assert.throws(() => normalizeIndiaBengaliDate({ ...indiaGregorianToBengali('2026-04-15'), gregorianDate: 'not-a-date' }), /ISO date/);
  const indiaDate = indiaGregorianToBengali('2026-04-15');
  assert.throws(() => normalizeIndiaBengaliDate({ ...indiaDate, day: indiaDate.day + 1 }), /resolve to/);
});

test('rejects inconsistent engine identity and invalid Mayapur sunrise/sunset data', () => {
  const valid = mayapurEngine.getDay('2026-03-03');
  assert.throws(() => normalizeIskconMayapurDay({ ...valid, date: '2026-02-30' }), /valid Gregorian date/);
  assert.throws(() => normalizeIskconMayapurDay({ ...valid, sunset: valid.sunrise }), /after sunrise/);
  const event = { ...nationalEngine.getEventsInRange('2026-03-26', '2026-03-26')[0], engine: 'india-bengali' };
  assert.throws(() => normalizeBdNationalDate('2026-03-26', [event]), /engine mismatch/);
});
