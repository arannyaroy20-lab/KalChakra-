import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildWindowsGotItToastXml,
  evaluateDesktopReminders,
  parseGotItProtocolUrl
} = require("../../electron/reminders.cjs");

const TODAY = "2026-11-21";

test("Desktop Agenda reminders fire 2 minutes before, on start, and all-day once per day", () => {
  const notified = new Set();
  const agendas = [
    { id: "a1", title: "Doctor Visit", date: TODAY, isAllDay: false, time: "10:30", reminder: true, repeat: "once" },
    { id: "a2", title: "Anniversary", date: TODAY, isAllDay: true, reminder: true, repeat: "once" },
    { id: "a3", title: "Silent Note", date: TODAY, isAllDay: false, time: "10:30", reminder: false, repeat: "once" }
  ];

  // 10:28 -> pre-reminder for a1 + all-day a2 (between 08:00 and 22:00); silent a3 ignored
  const pre = evaluateDesktopReminders({
    agendas,
    schedules: [],
    tasks: [],
    iso: TODAY,
    minutes: 10 * 60 + 28,
    nowMs: Date.parse(`${TODAY}T10:28:00+06:00`),
    lang: "en",
    notifiedKeys: notified
  });
  assert.equal(pre.notifications.length, 2);
  assert.ok(pre.notifications.some(n => n.title.includes("In 2 mins: Doctor Visit")));
  assert.ok(pre.notifications.some(n => n.title.includes("Today's agenda: Anniversary")));

  // Re-checking same minute does not duplicate
  const dup = evaluateDesktopReminders({
    agendas,
    schedules: [],
    tasks: [],
    iso: TODAY,
    minutes: 10 * 60 + 28,
    nowMs: Date.parse(`${TODAY}T10:28:15+06:00`),
    lang: "en",
    notifiedKeys: notified
  });
  assert.equal(dup.notifications.length, 0);

  // 10:30 -> exact time notification for a1
  const exact = evaluateDesktopReminders({
    agendas,
    schedules: [],
    tasks: [],
    iso: TODAY,
    minutes: 10 * 60 + 30,
    nowMs: Date.parse(`${TODAY}T10:30:00+06:00`),
    lang: "en",
    notifiedKeys: notified
  });
  assert.equal(exact.notifications.length, 1);
  assert.ok(exact.notifications[0].title.includes("Now: Doctor Visit"));
});

test("Desktop Schedule reminders differentiate standard 10-min Got it vs Campaign-linked live window", () => {
  const notified = new Set();
  const schedules = [
    { id: "s1", title: "Morning Run", date: TODAY, startMinutes: 420, endMinutes: 480, reminder: true, repeat: "once" },
    { id: "s2", title: "Deep Coding", date: TODAY, startMinutes: 600, endMinutes: 720, reminder: true, repeat: "once", campaignId: "cmp-1" },
    { id: "s3", title: "Done Already", date: TODAY, startMinutes: 420, endMinutes: 480, reminder: true, repeat: "once", completedDates: [TODAY] }
  ];

  // 2 mins before s1 (06:58 = 418) -> skips completed s3
  const pre = evaluateDesktopReminders({
    agendas: [],
    schedules,
    tasks: [],
    iso: TODAY,
    minutes: 418,
    nowMs: Date.parse(`${TODAY}T06:58:00+06:00`),
    lang: "en",
    notifiedKeys: notified
  });
  assert.equal(pre.notifications.length, 1);
  assert.match(pre.notifications[0].title, /Starting in 2 mins: Morning Run/);

  // At 07:05 (425, inside 10 min window for s1)
  const startRegular = evaluateDesktopReminders({
    agendas: [],
    schedules,
    tasks: [],
    iso: TODAY,
    minutes: 425,
    nowMs: Date.parse(`${TODAY}T07:05:00+06:00`),
    lang: "en",
    notifiedKeys: notified
  });
  assert.equal(startRegular.notifications.length, 1);
  assert.equal(startRegular.notifications[0].gotItScheduleId, "s1");
  assert.match(startRegular.notifications[0].body, /within 10 mins/);

  // Campaign schedule at 10:25 (625, > 10 mins after start 600, still inside [600, 720)!)
  const startCampaign = evaluateDesktopReminders({
    agendas: [],
    schedules,
    tasks: [],
    iso: TODAY,
    minutes: 625,
    nowMs: Date.parse(`${TODAY}T10:25:00+06:00`),
    lang: "en",
    notifiedKeys: notified
  });
  assert.equal(startCampaign.notifications.length, 1);
  assert.equal(startCampaign.notifications[0].gotItScheduleId, "s2");
  assert.equal(startCampaign.notifications[0].channel, "multical:open-live-task");
  assert.match(startCampaign.notifications[0].body, /Campaign live task active/);
});

test("Campaign-linked running live task fires ONLY ONE final-minute warning (no double notification)", () => {
  const notified = new Set();
  const startMs = Date.parse(`${TODAY}T10:00:00+06:00`);
  const endMs = Date.parse(`${TODAY}T11:00:00+06:00`);
  const schedules = [
    { id: "sch-9", title: "Study Sprint", date: TODAY, startMinutes: 600, endMinutes: 660, reminder: true, repeat: "once", campaignId: "cmp-1" }
  ];
  const tasks = [
    {
      id: `sch-live:sch-9:${TODAY}`,
      title: "Study Sprint",
      date: TODAY,
      durationMinutes: 60,
      type: "study",
      campaignId: "cmp-1",
      sourceScheduleId: "sch-9",
      status: "running",
      startedAtMs: startMs,
      deadlineAtMs: endMs
    }
  ];

  // Seed sch:now as already fired so we isolate the final-minute check
  notified.add(`sch:now:sch-9:${TODAY}`);

  // 30 seconds before endMs
  const res = evaluateDesktopReminders({
    agendas: [],
    schedules,
    tasks,
    iso: TODAY,
    minutes: 659,
    nowMs: endMs - 30_000,
    lang: "en",
    notifiedKeys: notified
  });
  const warnings = res.notifications.filter(n => n.title.includes("Final minute!"));
  assert.equal(warnings.length, 1);

  // At endMs -> task transitions to failed and fires one failure notification
  const expired = evaluateDesktopReminders({
    agendas: [],
    schedules,
    tasks,
    iso: TODAY,
    minutes: 660,
    nowMs: endMs,
    lang: "en",
    notifiedKeys: notified
  });
  assert.equal(expired.tasksChanged, true);
  assert.equal(expired.nextTasks[0].status, "failed");
  assert.equal(expired.notifications.length, 1);
  assert.match(expired.notifications[0].title, /Task time ended: Study Sprint/);
});

test("Windows Toast XML builder escapes special chars and protocol URL parses cleanly", () => {
  const xml = buildWindowsGotItToastXml({
    title: 'Run <Sprint> & "Check"',
    body: "10:00 AM - 11:00 AM",
    scheduleId: "sch/1?a=b",
    iso: TODAY,
    gotItText: "Got it"
  });
  assert.match(xml, /Run &lt;Sprint&gt; &amp; &quot;Check&quot;/);
  assert.match(xml, /activationType="protocol"/);

  const match = xml.match(/arguments="([^"]+)"/);
  assert.ok(match);
  const unescapedUri = match[1].replace(/&amp;/g, "&");
  const parsed = parseGotItProtocolUrl(unescapedUri);
  assert.deepEqual(parsed, { scheduleId: "sch/1?a=b", iso: TODAY });
  assert.equal(parseGotItProtocolUrl("multical://got-it/id/bad-date"), null);
});
