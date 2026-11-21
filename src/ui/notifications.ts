import type { DisplayLanguage } from "../integration/types.js";
import { agendaMatchesDate, type PersonalAgenda } from "./agendas.js";
import { format12hMinutes, scheduleMatchesDate, SCHEDULE_TICK_WINDOW_MINS, type PersonalSchedule } from "./schedules.js";
import type { LiveTask } from "./tasks.js";

export type WebReminderView = "my-agenda" | "schedule" | "live-task";

export interface WebReminderNotice {
  key: string;
  title: string;
  body: string;
  view: WebReminderView;
}

export function collectWebReminders({
  agendas,
  schedules,
  tasks,
  prevTasks = [],
  iso,
  minutes,
  nowMs,
  language,
  notifiedKeys
}: {
  agendas: PersonalAgenda[];
  schedules: PersonalSchedule[];
  tasks: LiveTask[];
  prevTasks?: LiveTask[];
  iso: string;
  minutes: number;
  nowMs: number;
  language: DisplayLanguage;
  notifiedKeys: Set<string>;
}): WebReminderNotice[] {
  const out: WebReminderNotice[] = [];

  for (const key of notifiedKeys) {
    if (!key.endsWith(`:${iso}`)) notifiedKeys.delete(key);
  }

  for (const agenda of agendas) {
    if (!agenda.reminder || !agendaMatchesDate(agenda, iso)) continue;
    const comment = agenda.comment?.trim() ?? "";

    if (agenda.isAllDay || !agenda.time) {
      const key = `ag:allday:${agenda.id}:${iso}`;
      if (!notifiedKeys.has(key) && minutes >= 8 * 60 && minutes <= 22 * 60) {
        notifiedKeys.add(key);
        out.push({
          key,
          title: language === "bn" ? `আজ আপনার এজেন্ডা: ${agenda.title}` : `Today's agenda: ${agenda.title}`,
          body: comment || (language === "bn" ? "সারা দিনের নির্ধারিত এজেন্ডা" : "Scheduled all-day agenda"),
          view: "my-agenda"
        });
      }
      continue;
    }

    if (/^\d{2}:\d{2}$/.test(agenda.time)) {
      const [hh, mm] = agenda.time.split(":").map(Number) as [number, number];
      const targetMins = hh * 60 + mm;
      const timeStr = format12hMinutes(targetMins, language);

      const preKey = `ag:pre:${agenda.id}:${iso}`;
      if (!notifiedKeys.has(preKey) && minutes >= targetMins - 2 && minutes < targetMins) {
        notifiedKeys.add(preKey);
        out.push({
          key: preKey,
          title: language === "bn" ? `২ মিনিট পর: ${agenda.title}` : `In 2 mins: ${agenda.title}`,
          body: comment ? `${timeStr} · ${comment}` : (language === "bn" ? `শুরু হবে ${timeStr}-এ` : `Starts at ${timeStr}`),
          view: "my-agenda"
        });
      }

      const nowKey = `ag:now:${agenda.id}:${iso}`;
      if (!notifiedKeys.has(nowKey) && minutes >= targetMins && minutes <= targetMins + 2) {
        notifiedKeys.add(nowKey);
        out.push({
          key: nowKey,
          title: language === "bn" ? `এখন আপনার "${agenda.title}"` : `Now: ${agenda.title}`,
          body: comment ? `${timeStr} · ${comment}` : (language === "bn" ? `নির্ধারিত সময় ${timeStr} শুরু হয়েছে` : `Scheduled for ${timeStr}`),
          view: "my-agenda"
        });
      }
    }
  }

  for (const sch of schedules) {
    if (!sch.reminder || !scheduleMatchesDate(sch, iso)) continue;
    if (sch.completedDates?.includes(iso)) continue;

    const rangeText = `${format12hMinutes(sch.startMinutes, language)} – ${format12hMinutes(sch.endMinutes, language)}`;
    const comment = sch.comment?.trim() ?? "";

    const preKey = `sch:pre:${sch.id}:${iso}`;
    if (!notifiedKeys.has(preKey) && minutes >= sch.startMinutes - 2 && minutes < sch.startMinutes) {
      notifiedKeys.add(preKey);
      out.push({
        key: preKey,
        title: language === "bn" ? `২ মিনিট পর শুরু: ${sch.title}` : `Starting in 2 mins: ${sch.title}`,
        body: comment ? `${rangeText} · ${comment}` : rangeText,
        view: "schedule"
      });
    }

    const nowKey = `sch:now:${sch.id}:${iso}`;
    const tickWindowEnd = sch.campaignId ? sch.endMinutes : Math.min(sch.endMinutes, sch.startMinutes + SCHEDULE_TICK_WINDOW_MINS);
    if (!notifiedKeys.has(nowKey) && minutes >= sch.startMinutes && minutes < tickWindowEnd) {
      notifiedKeys.add(nowKey);
      out.push({
        key: nowKey,
        title: language === "bn" ? `এখন আপনার "${sch.title}" শুরু হয়েছে` : `Now starting: ${sch.title}`,
        body: sch.campaignId
          ? (language === "bn"
              ? `${rangeText} · ক্যাম্পেইন লাইভ টাস্ক চলছে (শেষ হওয়ার আগে Done টিক দিন)`
              : `${rangeText} · Campaign live task active (mark Done before end)`)
          : (language === "bn"
              ? `${rangeText} · ১০ মিনিটের মধ্যে Got it টিক দিন`
              : `${rangeText} · Open to mark Got it within 10 mins`),
        view: sch.campaignId ? "live-task" : "schedule"
      });
    }
  }

  for (const task of tasks) {
    if (task.status === "running" && typeof task.deadlineAtMs === "number") {
      const rem = task.deadlineAtMs - nowMs;
      if (rem > 0 && rem <= 60_000) {
        const warnKey = `task:ending:${task.id}:${task.deadlineAtMs}:${iso}`;
        if (!notifiedKeys.has(warnKey)) {
          notifiedKeys.add(warnKey);
          out.push({
            key: warnKey,
            title: language === "bn" ? `শেষ মুহূর্ত! ${task.title}` : `Final minute! ${task.title}`,
            body: language === "bn"
              ? "১ মিনিটের কম বাকি — সময় শেষ হওয়ার আগে Done টিক দিন"
              : "Under 1 minute left — mark Done before timer expires",
            view: "live-task"
          });
        }
      } else if (nowMs >= task.deadlineAtMs) {
        const failKey = `task:fail:${task.id}:${iso}`;
        if (!notifiedKeys.has(failKey)) {
          notifiedKeys.add(failKey);
          out.push({
            key: failKey,
            title: language === "bn" ? `টাস্কের সময় শেষ: ${task.title}` : `Task time ended: ${task.title}`,
            body: language === "bn"
              ? "নির্ধারিত সময়ের মধ্যে সম্পন্ন না করায় টাস্কটি Failed হয়েছে"
              : "Marked Failed because finish time elapsed without completion",
            view: "live-task"
          });
        }
      }
      continue;
    }

    if (task.status === "failed" && prevTasks.some(p => p.id === task.id && p.status === "running")) {
      const failKey = `task:fail:${task.id}:${iso}`;
      if (!notifiedKeys.has(failKey)) {
        notifiedKeys.add(failKey);
        out.push({
          key: failKey,
          title: language === "bn" ? `টাস্কের সময় শেষ: ${task.title}` : `Task time ended: ${task.title}`,
          body: language === "bn"
            ? "নির্ধারিত সময়ের মধ্যে সম্পন্ন না করায় টাস্কটি Failed হয়েছে"
            : "Marked Failed because finish time elapsed without completion",
          view: "live-task"
        });
      }
    }
  }

  return out;
}

export function requestWebNotificationPermission(): void {
  if (typeof window === "undefined" || window.multiCalDesktop?.isDesktop) return;
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    void Notification.requestPermission().catch(() => {});
  }
}

export function dispatchWebNotifications(
  notices: WebReminderNotice[],
  onOpenView?: (view: WebReminderView) => void
): void {
  if (typeof window === "undefined" || window.multiCalDesktop?.isDesktop) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  for (const notice of notices) {
    const webNotice = new Notification(notice.title, { body: notice.body });
    webNotice.onclick = () => {
      try { window.focus(); } catch { /* ignore */ }
      onOpenView?.(notice.view);
    };
  }
}
