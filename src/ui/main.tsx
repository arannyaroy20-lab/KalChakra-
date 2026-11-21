import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { formatSelectedCalendarDate, getCalendarDay, getCalendarMonth, listCalendarOptions, type HinduCalendarMode, type UserCalendarDay } from "../application/calendar-service.js";
import { validateBangladeshBengaliDate, type BanglaDateValidation } from "../validation/bangla-date-today.js";
import type { CalendarId, DisplayLanguage } from "../integration/types.js";
import { copy, ENGINES, monthNames, ui, weekdays } from "./i18n.js";
import { chipClass, eventTitle, holidayLabel, holidayTier, Icon, monthSpans, numFor, shortDate, sortEvents, todayIso, type DayEvent, type IconName, type MonthSpan } from "./shared.js";
import { formatAgendaTime, getAgendaType, loadAgendas, resolveAgendaComment, resolveHeroAgendas, saveAgendas, type PersonalAgenda } from "./agendas.js";
import { MyAgendaView } from "./MyAgendaView.js";
import {
  formatScheduleRange,
  getScheduleStatus,
  getScheduleTickMinutesLeft,
  getScheduleType,
  getSegmentProgressPct,
  loadSchedules,
  resolveActiveHomeSchedule,
  resolveScheduleComment,
  saveSchedules,
  scheduleMatchesDate,
  sortSchedulesChronologically,
  toggleScheduleDone,
  type PersonalSchedule
} from "./schedules.js";
import { ScheduleView } from "./ScheduleView.js";
import {
  completeRunningTask,
  computeDailyTaskScore,
  formatCountdownMs,
  formatDeadlineClock,
  formatTaskDuration,
  getRunningLiveTask,
  getTaskType,
  loadCampaigns,
  loadTaskGoals,
  loadTasks,
  reconcileExpiredTasks,
  resolveTaskComment,
  saveCampaigns,
  saveTaskGoals,
  saveTasks,
  startLiveTask,
  syncCampaignSchedulesToTasks,
  type Campaign,
  type DailyTaskGoals,
  type LiveTask
} from "./tasks.js";
import {
  collectWebReminders,
  dispatchWebNotifications,
  requestWebNotificationPermission
} from "./notifications.js";
import { LiveTaskView } from "./LiveTaskView.js";
import "./styles.css";

const webNotifiedKeys = new Set<string>();
let prevWebTasks: LiveTask[] = [];

type View = "home" | "calendar" | "all" | "agenda" | "my-agenda" | "schedule" | "live-task";
type Theme = "light" | "dark";
type Accent = "mint" | "green" | "blue" | "clay" | "purple" | "red";
const ACCENTS: { id: Accent; color: string }[] = [{ id: "mint", color: "#17866d" }, { id: "green", color: "#1f5b4a" }, { id: "blue", color: "#2f6fb0" }, { id: "clay", color: "#c4623f" }, { id: "purple", color: "#6b4fb5" }, { id: "red", color: "#c23a3a" }];
const initialAccent = (): Accent => { try { const v = localStorage.getItem("multical-accent"); if (ACCENTS.some(a => a.id === v)) return v as Accent; } catch { /* storage unavailable */ } return "mint"; };
const initialHinduMode = (): HinduCalendarMode => { try { const v = localStorage.getItem("multical-hindu-mode"); if (v === "sanatan" || v === "iskcon") return v; } catch { /* storage unavailable */ } return "sanatan"; };
type Layers = Record<CalendarId, boolean>;
type AllDays = Partial<Record<CalendarId, UserCalendarDay[]>>;

const calendarOptions = listCalendarOptions();
const initialTheme = (): Theme => {
  try { const stored = localStorage.getItem("multical-theme"); if (stored === "light" || stored === "dark") return stored; } catch { /* storage unavailable */ }
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};
const engineShort = (id: CalendarId, language: DisplayLanguage, hinduMode: HinduCalendarMode = "sanatan") =>
  id === "iskcon-mayapur" ? (hinduMode === "sanatan" ? ui[language].modeSanatan : ui[language].modeIskcon) : ENGINES.find(e => e.id === id)!.short[language];
const engineName = (id: CalendarId, language: DisplayLanguage, hinduMode: HinduCalendarMode = "sanatan") =>
  id === "iskcon-mayapur" && hinduMode === "sanatan" ? ui[language].modeSanatan : (calendarOptions.find(c => c.id === id)?.name[language] ?? engineShort(id, language, hinduMode));

/** One strip that shows the Bangla months and the Gregorian dates they cover, so nothing needs scrolling to compare. */
function SpanBar({ spans, language, label, engine }: { spans: MonthSpan[]; language: DisplayLanguage; label?: string; engine: CalendarId }) {
  const num = numFor(language);
  if (!spans.length) return null;
  return <div className={`span-row eng-${engine}`}>
    {label && <span className="span-label">{label}</span>}
    <div className="span-bar">{spans.map((s, i) => <div key={s.key} className={`span-seg ${i % 2 ? "alt" : ""}`} style={{ flex: s.count }} title={`${s.name} ${num(s.year)} · ${shortDate(s.from, language)} – ${shortDate(s.to, language)}`}>
      <b>{s.name} {num(s.year)}</b><small>{shortDate(s.from, language)} – {shortDate(s.to, language)}</small>
    </div>)}</div>
  </div>;
}

function EventItem({ event, language }: { event: DayEvent; language: DisplayLanguage }) {
  const tier = holidayTier(event);
  return <article className={`event-item ${chipClass(event)}`}>
    <div className="event-title">{tier !== "none" && <Icon name="flag" />}{eventTitle(event, language)}</div>
    {event.engine === "bd-national" && tier !== "none" && <div className="event-meta"><span className={`holiday-tag ${tier}`}>{holidayLabel(event.value.holidayStatus, language)}</span></div>}
  </article>;
}

function PanchangTiles({ day, t }: { day: UserCalendarDay; t: typeof copy.bn }) {
  if (!day.panchang) return null;
  const items = [
    { key: "sunrise", icon: "sunrise", label: t.sunrise, value: day.panchang.sunrise.slice(11, 16) },
    { key: "sunset", icon: "sunset", label: t.sunset, value: day.panchang.sunset.slice(11, 16) },
    { key: "tithi", icon: "moon", label: t.tithi, value: day.panchang.tithi.name },
    { key: "nakshatra", icon: "star", label: t.nakshatra, value: day.panchang.nakshatra.name },
    { key: "yoga", icon: "yoga", label: t.yoga, value: day.panchang.yoga.name },
    { key: "karana", icon: "karana", label: t.karana, value: day.panchang.karana.name }
  ] as const;
  return <div className="panchang-grid">{items.map(item => <div className="panchang-tile" key={item.key}><span className="tile-icon"><Icon name={item.icon} /></span><span className="tile-label">{item.label}</span><strong>{item.value}</strong></div>)}</div>;
}

