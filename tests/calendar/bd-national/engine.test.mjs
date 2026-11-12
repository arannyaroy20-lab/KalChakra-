import test from "node:test";
import assert from "node:assert/strict";
import {
  BangladeshNationalCalendarEngine,
  loadYearEvents,
  getAvailableYears,
  filterEvents,
  detectDuplicateEvents,
  validateEvent
} from "../../../dist/engines/bd-national/index.js";

test("available datasets and loading", () => {
  assert.deepEqual(getAvailableYears(), [2026, 2027]);
  assert.ok(loadYearEvents(2026).length > 10);
  assert.throws(() => loadYearEvents(2028), /No Bangladesh National Calendar dataset/);
});

test("engine facade returns metadata and filtered events", () => {
  const engine = new BangladeshNationalCalendarEngine();
  assert.equal(engine.getYearMetadata(2026).completeness, "partial");
  const march = engine.getEvents(2026, { from: "2026-03-01", to: "2026-03-31" });
  assert.ok(march.length > 0);
  assert.ok(march.every((event) => event.startDate <= "2026-03-31" && event.endDate >= "2026-03-01"));
});

test("category and holiday filters", () => {
  const result = filterEvents(loadYearEvents(2026), {
    categories: ["national"], holidayStatuses: ["general-holiday"]
  });
  assert.ok(result.length > 0);
  assert.ok(result.every((event) => event.category === "national" && event.holidayStatus === "general-holiday"));
});

test("all curated events pass validation and datasets contain no duplicates", () => {
  for (const year of [2026, 2027]) {
    const events = loadYearEvents(year);
    for (const event of events) assert.deepEqual(validateEvent(event), []);
    assert.deepEqual(detectDuplicateEvents(events), []);
  }
});

test("validator rejects missing translations and impossible dates", () => {
  const event = loadYearEvents(2026)[0];
  assert.ok(event);
  const invalid = { ...event, title: { bn: "", en: "" }, startDate: "2026-02-30" };
  const fields = validateEvent(invalid).map((issue) => issue.field);
  assert.ok(fields.includes("title.bn"));
  assert.ok(fields.includes("title.en"));
  assert.ok(fields.includes("startDate"));
});

test("duplicate detector catches repeated event titles and date ranges", () => {
  const event = loadYearEvents(2026)[0];
  assert.ok(event);
  const copy = { ...event, id: "duplicate-copy" };
  assert.equal(detectDuplicateEvents([event, copy])[0]?.reason, "same-title-and-range");
});
