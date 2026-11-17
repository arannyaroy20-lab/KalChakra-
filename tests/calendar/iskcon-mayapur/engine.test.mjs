import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LOCATION, IskconMayapurCalendarEngine, getMayapurPanchang,
  getTithiAt, getArunodayaTithi, decideEkadashiObservance,
  getPublishedEkadashis, getPublishedFestivals, isWithinPublishedParanaWindow
} from '../../../dist/engines/iskcon-mayapur/index.js';

const instant = (value) => new Date(value.replace(/\[.*\]$/, ''));

test('Mayapur is the default location with correct IANA timezone', () => {
  assert.equal(DEFAULT_LOCATION.timeZone, 'Asia/Kolkata');
  assert.equal(DEFAULT_LOCATION.name, 'Sri Mayapur, Nadia, West Bengal, India');
  assert.ok(DEFAULT_LOCATION.latitude > 23 && DEFAULT_LOCATION.latitude < 24);
  assert.ok(DEFAULT_LOCATION.longitude > 88 && DEFAULT_LOCATION.longitude < 89);
});

test('Mayapur astronomical day includes local sunrise/sunset and supported Panchang limbs', () => {
  const day = getMayapurPanchang('2026-11-13');
  assert.match(day.sunrise, /^2026-11-13T/);
  assert.match(day.sunset, /^2026-11-13T/);
  assert.ok(day.sunrise < day.sunset);
  assert.ok(day.tithi.number >= 1 && day.tithi.number <= 15);
  assert.ok(day.nakshatra.length > 0 && day.yoga.length > 0 && day.karana.length > 0);
  assert.equal(day.moonrise, null);
  assert.equal(day.moonset, null);
  assert.equal(day.calculation.location.name, DEFAULT_LOCATION.name);
  assert.equal(day.calculation.verification, 'calculated-unverified');
});

test('tithi transition is continuous and changes at the calculated boundary', () => {
  const tithi = getTithiAt(new Date('2026-11-13T00:00:00Z'));
  const end = instant(tithi.endsAt);
  const before = getTithiAt(new Date(end.getTime() - 60_000));
  const after = getTithiAt(new Date(end.getTime() + 60_000));
  assert.notEqual(before.index, after.index);
  assert.equal((after.index - before.index + 30) % 30, 1);
});

test('arunodaya is evaluated 96 minutes before local sunrise', () => {
  const date = '2026-11-13';
  const day = getMayapurPanchang(date);
  const sunrise = instant(day.sunrise);
  const arunodaya = getArunodayaTithi(date);
  const direct = getTithiAt(new Date(sunrise.getTime() - 96 * 60_000));
  assert.equal(arunodaya.index, direct.index);
});

test('Shuddha Ekadashi is accepted when Dashami is absent at arunodaya', () => {
  assert.deepEqual(decideEkadashiObservance({dashamiAtArunodaya:false,ekadashiAtSunrise:true,ekadashiAtPreviousSunrise:false,ekadashiAtNextSunrise:false,dvadashiAtSunrise:false,ekadashiSkippedAtSunrise:false}).kind,'shuddha-ekadashi');
});

test('Dashami at arunodaya disqualifies Shuddha Ekadashi; Dvadashi sunrise becomes Mahadvadashi candidate', () => {
  const result = decideEkadashiObservance({dashamiAtArunodaya:true,ekadashiAtSunrise:false,ekadashiAtPreviousSunrise:true,ekadashiAtNextSunrise:false,dvadashiAtSunrise:true,ekadashiSkippedAtSunrise:false});
  assert.equal(result.kind,'mahadvadashi');
});

test('Vriddhi and Kshaya tithi scenarios are explicitly classified as provisional cases', () => {
  const vriddhi = decideEkadashiObservance({dashamiAtArunodaya:false,ekadashiAtSunrise:true,ekadashiAtPreviousSunrise:false,ekadashiAtNextSunrise:true,dvadashiAtSunrise:false,ekadashiSkippedAtSunrise:false});
  const kshaya = decideEkadashiObservance({dashamiAtArunodaya:false,ekadashiAtSunrise:false,ekadashiAtPreviousSunrise:false,ekadashiAtNextSunrise:false,dvadashiAtSunrise:true,ekadashiSkippedAtSunrise:true});
  assert.equal(vriddhi.kind,'vriddhi-ekadashi');
  assert.equal(kshaya.kind,'kshaya-observance');
});

test('published Mayapur Ekadashi date and Parana window match official 2026 calendar', () => {
  const rows = getPublishedEkadashis('2026-11-01','2026-11-30');
  const rama = rows.find(x=>x.fastDate==='2026-11-05');
  const utthana = rows.find(x=>x.fastDate==='2026-11-21');
  assert.equal(rama?.name,'Rama Ekadasi');
  assert.deepEqual([rama?.paranaDate,rama?.paranaStart,rama?.paranaEnd],['2026-11-06','05:44','09:28']);
  assert.equal(utthana?.kind,'mahadvadashi');
  assert.equal(utthana?.mahadvadashiType,'Trisprisha');
  assert.equal(utthana?.verification,'verified-reference');
});

test('major Mayapur festival reference dates are sourced, not Gregorian-year formulas', () => {
  const events = getPublishedFestivals('2026-01-01','2027-12-31');
  const janmastami = events.find(x=>x.name==='Sri Krishna Janmastami');
  const ratha = events.find(x=>x.name==='Ratha Yatra');
  const gaura = events.find(x=>x.date==='2027-03-22'&&x.name==='Gaura Purnima');
  assert.equal(janmastami?.date,'2026-09-04');
  assert.equal(ratha?.date,'2026-07-16');
  assert.equal(gaura?.verification,'verified-reference');
  assert.ok(events.every(x=>x.source.includes('srimayapurdhama.com')));
});

test('location override changes sunrise and is retained in metadata', () => {
  const a = getMayapurPanchang('2026-11-13');
  const b = getMayapurPanchang('2026-11-13',{name:'Kolkata',latitude:22.5726,longitude:88.3639,timeZone:'Asia/Kolkata'});
  assert.notEqual(a.sunrise,b.sunrise);
  assert.equal(b.calculation.location.name,'Kolkata');
});

test('year boundaries and invalid dates/locations are handled', () => {
  const engine = new IskconMayapurCalendarEngine();
  assert.equal(engine.getDay('2027-01-01').date,'2027-01-01');
  assert.throws(()=>engine.getDay('2027-02-30'),/Invalid ISO date/);
  assert.throws(()=>new IskconMayapurCalendarEngine({...DEFAULT_LOCATION,timeZone:'Mars/Olympus'}),/time zone/i);
  assert.throws(()=>engine.getEkadashis('2027-02-01','2027-01-01'),/not be after/);
});

test('published data is preferred and calculated Parana is never fabricated', () => {
  const engine = new IskconMayapurCalendarEngine();
  const rows = engine.getEkadashis('2026-11-05','2026-11-05');
  assert.equal(rows[0].verification,'verified-reference');
  assert.ok(rows[0].paranaStart && rows[0].paranaEnd);
});


test('Parana accepts only times inside the published local window', () => {
  const row=getPublishedEkadashis('2026-11-05','2026-11-05')[0];
  assert.equal(isWithinPublishedParanaWindow(row,'06:30'),true);
  assert.equal(isWithinPublishedParanaWindow(row,'09:40'),false);
  assert.equal(isWithinPublishedParanaWindow({...row,verification:'calculated-unverified'},'06:30'),false);
});
