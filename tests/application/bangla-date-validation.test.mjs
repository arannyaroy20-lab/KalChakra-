import test from 'node:test';
import assert from 'node:assert/strict';
import { clearBanglaDateValidationCache, validateBangladeshBengaliDate } from '../../dist/validation/bangla-date-today.js';

const matchingPayload = { date: '2026-04-14', bengali: { year: 1433, month: 1, day: 1, monthName: { bn: 'বৈশাখ', en: 'Boishakh' }, formatted: { bn: '১লা বৈশাখ ১৪৩৩ বঙ্গাব্দ', en: '1 Boishakh 1433' } } };
const response = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });

test('external validation reports a match and caches explicit-date response', async () => {
  clearBanglaDateValidationCache();
  let calls = 0;
  const fetcher = async () => { calls++; return response(matchingPayload); };
  const first = await validateBangladeshBengaliDate('2026-04-14', { fetcher, now: () => 1000 });
  const second = await validateBangladeshBengaliDate('2026-04-14', { fetcher, now: () => 2000 });
  assert.equal(first.status, 'matched');
  assert.equal(second.cached, true);
  assert.equal(calls, 1);
});

test('external mismatch is reported without replacing internal conversion', async () => {
  clearBanglaDateValidationCache();
  const mismatch = structuredClone(matchingPayload);
  mismatch.bengali.day = 2;
  const result = await validateBangladeshBengaliDate('2026-04-14', { fetcher: async () => response(mismatch), now: () => 5000 });
  assert.equal(result.status, 'mismatch');
  assert.equal(result.internal.day, 1);
  assert.equal(result.external.day, 2);
});

test('offline and timeout failures retain the internal Bangladesh Bengali date', async () => {
  clearBanglaDateValidationCache();
  const offline = await validateBangladeshBengaliDate('2026-04-14', { fetcher: async () => { throw new TypeError('network down'); } });
  assert.equal(offline.status, 'offline');
  assert.equal(offline.internal.day, 1);
  clearBanglaDateValidationCache();
  const timeout = await validateBangladeshBengaliDate('2026-04-14', { timeoutMs: 1, fetcher: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))) });
  assert.equal(timeout.status, 'offline');
  assert.match(timeout.message, /timed out/i);
});

test('rate limits and non-success HTTP responses are handled without throwing', async () => {
  clearBanglaDateValidationCache();
  const limited = await validateBangladeshBengaliDate('2026-04-14', { fetcher: async () => response({}, 429) });
  assert.equal(limited.status, 'rate-limited');
  clearBanglaDateValidationCache();
  const unavailable = await validateBangladeshBengaliDate('2026-04-14', { fetcher: async () => response({}, 503) });
  assert.equal(unavailable.status, 'unavailable');
});

test('explicit-date validation cache expires after 24 hours', async () => {
  clearBanglaDateValidationCache();
  let calls = 0;
  const fetcher = async () => { calls++; return response(matchingPayload); };
  await validateBangladeshBengaliDate('2026-04-14', { fetcher, now: () => 1000 });
  await validateBangladeshBengaliDate('2026-04-14', { fetcher, now: () => 86_402_000 });
  assert.equal(calls, 2);
});
