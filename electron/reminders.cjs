function dhakaNow(nowDate = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(nowDate);
  const get = type => parts.find(p => p.type === type)?.value ?? "00";
  const iso = `${get("year")}-${get("month")}-${get("day")}`;
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return { iso, minutes, nowMs: nowDate.getTime() };
}

function format12h(totalMinutes, lang) {
  const safe = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  const h24 = Math.floor(safe / 60);
  const mm = String(safe % 60).padStart(2, "0");
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const raw = `${h12}:${mm}`;
  const text = lang === "bn" ? raw.replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[Number(d)]) : raw;
  return `${text} ${period}`;
}

function parseYmd(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return { y, m, d, wd: dt.getUTCDay() };
}

function daysInMonthUtc(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function matchesDate(item, isoDate) {
  if (!item || typeof item.date !== "string" || isoDate < item.date) return false;
  if (item.repeat === "once") return isoDate === item.date;
  const start = parseYmd(item.date);
  const target = parseYmd(isoDate);
  if (item.repeat === "weekly") return target.wd === start.wd;
  if (item.repeat === "monthly") return target.d === Math.min(start.d, daysInMonthUtc(target.y, target.m));
  if (item.repeat === "yearly") return target.m === start.m && target.d === Math.min(start.d, daysInMonthUtc(target.y, target.m));
  if (item.repeat === "weekdays") return Array.isArray(item.weekdays) && item.weekdays.includes(target.wd);
  return false;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildWindowsGotItToastXml({ title, body, scheduleId, iso, gotItText = "Got it" }) {
  const protocolUri = `multical://got-it/${encodeURIComponent(scheduleId)}/${encodeURIComponent(iso)}`;
  return `<toast launch="multical://open-schedule">
  <visual>
    <binding template="ToastGeneric">
      <text>${escapeXml(title)}</text>
      <text>${escapeXml(body)}</text>
    </binding>
  </visual>
  <actions>
    <action content="${escapeXml(gotItText)}" arguments="${escapeXml(protocolUri)}" activationType="protocol" />
  </actions>
</toast>`;
}

function parseGotItProtocolUrl(arg) {
  if (typeof arg !== "string" || !arg.startsWith("multical://got-it/")) return null;
  const rest = arg.slice("multical://got-it/".length).replace(/\/+$/, "");
  const [rawId, rawIso] = rest.split("/");
  if (!rawId || !rawIso) return null;
  const scheduleId = decodeURIComponent(rawId);
  const iso = decodeURIComponent(rawIso);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return { scheduleId, iso };
}

function evaluateDesktopReminders({
  agendas = [],
  schedules = [],
  tasks = [],
  iso,
  minutes,
  nowMs,
  lang = "bn",
  notifiedKeys = new Set(),
  includeAgendaAndSchedule = true
}) {
  const notifications = [];

  for (const key of notifiedKeys) {
    if (!key.endsWith(`:${iso}`)) notifiedKeys.delete(key);
  }

  if (includeAgendaAndSchedule) {
    for (const agenda of agendas) {
      if (!agenda || !agenda.reminder || !matchesDate(agenda, iso)) continue;
      const comment = agenda.comment && String(agenda.comment).trim() ? String(agenda.comment).trim() : "";

      if (agenda.isAllDay || !agenda.time) {
        const key = `ag:allday:${agenda.id}:${iso}`;
        if (!notifiedKeys.has(key) && minutes >= 8 * 60 && minutes <= 22 * 60) {
          notifiedKeys.add(key);
          notifications.push({
            title: lang === "bn" ? `আজ আপনার এজেন্ডা: ${agenda.title}` : `Today's agenda: ${agenda.title}`,
            body: comment || (lang === "bn" ? "সারা দিনের নির্ধারিত এজেন্ডা" : "Scheduled all-day agenda"),
            channel: "multical:open-my-agenda"
          });
        }
        continue;
      }

      if (/^\d{2}:\d{2}$/.test(agenda.time)) {
        const [hh, mm] = agenda.time.split(":").map(Number);
        const targetMins = hh * 60 + mm;
        const timeStr = format12h(targetMins, lang);

        const preKey = `ag:pre:${agenda.id}:${iso}`;
        if (!notifiedKeys.has(preKey) && minutes >= targetMins - 2 && minutes < targetMins) {
          notifiedKeys.add(preKey);
          notifications.push({
            title: lang === "bn" ? `২ মিনিট পর: ${agenda.title}` : `In 2 mins: ${agenda.title}`,
            body: comment ? `${timeStr} · ${comment}` : (lang === "bn" ? `শুরু হবে ${timeStr}-এ` : `Starts at ${timeStr}`),
            channel: "multical:open-my-agenda"
          });
        }

        const nowKey = `ag:now:${agenda.id}:${iso}`;
        if (!notifiedKeys.has(nowKey) && minutes >= targetMins && minutes <= targetMins + 2) {
          notifiedKeys.add(nowKey);
          notifications.push({
            title: lang === "bn" ? `এখন আপনার "${agenda.title}"` : `Now: ${agenda.title}`,
            body: comment ? `${timeStr} · ${comment}` : (lang === "bn" ? `নির্ধারিত সময় ${timeStr} শুরু হয়েছে` : `Scheduled for ${timeStr}`),
            channel: "multical:open-my-agenda"
          });
        }
      }
    }

    for (const sch of schedules) {
      if (!sch || !sch.reminder || !matchesDate(sch, iso)) continue;
      if (Array.isArray(sch.completedDates) && sch.completedDates.includes(iso)) continue;
      if (typeof sch.startMinutes !== "number" || typeof sch.endMinutes !== "number") continue;

      const rangeText = `${format12h(sch.startMinutes, lang)} – ${format12h(sch.endMinutes, lang)}`;
      const comment = sch.comment && String(sch.comment).trim() ? String(sch.comment).trim() : "";

      const preKey = `sch:pre:${sch.id}:${iso}`;
      if (!notifiedKeys.has(preKey) && minutes >= sch.startMinutes - 2 && minutes < sch.startMinutes) {
        notifiedKeys.add(preKey);
        notifications.push({
          title: lang === "bn" ? `২ মিনিট পর শুরু: ${sch.title}` : `Starting in 2 mins: ${sch.title}`,
          body: comment ? `${rangeText} · ${comment}` : rangeText,
          channel: "multical:open-schedule"
        });
      }

      const nowKey = `sch:now:${sch.id}:${iso}`;
      const tickWindowEnd = sch.campaignId
        ? sch.endMinutes
        : Math.min(sch.endMinutes, sch.startMinutes + 10);
      if (!notifiedKeys.has(nowKey) && minutes >= sch.startMinutes && minutes < tickWindowEnd) {
        notifiedKeys.add(nowKey);
        const startBody = sch.campaignId
          ? (lang === "bn"
              ? `${rangeText} · ক্যাম্পেইন লাইভ টাস্ক চলছে (শেষ হওয়ার আগে Got it / Done টিক দিন)`
              : `${rangeText} · Campaign live task active (mark Done before end)`)
          : (lang === "bn"
              ? `${rangeText} · ১০ মিনিটের মধ্যে Got it টিক দিন`
              : `${rangeText} · Open to mark Got it within 10 mins`);
        notifications.push({
          title: lang === "bn" ? `এখন আপনার "${sch.title}" শুরু হয়েছে` : `Now starting: ${sch.title}`,
          body: startBody,
          channel: sch.campaignId ? "multical:open-live-task" : "multical:open-schedule",
          gotItScheduleId: sch.id,
          iso
        });
      }
    }
  }

  let tasksChanged = false;
  const expiredTasks = [];
  const handledScheduleIds = new Set();

  const nextTasks = tasks.map(task => {
    if (!task) return task;
    if (task.sourceScheduleId && task.date === iso) {
      handledScheduleIds.add(task.sourceScheduleId);
    }
    if (task.status !== "running" || typeof task.deadlineAtMs !== "number") return task;

    const rem = task.deadlineAtMs - nowMs;
    if (rem > 0 && rem <= 60_000) {
      const warnKey = `task:ending:${task.id}:${task.deadlineAtMs}:${iso}`;
      if (!notifiedKeys.has(warnKey)) {
        notifiedKeys.add(warnKey);
        notifications.push({
          title: lang === "bn" ? `শেষ মুহূর্ত! ${task.title}` : `Final minute! ${task.title}`,
          body: lang === "bn"
            ? "১ মিনিটের কম বাকি — সময় শেষ হওয়ার আগে Done টিক দিন"
            : "Under 1 minute left — mark Done before timer expires",
          channel: "multical:open-live-task"
        });
      }
      return task;
    }

    if (nowMs >= task.deadlineAtMs) {
      tasksChanged = true;
      expiredTasks.push(task);
      return { ...task, status: "failed" };
    }
    return task;
  });

  // Fallback for campaign-linked schedules if renderer has not yet synced sch-live:<id>:<iso> into tasks
  const baseDhakaMidnight = Date.parse(`${iso}T00:00:00+06:00`);
  for (const sch of schedules) {
    if (!sch || !sch.campaignId || handledScheduleIds.has(sch.id) || !matchesDate(sch, iso)) continue;
    if (Array.isArray(sch.completedDates) && sch.completedDates.includes(iso)) continue;
    if (typeof sch.startMinutes !== "number" || typeof sch.endMinutes !== "number") continue;

    const startMs = baseDhakaMidnight + sch.startMinutes * 60_000;
    const endMs = baseDhakaMidnight + sch.endMinutes * 60_000;
    const rem = endMs - nowMs;
    if (nowMs >= startMs && rem > 0 && rem <= 60_000) {
      const occurrenceId = `sch-live:${sch.id}:${iso}`;
      const warnKey = `task:ending:${occurrenceId}:${endMs}:${iso}`;
      if (!notifiedKeys.has(warnKey)) {
        notifiedKeys.add(warnKey);
        notifications.push({
          title: lang === "bn" ? `শেষ মুহূর্ত! ${sch.title}` : `Final minute! ${sch.title}`,
          body: lang === "bn"
            ? "১ মিনিটের কম বাকি — সময় শেষ হওয়ার আগে Done টিক দিন"
            : "Under 1 minute left — mark Done before timer expires",
          channel: "multical:open-live-task"
        });
      }
    }
  }

  for (const task of expiredTasks) {
    const key = `task:fail:${task.id}:${iso}`;
    if (!notifiedKeys.has(key)) {
      notifiedKeys.add(key);
      notifications.push({
        title: lang === "bn" ? `টাস্কের সময় শেষ: ${task.title}` : `Task time ended: ${task.title}`,
        body: lang === "bn"
          ? "নির্ধারিত সময়ের মধ্যে সম্পন্ন না করায় টাস্কটি Failed হয়েছে"
          : "Marked Failed because finish time elapsed without completion",
        channel: "multical:open-live-task"
      });
    }
  }

  return {
    notifications,
    nextTasks: tasksChanged ? nextTasks : tasks,
    tasksChanged
  };
}

module.exports = {
  buildWindowsGotItToastXml,
  dhakaNow,
  evaluateDesktopReminders,
  format12h,
  matchesDate,
  parseGotItProtocolUrl
};
