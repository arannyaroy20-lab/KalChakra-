import test from "node:test";
import assert from "node:assert/strict";
import { collectWebReminders } from "../../dist/ui/notifications.js";

const TODAY = "2026-11-21";

test("Web reminder collector covers Agendas, Schedules, LiveTask final-minute warning, and failure", () => {
  const notified = new Set(["ag:pre:old:2026-11-20"]);

  const agendas = [
    { id: "ag1", title: "Standup", date: TODAY, isAllDay: false, time: "09:00", reminder: true, repeat: "once", type: "work", createdAt: `${TODAY}T00:00:00Z` }
  ];
  const schedules = [
    { id: "sc1", title: "Math Block", date: TODAY, startMinutes: 600, endMinutes: 660, reminder: true, repeat: "once", type: "study", createdAt: `${TODAY}T00:00:00Z` }
  ];
  const deadlineMs = Date.parse(`${TODAY}T09:30:00+06:00`);
  const runningTask = {
    id: "t1",
    title: "Write Notes",
    date: TODAY,
    durationMinutes: 30,
    type: "study",
    status: "running",
    startedAtMs: deadlineMs - 30 * 60_000,
    deadlineAtMs: deadlineMs,
    createdAt: `${TODAY}T00:00:00Z`
  };

  // At 08:58 (538 mins): old yesterday key purged, ag1 pre-reminder fires
  const step1 = collectWebReminders({
    agendas,
    schedules,
    tasks: [runningTask],
    iso: TODAY,
    minutes: 538,
    nowMs: Date.parse(`${TODAY}T08:58:00+06:00`),
    language: "en",
    notifiedKeys: notified
  });
  assert.equal(notified.has("ag:pre:old:2026-11-20"), false);
  assert.equal(step1.length, 1);
  assert.equal(step1[0].view, "my-agenda");
  assert.match(step1[0].title, /In 2 mins: Standup/);

  // At 09:29:20 (569 mins, 40s left on t1): Live Task final-minute warning fires
  const step2 = collectWebReminders({
    agendas,
    schedules,
    tasks: [runningTask],
    iso: TODAY,
    minutes: 569,
    nowMs: deadlineMs - 40_000,
    language: "en",
    notifiedKeys: notified
  });
  assert.equal(step2.length, 1);
  assert.equal(step2[0].view, "live-task");
  assert.match(step2[0].title, /Final minute! Write Notes/);

  // At 09:30:00 -> task transitions from running to failed
  const failedTask = { ...runningTask, status: "failed" };
  const step3 = collectWebReminders({
    agendas,
    schedules,
    tasks: [failedTask],
    prevTasks: [runningTask],
    iso: TODAY,
    minutes: 570,
    nowMs: deadlineMs,
    language: "en",
    notifiedKeys: notified
  });
  assert.equal(step3.length, 1);
  assert.match(step3[0].title, /Task time ended: Write Notes/);

  // At 10:02 (602 mins): Schedule active start notice fires
  const step4 = collectWebReminders({
    agendas,
    schedules,
    tasks: [failedTask],
    prevTasks: [failedTask],
    iso: TODAY,
    minutes: 602,
    nowMs: Date.parse(`${TODAY}T10:02:00+06:00`),
    language: "en",
    notifiedKeys: notified
  });
  assert.equal(step4.length, 1);
  assert.equal(step4[0].view, "schedule");
  assert.match(step4[0].title, /Now starting: Math Block/);
});
