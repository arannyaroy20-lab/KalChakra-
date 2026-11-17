import test from 'node:test';
import assert from 'node:assert/strict';
import { CalendarManager, InvalidCalendarIdError, UnsupportedCalendarOperationError, CALENDAR_REGISTRY } from '../../dist/integration/index.js';

const IDS = ['bd-national', 'bd-bengali', 'india-bengali', 'iskcon-mayapur'];

test('all four independent engines are registered and retrievable', () => {
  const manager = new CalendarManager();
  assert.deepEqual(Object.keys(CALENDAR_REGISTRY), IDS);
  assert.deepEqual(manager.listCalendars().map(x => x.id), IDS);
  for (const id of IDS) assert.equal(manager.getCalendar(id).metadata.id, id);
});

test('calendar selection changes selected adapter without replacing engine instances', () => {
  const manager = new CalendarManager();
  const originalBdAdapter = manager.getCalendar('bd-bengali');
  manager.setSelectedCalendar('bd-bengali');
  assert.equal(manager.getSelectedCalendarId(), 'bd-bengali');
  assert.equal(manager.getCalendar('bd-bengali'), originalBdAdapter);
  manager.setSelectedCalendar('india-bengali');
  assert.equal(manager.getCalendar('bd-bengali'), originalBdAdapter);
  assert.equal(manager.getSelectedCalendarId(), 'india-bengali');
});

test('Gregorian conversion uses the selected Bangladesh Bengali engine', () => {
  const manager = new CalendarManager({ selectedCalendarId: 'bd-bengali' });
  const result = manager.convertGregorianDate('2026-04-14');
  assert.equal(result.calendarId, 'bd-bengali');
  assert.equal(result.date.year, 1433);
  assert.equal(result.date.month, 1);
  assert.equal(result.date.day, 1);
  assert.equal(manager.convertCalendarDate({ year: 1433, month: 1, day: 1 }), '2026-04-14');
});

test('Gregorian conversion uses the separate West Bengal engine', () => {
  const manager = new CalendarManager({ selectedCalendarId: 'india-bengali' });
  const result = manager.convertGregorianDate('2026-04-15');
  assert.equal(result.calendarId, 'india-bengali');
  assert.equal(result.date.gregorianDate, '2026-04-15');
  assert.equal(manager.convertCalendarDate({ year: result.date.year, month: result.date.month, day: result.date.day }), '2026-04-15');
});

test('national calendar exposes its actual event data but not fabricated date conversion', () => {
  const manager = new CalendarManager({ selectedCalendarId: 'bd-national' });
  assert.ok(manager.getEvents('2026-01-01', '2026-12-31').length > 0);
  assert.throws(() => manager.convertGregorianDate('2026-04-14'), UnsupportedCalendarOperationError);
});

test('Mayapur exposes Panchang information and observance events, not reverse date conversion', () => {
  const manager = new CalendarManager({ selectedCalendarId: 'iskcon-mayapur' });
  const day = manager.getCalendarInfo('2026-03-03');
  assert.equal(day.date, '2026-03-03');
  assert.ok(day.tithi.name);
  assert.ok(manager.getEvents('2026-03-01', '2026-03-31').length > 0);
  assert.throws(() => manager.convertGregorianDate('2026-03-03'), UnsupportedCalendarOperationError);
  assert.throws(() => manager.convertCalendarDate({ year: 1433, month: 1, day: 1 }), UnsupportedCalendarOperationError);
});

test('language changes localized labels and formatting, not selected calendar', () => {
  const manager = new CalendarManager({ selectedCalendarId: 'bd-bengali', language: 'en' });
  const englishName = manager.getLocalizedSelectedCalendarMetadata().name;
  const englishDate = manager.formatDate('2026-04-14');
  manager.setDisplayLanguage('bn');
  const bengaliName = manager.getLocalizedSelectedCalendarMetadata().name;
  const bengaliDate = manager.formatDate('2026-04-14');
  assert.notEqual(englishName, bengaliName);
  assert.notEqual(englishDate, bengaliDate);
  assert.equal(manager.getSelectedCalendarId(), 'bd-bengali');
  assert.equal(manager.convertGregorianDate('2026-04-14').date.year, 1433);
});

test('invalid calendar IDs are rejected by retrieval and selection', () => {
  const manager = new CalendarManager();
  assert.throws(() => manager.getCalendar('not-a-calendar'), InvalidCalendarIdError);
  assert.throws(() => manager.setSelectedCalendar('not-a-calendar'), InvalidCalendarIdError);
});

test('metadata declares capabilities and default locations where applicable', () => {
  const manager = new CalendarManager();
  const bd = manager.listCalendars().find(x => x.id === 'bd-bengali');
  const india = manager.listCalendars().find(x => x.id === 'india-bengali');
  const mayapur = manager.listCalendars().find(x => x.id === 'iskcon-mayapur');
  assert.ok(bd.capabilities.includes('gregorian-to-calendar'));
  assert.ok(!manager.getCalendar('bd-national').metadata.capabilities.includes('gregorian-to-calendar'));
  assert.equal(india.defaultLocation?.timeZone, 'Asia/Kolkata');
  assert.equal(mayapur.defaultLocation?.name, 'Sri Mayapur, Nadia, West Bengal, India');
});