function App() {
  const [view, setViewRaw] = useState<View>("home");
  const [collapsed, setCollapsed] = useState<boolean>(() => { try { return localStorage.getItem("multical-sidebar") === "collapsed"; } catch { return false; } });
  const [drawer, setDrawer] = useState(false);
  const [nextDays, setNextDays] = useState<UserCalendarDay[]>([]);
  const [calendarId, setCalendarId] = useState<CalendarId>("bd-bengali");
  const [layers, setLayers] = useState<Layers>({ "bd-national": true, "bd-bengali": true, "india-bengali": true, "iskcon-mayapur": true });
  const [language, setLanguage] = useState<DisplayLanguage>("bn");
  const [date, setDate] = useState(todayIso());
  const [monthDays, setMonthDays] = useState<UserCalendarDay[]>([]);
  const [allDays, setAllDays] = useState<AllDays>({});
  const [allLoading, setAllLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<UserCalendarDay | null>(null);
  const [validation, setValidation] = useState<BanglaDateValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [accent, setAccent] = useState<Accent>(initialAccent);
  const [hinduMode, setHinduMode] = useState<HinduCalendarMode>(initialHinduMode);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agendas, setAgendas] = useState<PersonalAgenda[]>(loadAgendas);
  const [schedules, setSchedules] = useState<PersonalSchedule[]>(loadSchedules);
  const [tasks, setTasks] = useState<LiveTask[]>(() => reconcileExpiredTasks(loadTasks(), Date.now()));
  const [taskGoals, setTaskGoals] = useState<DailyTaskGoals>(loadTaskGoals);
  const [campaigns, setCampaigns] = useState<Campaign[]>(loadCampaigns);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [desktopReady, setDesktopReady] = useState<boolean>(() => !window.multiCalDesktop?.isDesktop);
  const [exactNowMinutes, setExactNowMinutes] = useState<number>(() => {
    const parts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "Asia/Dhaka" }).formatToParts(new Date());
    const hh = Number(parts.find(p => p.type === "hour")?.value ?? 0);
    const mm = Number(parts.find(p => p.type === "minute")?.value ?? 0);
    const ss = Number(parts.find(p => p.type === "second")?.value ?? 0);
    return hh * 60 + mm + ss / 60;
  });
  const nowMinutes = Math.floor(exactNowMinutes);
  const t = copy[language];
  const u = ui[language];
  const num = numFor(language);
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const monthLabel = `${monthNames[language][month - 1]} ${num(year)}`;
  const selectedDateLabel = selectedDay && selectedDay.nativeDateAvailable ? formatSelectedCalendarDate(selectedDay, language) : "";
  const today = todayIso();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
    try { localStorage.setItem("multical-theme", theme); } catch { /* storage unavailable */ }
  }, [theme, language]);

  // Single-calendar month (original logic, only runs in the Calendar view).
  useEffect(() => {
    if (view !== "calendar") return;
    let active = true;
    setError(null); setValidation(null);
    try {
      const result = getCalendarMonth(year, month, calendarId, language, { hinduMode });
      if (active) setMonthDays(result.days);
    } catch (e) {
      if (active) { setError(e instanceof Error ? e.message : String(e)); setMonthDays([]); setSelectedDay(null); }
    }
    return () => { active = false; };
  }, [view, year, month, calendarId, language, hinduMode]);

  useEffect(() => {
    if (view !== "calendar") return;
    const fromMonth = monthDays.find(item => item.date.gregorianDate === date);
    if (fromMonth) { setSelectedDay(fromMonth); return; }
    try { setSelectedDay(getCalendarDay(date, calendarId, language, { hinduMode })); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); setSelectedDay(null); }
  }, [view, date, calendarId, language, hinduMode, monthDays]);

  // All-engines month (All engines + Agenda + Home views): every engine's data computed locally, off the render path.
  useEffect(() => {
    if (view === "calendar" || view === "my-agenda" || view === "schedule" || view === "live-task") return;
    let active = true;
    setAllLoading(true); setError(null);
    const handle = setTimeout(() => {
      try {
        const out: AllDays = {};
        for (const option of calendarOptions) out[option.id] = getCalendarMonth(year, month, option.id, language, { hinduMode }).days;
        if (active) setAllDays(out);
      } catch (e) { if (active) { setError(e instanceof Error ? e.message : String(e)); setAllDays({}); } }
      finally { if (active) setAllLoading(false); }
    }, 0);
    return () => { active = false; clearTimeout(handle); };
  }, [view, year, month, language, hinduMode]);

  useEffect(() => {
    if (view !== "calendar" || calendarId !== "bd-bengali") { setValidation(null); return; }
    let active = true;
    validateBangladeshBengaliDate(date).then(result => { if (active) setValidation(result); });
    return () => { active = false; };
  }, [view, calendarId, date]);

  useEffect(() => { document.documentElement.dataset.accent = accent; try { localStorage.setItem("multical-accent", accent); } catch { /* storage unavailable */ } }, [accent]);
  useEffect(() => { try { localStorage.setItem("multical-hindu-mode", hinduMode); } catch { /* storage unavailable */ } }, [hinduMode]);
  useEffect(() => { try { localStorage.setItem("multical-sidebar", collapsed ? "collapsed" : "open"); } catch { /* storage unavailable */ } }, [collapsed]);
  useEffect(() => {
    const desktop = window.multiCalDesktop;
    if (!desktop?.isDesktop) return;
    let active = true;
    Promise.all([
      desktop.loadAgendas(),
      desktop.loadSchedules ? desktop.loadSchedules() : Promise.resolve([]),
      desktop.loadTasks ? desktop.loadTasks() : Promise.resolve({ tasks: [] as unknown[], goals: {} as DailyTaskGoals, campaigns: [] as unknown[] })
    ]).then(([diskAgendas, diskSchedules, diskTasks]) => {
      if (!active) return;
      if (Array.isArray(diskAgendas) && diskAgendas.length > 0) {
        setAgendas(diskAgendas);
      } else {
        const local = loadAgendas();
        if (local.length > 0) void desktop.saveAgendas(local);
      }
      if (Array.isArray(diskSchedules) && diskSchedules.length > 0) {
        setSchedules(diskSchedules as PersonalSchedule[]);
      } else {
        const localSch = loadSchedules();
        if (localSch.length > 0) void desktop.saveSchedules?.(localSch);
      }
      const diskTaskList = Array.isArray(diskTasks?.tasks) ? (diskTasks.tasks as LiveTask[]) : [];
      const diskGoalMap: DailyTaskGoals = diskTasks?.goals && typeof diskTasks.goals === "object" ? diskTasks.goals : {};
      const diskCampaigns = Array.isArray(diskTasks?.campaigns) ? (diskTasks.campaigns as Campaign[]) : [];
      if (diskTaskList.length > 0 || Object.keys(diskGoalMap).length > 0 || diskCampaigns.length > 0) {
        setTasks(reconcileExpiredTasks(diskTaskList, Date.now()));
        setTaskGoals(diskGoalMap);
        setCampaigns(diskCampaigns);
      } else {
        const localTasks = loadTasks();
        const localGoals = loadTaskGoals();
        const localCampaigns = loadCampaigns();
        if (localTasks.length > 0 || Object.keys(localGoals).length > 0 || localCampaigns.length > 0) {
          void desktop.saveTasks?.({ tasks: localTasks, goals: localGoals, campaigns: localCampaigns });
        }
      }
      setDesktopReady(true);
    }).catch(() => {
      if (active) setDesktopReady(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    saveAgendas(agendas);
    if (desktopReady && window.multiCalDesktop?.isDesktop) {
      void window.multiCalDesktop.saveAgendas(agendas);
    }
  }, [agendas, desktopReady]);
  useEffect(() => {
    saveSchedules(schedules);
    if (desktopReady && window.multiCalDesktop?.isDesktop) {
      void window.multiCalDesktop.saveSchedules?.(schedules);
    }
  }, [schedules, desktopReady]);
  useEffect(() => {
    saveTasks(tasks);
    saveTaskGoals(taskGoals);
    saveCampaigns(campaigns);
    if (desktopReady && window.multiCalDesktop?.isDesktop) {
      void window.multiCalDesktop.saveTasks?.({ tasks, goals: taskGoals, campaigns });
    }
  }, [tasks, taskGoals, campaigns, desktopReady]);
  useEffect(() => {
    window.multiCalDesktop?.setLanguage(language);
  }, [language]);
  useEffect(() => {
    const unsubAgenda = window.multiCalDesktop?.onOpenMyAgenda(() => {
      setViewRaw("my-agenda");
      setDrawer(false);
    });
    const unsubSchedule = window.multiCalDesktop?.onOpenSchedule?.(() => {
      setViewRaw("schedule");
      setDrawer(false);
    });
    const unsubLiveTask = window.multiCalDesktop?.onOpenLiveTask?.(() => {
      setViewRaw("live-task");
      setDrawer(false);
    });
    const unsubSchSync = window.multiCalDesktop?.onSchedulesUpdated?.(list => {
      if (Array.isArray(list)) setSchedules(list as PersonalSchedule[]);
    });
    const unsubTaskSync = window.multiCalDesktop?.onTasksUpdated?.(payload => {
      if (payload && Array.isArray(payload.tasks)) {
        setTasks(reconcileExpiredTasks(payload.tasks as LiveTask[], Date.now()));
      }
      if (payload?.goals && typeof payload.goals === "object") {
        setTaskGoals(payload.goals);
      }
      if (Array.isArray(payload?.campaigns)) {
        setCampaigns(payload.campaigns as Campaign[]);
      }
    });
    return () => {
      unsubAgenda?.();
      unsubSchedule?.();
      unsubLiveTask?.();
      unsubSchSync?.();
      unsubTaskSync?.();
    };
  }, []);
  useEffect(() => {
    const tick = () => {
      const parts = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "Asia/Dhaka" }).formatToParts(new Date());
      const hh = Number(parts.find(p => p.type === "hour")?.value ?? 0);
      const mm = Number(parts.find(p => p.type === "minute")?.value ?? 0);
      const ss = Number(parts.find(p => p.type === "second")?.value ?? 0);
      setExactNowMinutes(hh * 60 + mm + ss / 60);
    };
    const id = setInterval(tick, 5_000);
    return () => clearInterval(id);
  }, []);
  const hasRunningTask = tasks.some(item => item.status === "running");
  const hasLinkedScheduleToday = schedules.some(
    s => Boolean(s.campaignId) && scheduleMatchesDate(s, today)
  );
  useEffect(() => {
    setTasks(prev => syncCampaignSchedulesToTasks(prev, schedules, today, Date.now()));
  }, [schedules, today]);
  useEffect(() => {
    if (!hasRunningTask && !hasLinkedScheduleToday) return;
    setNowMs(Date.now());
    const intervalMs = hasRunningTask ? 1_000 : 5_000;
    const id = setInterval(() => {
      const now = Date.now();
      setNowMs(now);
      setTasks(prev => {
        const reconciled = reconcileExpiredTasks(prev, now);
        return syncCampaignSchedulesToTasks(reconciled, schedules, today, now);
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [hasRunningTask, hasLinkedScheduleToday, schedules, today]);
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSettingsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  // Home: events of the following month (National + Sanatan/ISKCON) for the "Coming up" list.
  useEffect(() => {
    if (view !== "home") return;
    let active = true;
    const handle = setTimeout(() => {
      try {
        const next = new Date(Date.UTC(year, month, 1));
        const y = next.getUTCFullYear(); const m = next.getUTCMonth() + 1;
        const days = (["bd-national", "iskcon-mayapur"] as const).flatMap(id => getCalendarMonth(y, m, id, language, { hinduMode }).days);
        if (active) setNextDays(days);
      } catch { if (active) setNextDays([]); }
    }, 0);
    return () => { active = false; clearTimeout(handle); };
  }, [view, year, month, language, hinduMode]);

  const grid = useMemo(() => [...Array(firstWeekday).fill(null), ...monthDays], [firstWeekday, monthDays]);
  const allGrid = useMemo(() => [...Array(firstWeekday).fill(null), ...Array.from({ length: new Date(Date.UTC(year, month, 0)).getUTCDate() }, (_, i) => i + 1)], [firstWeekday, year, month]);
  const setView = (v: View) => { setViewRaw(v); setDrawer(false); if (v === "home") setDate(todayIso()); };
  const moveDay = (amount: number) => { const d = new Date(`${date}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate() + amount); setDate(d.toISOString().slice(0, 10)); };
  const moveMonth = (amount: number) => { const d = new Date(Date.UTC(year, month - 1 + amount, 1)); setDate(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`); };
  const doValidate = async () => { setValidating(true); try { setValidation(await validateBangladeshBengaliDate(date, { forceRefresh: true })); } finally { setValidating(false); } };
  const iso = (n: number) => `${year}-${String(month).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
  const allDay = (id: CalendarId, n: number): UserCalendarDay | undefined => { const d = allDays[id]?.[n - 1]; return d && d.date.gregorianDate === iso(n) ? d : undefined; };

  const onGridKey = (e: { key: string; preventDefault: () => void }) => {
    const step: Record<string, () => void> = { ArrowLeft: () => moveDay(-1), ArrowRight: () => moveDay(1), ArrowUp: () => moveDay(-7), ArrowDown: () => moveDay(7), PageUp: () => moveMonth(-1), PageDown: () => moveMonth(1) };
    const action = step[e.key];
    if (action) { e.preventDefault(); action(); }
  };

  const calendarName = selectedDay?.calendarName[language] ?? engineName(calendarId, language, hinduMode);
  const isNativeCalendar = calendarId === "bd-bengali" || calendarId === "india-bengali";
  const spans = useMemo(() => view === "calendar" && isNativeCalendar ? monthSpans(monthDays, language) : [], [view, isNativeCalendar, monthDays, language]);
  const allSpans = useMemo(() => ({
    "bd-bengali": monthSpans(allDays["bd-bengali"] ?? [], language),
    "india-bengali": monthSpans(allDays["india-bengali"] ?? [], language)
  }), [allDays, language]);
  const validationTone = validation?.status === "matched" ? "good" : validation?.status === "mismatch" ? "bad" : "muted";
  const monthEvents = useMemo(() => monthDays.flatMap(d => d.events.map(e => ({ iso: d.date.gregorianDate, day: d.gregorian.day, e }))), [monthDays]);

  /** Events of one day across the visible event layers, holidays first. */
  const allEventsOf = (n: number): DayEvent[] => {
    const list: DayEvent[] = [];
    if (layers["bd-national"]) list.push(...(allDay("bd-national", n)?.events ?? []));
    if (layers["iskcon-mayapur"]) list.push(...(allDay("iskcon-mayapur", n)?.events ?? []));
    return sortEvents(list);
  };
  const nativeLabel = (d: UserCalendarDay | undefined) => {
    if (!d || !d.nativeDateAvailable || d.date.calendarDay === undefined) return null;
    const first = d.date.calendarDay === 1;
    return first && d.date.calendarMonthName ? `${num(1)} ${d.date.calendarMonthName[language]}` : num(d.date.calendarDay);
  };

  const gregorianHero = (d: UserCalendarDay | undefined) => d ? <div className="hero-row">
    <div className="hero-number">{num(day)}</div>
    <div className="hero-text">
      <div className="weekday-label">{d.gregorian.weekday[language]}{date === today && <span className="today-pill">{u.todayTag}</span>}</div>
      <div className="gregorian-date">{d.gregorian.formatted[language]}</div>
    </div>
  </div> : null;
  const dayNav = <div className="nav-pair">
    <button className="icon-button small" onClick={() => moveDay(-1)} title={t.prev} aria-label={t.prev}><Icon name="left" /></button>
    <button className="icon-button small" onClick={() => moveDay(1)} title={t.next} aria-label={t.next}><Icon name="right" /></button>
  </div>;

  const heroDay = view === "calendar" ? selectedDay ?? undefined : (ENGINES.map(e => allDay(e.id, day)).find(Boolean));
  const titles: Record<View, string> = { home: u.home, calendar: u.viewCalendar, all: u.viewAll, agenda: u.viewAgenda, "my-agenda": u.myAgenda, schedule: u.mySchedule, "live-task": u.liveTask };
  const hour = Math.floor(nowMinutes / 60);
  const timeGreeting: { icon: IconName; title: string; note: string; subMeta?: string; hasReminder?: boolean; isDone?: boolean } =
    hour >= 5 && hour < 12 ? { icon: "sunrise", title: u.gMorning, note: u.cMorning }
    : hour >= 12 && hour < 16 ? { icon: "sun", title: u.gNoon, note: u.cNoon }
    : hour >= 16 && hour < 18 ? { icon: "afternoon", title: u.gAfternoon, note: u.cAfternoon }
    : hour >= 18 && hour < 20 ? { icon: "sunset", title: u.gEvening, note: u.cEvening }
    : { icon: "night", title: u.gNight, note: u.cNight };
  const todaySchedules = useMemo(
    () => sortSchedulesChronologically(schedules.filter(item => scheduleMatchesDate(item, today))),
    [schedules, today]
  );
  const activeHomeSchedule = useMemo(
    () => resolveActiveHomeSchedule(schedules, today, nowMinutes),
    [schedules, today, nowMinutes]
  );
  const heroAgenda = useMemo(() => resolveHeroAgendas(agendas, today, nowMinutes), [agendas, today, nowMinutes]);
  const homeAgendas = useMemo(() => {
    if (activeHomeSchedule) {
      return heroAgenda.main ? [heroAgenda.main, ...heroAgenda.remaining] : heroAgenda.remaining;
    }
    return heroAgenda.remaining;
  }, [activeHomeSchedule, heroAgenda]);
  const activeLiveTask = useMemo(() => getRunningLiveTask(tasks, nowMs), [tasks, nowMs]);
  const activeLiveCampaign = activeLiveTask?.campaignId
    ? campaigns.find(c => c.id === activeLiveTask.campaignId) ?? null
    : null;
  const todayTaskScore = useMemo(() => computeDailyTaskScore(tasks, taskGoals, today), [tasks, taskGoals, today]);
  useEffect(() => {
    if (window.multiCalDesktop?.isDesktop) {
      prevWebTasks = tasks;
      return;
    }
    const notices = collectWebReminders({
      agendas,
      schedules,
      tasks,
      prevTasks: prevWebTasks,
      iso: today,
      minutes: nowMinutes,
      nowMs,
      language,
      notifiedKeys: webNotifiedKeys
    });
    prevWebTasks = tasks;
    if (notices.length > 0) {
      dispatchWebNotifications(notices, targetView => setViewRaw(targetView));
    }
  }, [agendas, schedules, tasks, today, nowMinutes, nowMs, language]);
  const handleStartLiveTask = (taskId: string) => {
    const now = Date.now();
    setNowMs(now);
    setTasks(prev => startLiveTask(prev, taskId, today, now));
    requestWebNotificationPermission();
  };
  const handleCompleteLiveTask = (taskId: string) => {
    const now = Date.now();
    setNowMs(now);
    const target = tasks.find(t => t.id === taskId);
    setTasks(prev => completeRunningTask(prev, taskId, now));
    if (target?.sourceScheduleId) {
      setSchedules(prev => toggleScheduleDone(prev, target.sourceScheduleId!, target.date));
    }
  };
  const handleMarkScheduleDone = (scheduleId: string, targetIso: string) => {
    const now = Date.now();
    setSchedules(prev => toggleScheduleDone(prev, scheduleId, targetIso));
    const occurrenceId = `sch-live:${scheduleId}:${targetIso}`;
    setTasks(prev => completeRunningTask(prev, occurrenceId, now));
  };
  const handleDetachScheduleCampaign = (scheduleId: string) => {
    setSchedules(prev => prev.map(s => {
      if (s.id !== scheduleId) return s;
      const rest = { ...s };
      delete rest.campaignId;
      return rest;
    }));
  };
  const greeting: { icon: IconName; title: string; note: string; subMeta?: string; hasReminder?: boolean; isDone?: boolean } = activeHomeSchedule
    ? {
        icon: getScheduleType(activeHomeSchedule.type).icon,
        title: activeHomeSchedule.title,
        note: resolveScheduleComment(activeHomeSchedule, language),
        subMeta: formatScheduleRange(activeHomeSchedule.startMinutes, activeHomeSchedule.endMinutes, language),
        hasReminder: activeHomeSchedule.reminder,
        isDone: Boolean(activeHomeSchedule.completedDates?.includes(today))
      }
    : heroAgenda.main
      ? {
          icon: getAgendaType(heroAgenda.main.type).icon,
          title: heroAgenda.main.title,
          note: resolveAgendaComment(heroAgenda.main, language),
          ...(!heroAgenda.main.isAllDay ? { subMeta: formatAgendaTime(heroAgenda.main, language) } : {}),
          hasReminder: heroAgenda.main.reminder
        }
      : timeGreeting;
  const navItems: { id: View; label: string; icon: IconName }[] = [
    { id: "home", label: u.home, icon: "home" },
    { id: "calendar", label: u.viewCalendar, icon: "cal" },
    { id: "all", label: u.viewAll, icon: "layers" },
    { id: "agenda", label: u.viewAgenda, icon: "list" },
    { id: "my-agenda", label: u.myAgenda, icon: "agendaBook" },
    { id: "schedule", label: u.mySchedule, icon: "clock" },
    { id: "live-task", label: u.liveTask, icon: "target" }
  ];
  const pickCalendar = (id: CalendarId) => { setCalendarId(id); setViewRaw("calendar"); setDrawer(false); };

  // Home data
  const homeEvents = sortEvents([...(allDay("bd-national", day)?.events ?? []), ...(allDay("iskcon-mayapur", day)?.events ?? [])]);
  const homePanchang = allDay("india-bengali", day)?.panchang ? allDay("india-bengali", day) : allDay("iskcon-mayapur", day);
  const upcoming = useMemo(() => {
    const pool = [...(allDays["bd-national"] ?? []), ...(allDays["iskcon-mayapur"] ?? []), ...nextDays];
    return pool.flatMap(d => d.events.map(e => ({ iso: d.date.gregorianDate, e }))).filter(x => x.iso > today).sort((a, b) => a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0)
      .filter((x, i, arr) => arr.findIndex(y => y.iso === x.iso && eventTitle(y.e, language) === eventTitle(x.e, language)) === i).slice(0, 7);
  }, [allDays, nextDays, today, language]);
  const daysAway = (isoDate: string) => { const n = Math.round((Date.parse(isoDate) - Date.parse(today)) / 86_400_000); return n === 1 ? u.tomorrow : `${num(n)} ${u.inDays}`; };

  const switcher = view === "calendar"
    ? <div className="mini-seg" role="tablist" aria-label={t.system}>{calendarOptions.map(c => <button key={c.id} role="tab" aria-selected={c.id === calendarId} className={`${c.id === calendarId ? "active" : ""} eng-${c.id}`} onClick={() => setCalendarId(c.id as CalendarId)}><i className="eng-dot" />{engineShort(c.id as CalendarId, language, hinduMode)}</button>)}</div>
    : view === "all" || view === "agenda"
      ? <div className="mini-seg" role="group" aria-label={u.layers}>{ENGINES.map(e => <button key={e.id} className={`${layers[e.id] ? "active" : "off"} eng-${e.id}`} aria-pressed={layers[e.id]} onClick={() => setLayers({ ...layers, [e.id]: !layers[e.id] })}><i className="eng-dot" />{engineShort(e.id, language, hinduMode)}</button>)}</div>
      : null;

  return <div className={`app-shell ${collapsed ? "collapsed" : ""} ${drawer ? "drawer-open" : ""}`}>
    <aside className="sidebar" aria-label={u.navigate}>
      <div className="side-head">
        <div className="brand"><div className="brand-mark"><Icon name="cal" /></div><div className="brand-text"><div className="brand-name">{t.app}</div></div></div>
        <button className="side-toggle" onClick={() => setCollapsed(!collapsed)} title={u.collapse} aria-label={u.collapse}><Icon name="sidebar" /></button>
        <button className="side-close" onClick={() => setDrawer(false)} aria-label="Close"><Icon name="close" /></button>
      </div>
      <nav className="side-nav">
        {navItems.map(n => <button key={n.id} className={`side-item ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)} title={n.label}><Icon name={n.icon} /><span>{n.label}</span></button>)}
        <div className="side-section"><span>{u.calendars}</span></div>
        {calendarOptions.map(c => <button key={c.id} className={`side-item sub eng-${c.id} ${view === "calendar" && calendarId === c.id ? "active" : ""}`} onClick={() => pickCalendar(c.id as CalendarId)} title={engineName(c.id as CalendarId, language, hinduMode)}><i className="eng-dot" /><span>{engineShort(c.id as CalendarId, language, hinduMode)}</span></button>)}
      </nav>
      <div className="side-foot">
        <a className="side-link" href="https://www.bangladatetoday.com/bangla-date-api" target="_blank" rel="noreferrer">BanglaDateToday <Icon name="external" /></a>
      </div>
    </aside>
    <div className="scrim" onClick={() => setDrawer(false)} />

    <div className="content">
      <header className="topbar">
        <button className="menu-button" onClick={() => setDrawer(true)} aria-label={u.navigate}><Icon name="menu" /></button>
        <h2 className="page-title">{titles[view]}</h2>
        <div className="top-spacer" />
        {switcher}
        <div className="top-actions">
          <div className="mini-seg lang" role="group" aria-label={t.language}>
            <button className={language === "bn" ? "active" : ""} aria-pressed={language === "bn"} onClick={() => setLanguage("bn")}>বাং</button>
            <button className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
          </div>
          <button className="icon-button small" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={u.theme} aria-label={u.theme}><Icon name={theme === "dark" ? "sun" : "moonTheme"} /></button>
          <div className="settings-anchor">
            <button className={`icon-button small ${settingsOpen ? "active" : ""}`} onClick={() => setSettingsOpen(v => !v)} title={u.settings} aria-label={u.settings} aria-expanded={settingsOpen} aria-haspopup="dialog"><Icon name="settings" /></button>
            {settingsOpen && <>
              <div className="settings-backdrop" onClick={() => setSettingsOpen(false)} />
              <div className="settings-panel" role="dialog" aria-label={u.settings}>
                <div className="settings-head">
                  <h3>{u.settings}</h3>
                  <button className="icon-button small" onClick={() => setSettingsOpen(false)} aria-label={u.close}><Icon name="close" /></button>
                </div>
                <div className="settings-group">
                  <span className="settings-label">{t.language}</span>
                  <div className="mini-seg full" role="group" aria-label={t.language}>
                    <button className={language === "bn" ? "active" : ""} aria-pressed={language === "bn"} onClick={() => setLanguage("bn")}>বাংলা</button>
                    <button className={language === "en" ? "active" : ""} aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
                  </div>
                </div>
                <div className="settings-group">
                  <span className="settings-label">{u.themeMode}</span>
                  <div className="mini-seg full" role="group" aria-label={u.themeMode}>
                    <button className={theme === "light" ? "active" : ""} aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Icon name="sun" />{u.light}</button>
                    <button className={theme === "dark" ? "active" : ""} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Icon name="moonTheme" />{u.dark}</button>
                  </div>
                </div>
                <div className="settings-group">
                  <span className="settings-label">{u.hinduMode}</span>
                  <div className="mini-seg full" role="group" aria-label={u.hinduMode}>
                    <button className={hinduMode === "sanatan" ? "active" : ""} aria-pressed={hinduMode === "sanatan"} onClick={() => setHinduMode("sanatan")}>{u.modeSanatan}</button>
                    <button className={hinduMode === "iskcon" ? "active" : ""} aria-pressed={hinduMode === "iskcon"} onClick={() => setHinduMode("iskcon")}>{u.modeIskcon}</button>
                  </div>
                </div>
                <div className="settings-group">
                  <span className="settings-label">{u.accent}</span>
                  <div className="swatches settings-swatches" role="group" aria-label={u.accent}>
                    {ACCENTS.map(a => <button key={a.id} className={`swatch-chip ${accent === a.id ? "active" : ""}`} style={{ "--sw": a.color }} aria-pressed={accent === a.id} onClick={() => setAccent(a.id)}><i className="swatch-dot" /><span>{u.accents[a.id]}</span></button>)}
                  </div>
                </div>
              </div>
            </>}
          </div>
        </div>
      </header>

      {view === "home" && <main className="home">
        {activeLiveTask && activeLiveTask.deadlineAtMs ? (() => {
          const remainingMs = Math.max(0, activeLiveTask.deadlineAtMs - nowMs);
          const totalMs = activeLiveTask.durationMinutes * 60_000;
          const progressPct = Math.max(0, Math.min(100, ((totalMs - remainingMs) / totalMs) * 100));
          const typeMeta = getTaskType(activeLiveTask.type);
          return <section className="home-hero is-live-task" aria-live="polite">
            <div className="hero-live-grid">
              <div className="hero-live-info">
                <div className="hero-live-kicker">
                  <span className="agenda-type-icon"><Icon name={typeMeta.icon} /></span>
                  <span>
                    {activeLiveCampaign ? `${activeLiveCampaign.title} · ` : ""}
                    {u.liveRunningTitle} · {formatTaskDuration(activeLiveTask.durationMinutes, language)} · {u.liveEndsAt} {formatDeadlineClock(activeLiveTask.deadlineAtMs, language)}
                  </span>
                </div>
                <h1 className="hero-live-title">{activeLiveTask.title}</h1>
                <p className="hero-live-note">{resolveTaskComment(activeLiveTask, language)}</p>
              </div>
              <div className="hero-live-clock-col">
                <div className="hero-live-countdown">{formatCountdownMs(remainingMs, language)}</div>
                <div className="live-progress-track" aria-hidden="true">
                  <div className="live-progress-fill" style={{ width: `${progressPct.toFixed(1)}%` }} />
                </div>
              </div>
            </div>
            <div className="hero-actions">
              <button type="button" className="got-it-button" onClick={() => handleCompleteLiveTask(activeLiveTask.id)}>
                <Icon name="check" />
                <span>{u.markDoneBtn}</span>
              </button>
              <button type="button" className="ghost-button" onClick={() => setView("live-task")}>
                <Icon name="target" />
                <span>{u.openTasksBtn}</span>
              </button>
            </div>
          </section>;
        })() : (
          <section className="home-hero">
            <div className="hero-top">
              <div className="hero-main">
                {heroDay ? <>
                  <h1 className="hero-date"><span className="hero-day">{num(day)}</span><span className="hero-rest"><b>{heroDay.gregorian.weekday[language]}</b>{monthNames[language][month - 1]} {num(year)}</span></h1>
                  <div className="hero-dates">
                    {(["bd-bengali", "india-bengali"] as const).map(id => { const d = allDay(id, day); return d && d.nativeDateAvailable ? <div key={id} className={`date-chip eng-${id}`} title={engineShort(id, language, hinduMode)}><i className="eng-dot" /><strong>{formatSelectedCalendarDate(d, language)}</strong></div> : null; })}
                  </div>
                </> : <div className="loading-bar" role="status"><span />{u.calculating}</div>}
              </div>
              <div className="hero-greeting">
                <span className="greet-icon" aria-hidden="true"><Icon name={greeting.icon} /></span>
                <strong className="greet-title">{greeting.title}</strong>
                <span className="greet-note">
                  {greeting.isDone && <span className="greet-done-tick" aria-label={u.statusDone}><Icon name="checkCircle" /></span>}
                  {greeting.hasReminder && <span className="greet-bell" aria-label={u.agendaReminder}><Icon name="bell" /></span>}
                  {greeting.subMeta && <em className="greet-time">{greeting.subMeta} · </em>}
                  {greeting.note}
                </span>
              </div>
            </div>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => setView("calendar")}><Icon name="cal" />{u.openCalendar}</button>
              <button className="ghost-button" onClick={() => setView("all")}><Icon name="layers" />{u.seeAll}</button>
            </div>
          </section>
        )}
        {todayTaskScore.totalCount > 0 && (() => {
          const scoreTone = todayTaskScore.scorePct >= 100 ? "good" : todayTaskScore.scorePct >= 50 ? "mid" : "low";
          return <section className="info-card home-score-card">
            <div className="score-focus-col">
              <strong className={`home-big-score ${scoreTone}`}>{num(todayTaskScore.scorePct)}%</strong>
              <span className="score-focus-label">{u.todayScoreTitle}</span>
            </div>
            <div className="score-meter-col">
              <div className="score-stat-line">
                <span>{u.doneCountLabel}: <strong>{num(todayTaskScore.doneCount)}/{num(todayTaskScore.goal)}</strong></span>
                <span>{u.upcomingCountLabel}: <strong>{num(todayTaskScore.pendingCount)}</strong></span>
                <span className="is-failed">{u.failedCountLabel}: <strong>{num(todayTaskScore.failedCount)}</strong></span>
              </div>
              <div className="task-score-bar-track home-score-bar" aria-hidden="true">
                <div className={`task-score-bar-fill ${scoreTone}`} style={{ width: `${todayTaskScore.scorePct}%` }} />
              </div>
            </div>
          </section>;
        })()}
        {todaySchedules.length > 0 && <section className="info-card home-schedules">
          <div className="section-heading">
            <h2>{u.todaySchedulesTitle}</h2>
            <span className="count-badge">{num(todaySchedules.filter(s => s.completedDates?.includes(today)).length)}/{num(todaySchedules.length)}</span>
          </div>
          <p className="schedule-rule-note">{u.tickWindowHint}</p>
          <div className="schedule-timeline compact">
            {todaySchedules.map((item, idx) => {
              const typeMeta = getScheduleType(item.type);
              const status = getScheduleStatus(item, today, today, nowMinutes);
              const showRail = todaySchedules.length > 1;
              const nextItem = todaySchedules[idx + 1];
              const hasNext = showRail && Boolean(nextItem);
              const progressPct = nextItem
                ? getSegmentProgressPct(item.startMinutes, nextItem.startMinutes, exactNowMinutes)
                : 0;
              const minutesLeft = status === "active" ? getScheduleTickMinutesLeft(item, nowMinutes) : 0;
              return <div key={item.id} className={`schedule-row status-${status}`}>
                {showRail && <div className="timeline-rail" aria-hidden="true">
                  <span className={`timeline-node ${status}`}>
                    {status === "done" && <Icon name="check" />}
                  </span>
                  {hasNext && <span className="timeline-track">
                    <span className={`timeline-fill ${status}`} style={{ height: `${progressPct.toFixed(1)}%` }} />
                    {progressPct > 0 && progressPct < 100 && <span className="timeline-cursor" style={{ top: `${progressPct.toFixed(1)}%` }} />}
                  </span>}
                </div>}
                <div className="schedule-card-row">
                  <span className="agenda-type-icon"><Icon name={typeMeta.icon} /></span>
                  <button type="button" className="home-schedule-main" onClick={() => { setDate(today); setViewRaw("schedule"); }}>
                    <span className="agenda-item-head">
                      <strong>{item.title}</strong>
                      <span className={`schedule-status-text ${status}`}>
                        {status === "active" ? u.statusActive
                          : status === "done" ? u.statusDone
                          : status === "passed" ? u.statusPassed
                          : u.statusUpcoming}
                      </span>
                    </span>
                    <small>{formatScheduleRange(item.startMinutes, item.endMinutes, language)} · {resolveScheduleComment(item, language)}</small>
                  </button>
                  <div className="schedule-row-right">
                    {status === "active" && <div className="schedule-tick-wrap">
                      <button type="button" className="got-it-button" onClick={() => handleMarkScheduleDone(item.id, today)}>
                        <Icon name="check" /><span>{u.gotItBtn}</span>
                      </button>
                      <span className="tick-window-label">{num(minutesLeft)} {u.minsLeftTag}</span>
                    </div>}
                    {status === "done" && <span className="big-green-tick" aria-label={u.statusDone}><Icon name="checkCircle" /></span>}
                  </div>
                </div>
              </div>;
            })}
          </div>
        </section>}
        {homeAgendas.length > 0 && <section className="info-card home-agendas">
          <div className="section-heading">
            <h2>{activeHomeSchedule ? u.todayAgendasTitle : u.moreTodayAgendas}</h2>
            <span className="count-badge">{num(homeAgendas.length)}</span>
          </div>
          <div className="home-agenda-list">
            {homeAgendas.map(item => {
              const typeMeta = getAgendaType(item.type);
              return <button key={item.id} className="home-agenda-row" onClick={() => { setDate(today); setViewRaw("my-agenda"); }}>
                <span className="agenda-type-icon"><Icon name={typeMeta.icon} /></span>
                <span className="home-agenda-text">
                  <strong>{item.title}</strong>
                  <small>{formatAgendaTime(item, language)} · {resolveAgendaComment(item, language)}</small>
                </span>
                {item.reminder && <span className="reminder-tag" aria-label={u.agendaReminder}><Icon name="bell" /></span>}
              </button>;
            })}
          </div>
        </section>}
        <section className="info-card home-events">
          <div className="section-heading"><h2>{u.todayEvents}</h2><span className="count-badge">{num(homeEvents.length)}</span></div>
          {homeEvents.length ? <div className="event-list">{homeEvents.map((event, i) => <EventItem key={i} event={event} language={language} />)}</div> : <p className="empty-state"><Icon name="sparkle" />{u.noToday}</p>}
        </section>
        {homePanchang?.panchang && <section className="info-card home-panchang">
          <div className="section-heading"><h2>{u.panchangShort}</h2></div>
          <PanchangTiles day={homePanchang} t={t} />
        </section>}
        <section className="info-card home-upcoming">
          <div className="section-heading"><h2>{u.upcoming}</h2></div>
          {upcoming.length ? <div className="month-list">{upcoming.map((m, i) => <button key={i} className={`month-item up ${chipClass(m.e)}`} onClick={() => { setDate(m.iso); setViewRaw("all"); }}><b>{num(Number(m.iso.slice(8)))}<small>{shortDate(m.iso, language).replace(/[0-9০-৯]+\s?/, "")}</small></b><span>{eventTitle(m.e, language)}</span><em>{daysAway(m.iso)}</em></button>)}</div> : <p className="empty-message">{allLoading ? u.calculating : u.nothingUpcoming}</p>}
        </section>
        {error && <div className="error-banner" role="alert"><Icon name="alert" /><span>{error}</span></div>}
      </main>}

      {view === "my-agenda" && <MyAgendaView agendas={agendas} onChange={setAgendas} date={date} onSelectDate={setDate} language={language} />}

      {view === "schedule" && <ScheduleView
        schedules={schedules}
        campaigns={campaigns}
        onChange={setSchedules}
        onMarkDone={handleMarkScheduleDone}
        date={date}
        onSelectDate={setDate}
        exactNowMinutes={exactNowMinutes}
        language={language}
      />}

      {view === "live-task" && <LiveTaskView
        tasks={tasks}
        goals={taskGoals}
        campaigns={campaigns}
        schedules={schedules}
        onChangeTasks={setTasks}
        onChangeGoals={setTaskGoals}
        onChangeCampaigns={setCampaigns}
        onDetachScheduleCampaign={handleDetachScheduleCampaign}
        onStartTask={handleStartLiveTask}
        onCompleteTask={handleCompleteLiveTask}
        date={date}
        onSelectDate={setDate}
        nowMs={nowMs}
        exactNowMinutes={exactNowMinutes}
        language={language}
      />}

      {view !== "home" && view !== "my-agenda" && view !== "schedule" && view !== "live-task" && <main className="main-layout">
        <section className="primary-column">
          <div className="calendar-card">
            <div className="calendar-heading">
              <div className="heading-text">
                <h1>{monthLabel}</h1>
                {view === "calendar" && <span className="calendar-tag">{calendarName}</span>}
              </div>
              <div className="date-toolbar">
                <input aria-label={t.chooseDate} type="date" value={date} onChange={(e: { target: { value: string } }) => e.target.value && setDate(e.target.value)} />
                <button className="today-button" onClick={() => setDate(todayIso())}>{t.today}</button>
                <div className="nav-pair">
                  <button className="icon-button" onClick={() => moveMonth(-1)} title={u.prevMonth} aria-label={u.prevMonth}><Icon name="left" /></button>
                  <button className="icon-button" onClick={() => moveMonth(1)} title={u.nextMonth} aria-label={u.nextMonth}><Icon name="right" /></button>
                </div>
              </div>
            </div>

            {view === "calendar" && spans.length > 0 && <SpanBar spans={spans} language={language} engine={calendarId} />}
            {view !== "calendar" && <div className="span-stack">
              {layers["bd-bengali"] && <SpanBar spans={allSpans["bd-bengali"]} language={language} label={engineShort("bd-bengali", language, hinduMode)} engine="bd-bengali" />}
              {layers["india-bengali"] && <SpanBar spans={allSpans["india-bengali"]} language={language} label={engineShort("india-bengali", language, hinduMode)} engine="india-bengali" />}
            </div>}

            {view === "calendar" && <div className="month-grid" role="grid" aria-label={monthLabel} onKeyDown={onGridKey}>
              {weekdays[language].map((w, i) => <div className={`weekday ${i === 5 ? "weekend" : ""}`} key={w}>{w}</div>)}
              {grid.map((item, i) => {
                if (!item) return <div className="day-cell empty" key={`empty-${i}`} />;
                const dIso = item.date.gregorianDate;
                const events = sortEvents(item.events);
                const tier = events.some(e => holidayTier(e) === "strong") ? "holiday" : events.some(e => holidayTier(e) === "soft") ? "holiday-soft" : "";
                const first = events[0];
                const native = nativeLabel(item);
                const monthStart = item.date.calendarDay === 1;
                return <button key={dIso} role="gridcell" aria-selected={dIso === date} aria-label={`${item.gregorian.formatted[language]}${events.length ? `, ${events.length}` : ""}`} tabIndex={dIso === date ? 0 : -1}
                  className={`day-cell ${dIso === date ? "selected" : ""} ${dIso === today ? "today" : ""} ${i % 7 === 5 ? "weekend" : ""} ${tier} ${events.length ? "has-events" : ""}`}
                  onClick={() => setDate(dIso)}>
                  <span className="day-top">
                    <span className="day-number">{num(item.gregorian.day)}</span>
                    {native && <span className={`native-number ${monthStart ? "month-start" : ""}`}>{native}</span>}
                  </span>
                  {first && <span className="day-events">
                    <span className={`event-chip ${chipClass(first)}`}>{holidayTier(first) === "strong" && <Icon name="flag" />}<span>{eventTitle(first, language)}</span></span>
                    {events.length > 1 && <span className="event-more">+{num(events.length - 1)}</span>}
                  </span>}
                  {first && <span className="event-dots" aria-hidden="true">{events.slice(0, 3).map((ev, k) => <i key={k} className={chipClass(ev)} />)}</span>}
                </button>;
              })}
            </div>}

            {view === "all" && <div className="month-grid all-grid" role="grid" aria-label={monthLabel} onKeyDown={onGridKey}>
              {weekdays[language].map((w, i) => <div className={`weekday ${i === 5 ? "weekend" : ""}`} key={w}>{w}</div>)}
              {allGrid.map((n, i) => {
                if (n === null) return <div className="day-cell empty" key={`empty-${i}`} />;
                const dIso = iso(n);
                const events = allEventsOf(n);
                const tier = events.some(e => holidayTier(e) === "strong") ? "holiday" : events.some(e => holidayTier(e) === "soft") ? "holiday-soft" : "";
                const bd = nativeLabel(allDay("bd-bengali", n)); const wb = nativeLabel(allDay("india-bengali", n));
                return <button key={dIso} role="gridcell" aria-selected={dIso === date} tabIndex={dIso === date ? 0 : -1}
                  className={`day-cell ucell ${dIso === date ? "selected" : ""} ${dIso === today ? "today" : ""} ${i % 7 === 5 ? "weekend" : ""} ${tier} ${events.length ? "has-events" : ""}`}
                  onClick={() => setDate(dIso)}>
                  <span className="day-top"><span className="day-number">{num(n)}</span></span>
                  <span className="native-rows">
                    {layers["bd-bengali"] && bd && <span className="nrow eng-bd-bengali"><i className="eng-dot" />{bd}</span>}
                    {layers["india-bengali"] && wb && <span className="nrow eng-india-bengali"><i className="eng-dot" />{wb}</span>}
                  </span>
                  {events[0] && <span className="day-events">
                    <span className={`event-chip ${chipClass(events[0])}`}>{holidayTier(events[0]) === "strong" && <Icon name="flag" />}<span>{eventTitle(events[0], language)}</span></span>
                    {events.length > 1 && <span className="event-more">+{num(events.length - 1)}</span>}
                  </span>}
                  {events[0] && <span className="event-dots" aria-hidden="true">{events.slice(0, 3).map((ev, k) => <i key={k} className={chipClass(ev)} />)}</span>}
                </button>;
              })}
            </div>}

            {view === "agenda" && <div className="agenda">
              {allGrid.filter((n): n is number => n !== null).map(n => {
                const events = allEventsOf(n);
                if (!events.length) return null;
                const dIso = iso(n); const wd = new Date(`${dIso}T00:00:00.000Z`).getUTCDay();
                const bd = allLayerLabel("bd-bengali", n); const wb = allLayerLabel("india-bengali", n);
                return <button key={n} className={`agenda-row ${dIso === date ? "selected" : ""} ${dIso === today ? "today" : ""}`} onClick={() => setDate(dIso)}>
                  <span className="agenda-date"><b>{num(n)}</b><small>{weekdays[language][wd]}</small></span>
                  <span className="agenda-body">
                    <span className="agenda-events">{events.map((e, k) => <span key={k} className={`event-chip ${chipClass(e)}`}>{holidayTier(e) === "strong" && <Icon name="flag" />}<span>{eventTitle(e, language)}</span></span>)}</span>
                    <span className="agenda-native">{bd && <span className="nrow eng-bd-bengali"><i className="eng-dot" />{bd}</span>}{wb && <span className="nrow eng-india-bengali"><i className="eng-dot" />{wb}</span>}</span>
                  </span>
                </button>;
              })}
              {!allLoading && allGrid.every(n => n === null || allEventsOf(n).length === 0) && <p className="empty-message">{u.agendaEmpty}</p>}
            </div>}
            {view !== "calendar" && allLoading && <div className="loading-bar" role="status"><span />{u.calculating}</div>}

            <div className="calendar-legend">
              <span><i className="legend-dot holiday-dot" /> {u.legendGeneral}</span>
              <span><i className="legend-dot soft-dot" /> {u.legendSoft}</span>
              <span><i className="legend-dot vaishnava-dot" /> {u.legendVaishnava}</span>
              <span><i className="legend-dot today-dot" /> {u.todayTag}</span>
            </div>
          </div>
          {error && <div className="error-banner" role="alert"><Icon name="alert" /><span>{error}</span></div>}
        </section>

        <aside className="details-column">
          <section className="date-card">
            <div className="date-card-top"><span className="eyebrow">{t.dayDetails}</span>{dayNav}</div>
            {gregorianHero(heroDay)}
            {view === "calendar" && selectedDay?.nativeDateAvailable && <div className={`native-band eng-${calendarId}`}>
              <span className="band-label">{calendarName}</span>
              <div className="native-date">{selectedDateLabel}</div>
            </div>}
            {view !== "calendar" && <div className="native-list">
              {(["bd-bengali", "india-bengali"] as const).filter(id => layers[id]).map(id => { const d = allDay(id, day); return d && d.nativeDateAvailable ? <div key={id} className={`native-line eng-${id}`}><i className="eng-dot" /><span className="line-label">{engineShort(id, language, hinduMode)}</span><strong>{formatSelectedCalendarDate(d, language)}</strong></div> : null; })}
            </div>}
          </section>

          {view === "calendar" && selectedDay && <>
            <section className="info-card">
              <div className="section-heading"><h2>{t.events}</h2><span className="count-badge">{num(selectedDay.events.length)}</span></div>
              {selectedDay.events.length ? <div className="event-list">{sortEvents(selectedDay.events).map((event, i) => <EventItem key={`${event.engine}-${event.kind}-${i}`} event={event} language={language} />)}</div> : <p className="empty-message">{t.noEvents}</p>}
            </section>
            {selectedDay.panchang && <section className="info-card">
              <div className="section-heading"><h2>{u.panchangShort}</h2></div>
              <PanchangTiles day={selectedDay} t={t} />
            </section>}
            {monthEvents.length > 0 && <section className="info-card">
              <div className="section-heading"><h2>{u.thisMonth}</h2><span className="count-badge">{num(monthEvents.length)}</span></div>
              <div className="month-list">{monthEvents.slice(0, 10).map((m, i) => <button key={i} className={`month-item ${chipClass(m.e)} ${m.iso === date ? "selected" : ""}`} onClick={() => setDate(m.iso)}><b>{num(m.day)}</b><span>{eventTitle(m.e, language)}</span></button>)}</div>
            </section>}
            {calendarId === "bd-bengali" && <section className="info-card validation-card">
              <div className="section-heading"><h2>{t.validation}</h2><span className={`validation-indicator ${validationTone}`}>{validation?.status ?? "—"}</span></div>
              {validation && <>
                <p className={`validation-result ${validationTone}`}><Icon name={validation.status === "matched" ? "check" : "alert"} /><span>{validation.status === "matched" ? t.matched : validation.status === "mismatch" ? t.mismatch : t.offline}</span></p>
                {validation.external && <p className="muted-note">{language === "bn" ? "বাহ্যিক ফলাফল" : "External result"}: {validation.external.day} {validation.external.monthName[language]} {validation.external.year}</p>}
              </>}
              <button className="outline-button" onClick={doValidate} disabled={validating}>{validating ? t.checking : t.validate}</button>
            </section>}
          </>}

          {view !== "calendar" && ENGINES.filter(e => layers[e.id]).map(e => {
            const d = allDay(e.id, day);
            if (!d) return <section key={e.id} className={`info-card engine-card eng-${e.id}`}><div className="engine-head"><i className="eng-dot" /><h2>{engineShort(e.id, language, hinduMode)}</h2></div>{allLoading && <p className="empty-message">{u.calculating}</p>}</section>;
            return <section key={e.id} className={`info-card engine-card eng-${e.id}`}>
              <div className="engine-head"><i className="eng-dot" /><h2>{d.calendarName[language]}</h2>{d.events.length > 0 && <span className="count-badge">{num(d.events.length)}</span>}</div>
              {d.nativeDateAvailable && <div className="engine-native">{formatSelectedCalendarDate(d, language)}</div>}
              {d.events.length > 0 && <div className="event-list">{sortEvents(d.events).map((event, i) => <EventItem key={i} event={event} language={language} />)}</div>}
              {d.panchang && <PanchangTiles day={d} t={t} />}
            </section>;
          })}
        </aside>
      </main>}
    </div>
  </div>;

  function allLayerLabel(id: CalendarId, n: number) { return layers[id] ? nativeLabel(allDay(id, n)) : null; }
}

createRoot(document.getElementById("root")!).render(<App />);
