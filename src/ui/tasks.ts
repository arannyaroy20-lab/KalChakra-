import type { DisplayLanguage } from "../integration/types.js";
import {
  SCHEDULE_TYPES,
  dhakaMinutesToMs,
  scheduleMatchesDate,
  type PersonalSchedule,
  type ScheduleTypeId,
  type ScheduleTypeMeta
} from "./schedules.js";
import type { IconName } from "./shared.js";

export type TaskStatus = "pending" | "running" | "done" | "failed";
export type TaskTypeId = ScheduleTypeId;

export interface LiveTask {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  type: TaskTypeId;
  comment?: string;
  campaignId?: string;
  sourceScheduleId?: string;
  status: TaskStatus;
  startedAtMs?: number;
  deadlineAtMs?: number;
  completedAtMs?: number;
  createdAt: string;
}

export type CampaignLogoId =
  | "trophy"
  | "target"
  | "flame"
  | "shield"
  | "book"
  | "briefcase"
  | "pulse"
  | "music"
  | "compass"
  | "prayer";

export interface CampaignLogoMeta {
  id: CampaignLogoId;
  icon: IconName;
  label: { bn: string; en: string };
}

export interface Campaign {
  id: string;
  title: string;
  logo: CampaignLogoId;
  totalDays: number;
  dailyGoal: number;
  startDate: string;
  description?: string;
  createdAt: string;
}

export type CampaignTier = "achieved" | "strong" | "steady" | "low";

export interface CampaignScoreSummary {
  totalTarget: number;
  doneCount: number;
  failedCount: number;
  pendingCount: number;
  runningCount: number;
  todayDoneCount: number;
  scorePct: number;
  tier: CampaignTier;
  daysElapsed: number;
  daysRemaining: number;
  hasActivity: boolean;
}

export type DailyTaskGoals = Record<string, number>;

export interface TaskStoreData {
  tasks: LiveTask[];
  goals: DailyTaskGoals;
  campaigns?: Campaign[];
}

export interface DailyTaskScore {
  goal: number;
  totalCount: number;
  doneCount: number;
  failedCount: number;
  pendingCount: number;
  runningCount: number;
  scorePct: number;
}

export const TASK_TYPES: readonly ScheduleTypeMeta[] = SCHEDULE_TYPES;

export const CAMPAIGN_LOGOS: readonly CampaignLogoMeta[] = [
  { id: "trophy", icon: "trophy", label: { bn: "বিজয়", en: "Milestone" } },
  { id: "target", icon: "target", label: { bn: "লক্ষ্য", en: "Focus" } },
  { id: "flame", icon: "flame", label: { bn: "অধ্যবসায়", en: "Streak" } },
  { id: "shield", icon: "shield", label: { bn: "শৃঙ্খলা", en: "Discipline" } },
  { id: "book", icon: "book", label: { bn: "পড়াশোনা", en: "Study" } },
  { id: "briefcase", icon: "briefcase", label: { bn: "ক্যারিয়ার", en: "Career" } },
  { id: "pulse", icon: "pulse", label: { bn: "স্বাস্থ্য", en: "Fitness" } },
  { id: "music", icon: "music", label: { bn: "সঙ্গীত", en: "Music" } },
  { id: "compass", icon: "compass", label: { bn: "অভিযান", en: "Journey" } },
  { id: "prayer", icon: "prayer", label: { bn: "সাধনা", en: "Mindfulness" } }
];

export const DEFAULT_DAILY_TASK_GOAL = 4;
export const MIN_TASK_DURATION_MINS = 5;
export const MAX_TASK_DURATION_MINS = 240;

const TASKS_STORAGE_KEY = "multical-live-tasks";
const GOALS_STORAGE_KEY = "multical-task-goals";
const CAMPAIGNS_STORAGE_KEY = "multical-campaigns";

export function getTaskType(id: TaskTypeId): ScheduleTypeMeta {
  return TASK_TYPES.find(item => item.id === id) ?? TASK_TYPES[TASK_TYPES.length - 1]!;
}

export function getCampaignLogo(id: CampaignLogoId): CampaignLogoMeta {
  return CAMPAIGN_LOGOS.find(item => item.id === id) ?? CAMPAIGN_LOGOS[0]!;
}

export function resolveTaskComment(task: LiveTask, language: DisplayLanguage): string {
  const custom = task.comment?.trim();
  return custom ? custom : getTaskType(task.type).defaultComment[language];
}

export function clampTaskDuration(minutes: number): number {
  const snapped = Math.round(minutes / 5) * 5;
  return Math.max(MIN_TASK_DURATION_MINS, Math.min(MAX_TASK_DURATION_MINS, snapped));
}

export function clampGoalCount(goal: number): number {
  const rounded = Math.round(goal);
  return Math.max(1, Math.min(30, Number.isFinite(rounded) ? rounded : DEFAULT_DAILY_TASK_GOAL));
}

export function clampCampaignDays(days: number): number {
  const rounded = Math.round(days);
  return Math.max(1, Math.min(365, Number.isFinite(rounded) ? rounded : 7));
}

export function loadTasks(): LiveTask[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: LiveTask[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* storage unavailable */
  }
}

export function loadTaskGoals(): DailyTaskGoals {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as DailyTaskGoals) : {};
  } catch {
    return {};
  }
}

export function saveTaskGoals(goals: DailyTaskGoals): void {
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch {
    /* storage unavailable */
  }
}

export function loadCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCampaigns(campaigns: Campaign[]): void {
  try {
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  } catch {
    /* storage unavailable */
  }
}

export function getGoalForDate(goals: DailyTaskGoals, isoDate: string): number {
  const val = goals[isoDate];
  return typeof val === "number" && Number.isFinite(val) ? clampGoalCount(val) : DEFAULT_DAILY_TASK_GOAL;
}

export function reconcileExpiredTasks(tasks: LiveTask[], nowMs: number): LiveTask[] {
  let changed = false;
  const next = tasks.map(task => {
    if (task.status === "running" && typeof task.deadlineAtMs === "number" && nowMs >= task.deadlineAtMs) {
      changed = true;
      return { ...task, status: "failed" as const };
    }
    return task;
  });
  return changed ? next : tasks;
}

export function getRunningLiveTask(tasks: LiveTask[], nowMs: number): LiveTask | null {
  return (
    tasks.find(
      task =>
        task.status === "running" &&
        typeof task.deadlineAtMs === "number" &&
        nowMs < task.deadlineAtMs
    ) ?? null
  );
}

export function startLiveTask(tasks: LiveTask[], taskId: string, todayIso: string, nowMs: number): LiveTask[] {
  if (getRunningLiveTask(tasks, nowMs)) return tasks;
  return tasks.map(task => {
    if (task.id !== taskId || task.status !== "pending") return task;
    const duration = clampTaskDuration(task.durationMinutes);
    return {
      ...task,
      date: todayIso,
      durationMinutes: duration,
      status: "running",
      startedAtMs: nowMs,
      deadlineAtMs: nowMs + duration * 60_000
    };
  });
}

export function completeRunningTask(tasks: LiveTask[], taskId: string, nowMs: number): LiveTask[] {
  return tasks.map(task => {
    if (task.id !== taskId || task.status !== "running") return task;
    if (typeof task.deadlineAtMs === "number" && nowMs >= task.deadlineAtMs) {
      return { ...task, status: "failed" };
    }
    return {
      ...task,
      status: "done",
      completedAtMs: nowMs
    };
  });
}

/**
 * Synchronizes Campaign-linked Schedules into LiveTasks for today.
 * - Fixed Schedule Tasks auto-transition to "running" during [startMinutes, endMinutes)
 *   if no other live task is currently running.
 * - Syncs completion when a schedule is marked completed via Got it.
 * - Detaches uncompleted auto-tasks if a schedule is removed from its campaign.
 */
export function syncCampaignSchedulesToTasks(
  tasks: LiveTask[],
  schedules: PersonalSchedule[],
  todayIso: string,
  nowMs: number
): LiveTask[] {
  let changed = false;
  const scheduleMap = new Map(schedules.map(s => [s.id, s]));

  let nextTasks = tasks.filter(task => {
    if (!task.sourceScheduleId) return true;
    const sch = scheduleMap.get(task.sourceScheduleId);
    if (!sch || !sch.campaignId) {
      if (task.status === "done") return true;
      changed = true;
      return false;
    }
    return true;
  });

  nextTasks = nextTasks.map(task => {
    if (!task.sourceScheduleId) return task;
    const sch = scheduleMap.get(task.sourceScheduleId);
    if (!sch) return task;
    if (sch.completedDates?.includes(task.date) && task.status !== "done") {
      changed = true;
      return { ...task, status: "done" as const, completedAtMs: task.completedAtMs ?? nowMs };
    }
    if (sch.campaignId && task.campaignId !== sch.campaignId) {
      changed = true;
      return { ...task, campaignId: sch.campaignId };
    }
    return task;
  });

  const activeRunning = getRunningLiveTask(nextTasks, nowMs);
  const linkedToday = schedules.filter(s => Boolean(s.campaignId) && scheduleMatchesDate(s, todayIso));

  for (const sch of linkedToday) {
    const campaignId = sch.campaignId;
    if (!campaignId) continue;
    const startMs = dhakaMinutesToMs(todayIso, sch.startMinutes);
    const endMs = dhakaMinutesToMs(todayIso, sch.endMinutes);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) continue;

    const occurrenceId = `sch-live:${sch.id}:${todayIso}`;
    const existingIdx = nextTasks.findIndex(t => t.id === occurrenceId);
    const isCompleted = Boolean(sch.completedDates?.includes(todayIso));

    if (existingIdx >= 0) {
      const existing = nextTasks[existingIdx]!;
      if (isCompleted && existing.status !== "done") {
        changed = true;
        nextTasks[existingIdx] = { ...existing, status: "done", completedAtMs: existing.completedAtMs ?? nowMs };
      } else if (existing.status === "running" && (existing.startedAtMs !== startMs || existing.deadlineAtMs !== endMs)) {
        changed = true;
        nextTasks[existingIdx] = {
          ...existing,
          startedAtMs: startMs,
          deadlineAtMs: endMs,
          durationMinutes: Math.max(5, sch.endMinutes - sch.startMinutes),
          status: nowMs >= endMs ? "failed" : "running"
        };
      }
      continue;
    }

    if (nowMs >= startMs && nowMs < endMs && !activeRunning) {
      const hasOtherRunningNow = Boolean(getRunningLiveTask(nextTasks, nowMs));
      if (!hasOtherRunningNow) {
        changed = true;
        nextTasks.push({
          id: occurrenceId,
          title: sch.title,
          date: todayIso,
          durationMinutes: Math.max(5, sch.endMinutes - sch.startMinutes),
          type: sch.type,
          campaignId,
          sourceScheduleId: sch.id,
          status: isCompleted ? "done" : "running",
          startedAtMs: startMs,
          deadlineAtMs: endMs,
          ...(isCompleted ? { completedAtMs: nowMs } : {}),
          ...(sch.comment?.trim() ? { comment: sch.comment.trim() } : {}),
          createdAt: sch.createdAt
        });
      }
    } else if (nowMs >= endMs && Date.parse(sch.createdAt) < endMs && !isCompleted) {
      changed = true;
      nextTasks.push({
        id: occurrenceId,
        title: sch.title,
        date: todayIso,
        durationMinutes: Math.max(5, sch.endMinutes - sch.startMinutes),
        type: sch.type,
        campaignId,
        sourceScheduleId: sch.id,
        status: "failed",
        startedAtMs: startMs,
        deadlineAtMs: endMs,
        ...(sch.comment?.trim() ? { comment: sch.comment.trim() } : {}),
        createdAt: sch.createdAt
      });
    }
  }

  return changed ? nextTasks : tasks;
}

/** Regular daily task score (strictly excludes Long-Term Campaign tasks). */
export function computeDailyTaskScore(tasks: LiveTask[], goals: DailyTaskGoals, isoDate: string): DailyTaskScore {
  const goal = getGoalForDate(goals, isoDate);
  const dayTasks = tasks.filter(task => !task.campaignId && task.date === isoDate);
  const doneCount = dayTasks.filter(task => task.status === "done").length;
  const failedCount = dayTasks.filter(task => task.status === "failed").length;
  const pendingCount = dayTasks.filter(task => task.status === "pending").length;
  const runningCount = dayTasks.filter(task => task.status === "running").length;
  const scorePct = Math.min(100, Math.round((doneCount / goal) * 100));
  return {
    goal,
    totalCount: dayTasks.length,
    doneCount,
    failedCount,
    pendingCount,
    runningCount,
    scorePct
  };
}

export function computeCampaignScore(
  campaign: Campaign,
  tasks: LiveTask[],
  todayIso: string
): CampaignScoreSummary {
  const scoped = tasks.filter(task => task.campaignId === campaign.id);
  const totalTarget = Math.max(1, clampCampaignDays(campaign.totalDays) * clampGoalCount(campaign.dailyGoal));
  const doneCount = scoped.filter(task => task.status === "done").length;
  const failedCount = scoped.filter(task => task.status === "failed").length;
  const pendingCount = scoped.filter(task => task.status === "pending").length;
  const runningCount = scoped.filter(task => task.status === "running").length;
  const todayDoneCount = scoped.filter(task => task.status === "done" && task.date === todayIso).length;
  const scorePct = Math.min(100, Math.round((doneCount / totalTarget) * 100));

  const tier: CampaignTier =
    scorePct >= 100
      ? "achieved"
      : scorePct >= 75
        ? "strong"
        : scorePct >= 50
          ? "steady"
          : "low";

  const startMs = Date.parse(`${campaign.startDate}T00:00:00.000Z`);
  const todayMs = Date.parse(`${todayIso}T00:00:00.000Z`);
  const diffDays = Number.isFinite(startMs) && Number.isFinite(todayMs)
    ? Math.max(0, Math.floor((todayMs - startMs) / 86_400_000))
    : 0;
  const daysElapsed = Math.min(campaign.totalDays, diffDays + 1);
  const daysRemaining = Math.max(0, campaign.totalDays - daysElapsed);

  return {
    totalTarget,
    doneCount,
    failedCount,
    pendingCount,
    runningCount,
    todayDoneCount,
    scorePct,
    tier,
    daysElapsed,
    daysRemaining,
    hasActivity: scoped.length > 0
  };
}

export function formatTaskDuration(minutes: number, language: DisplayLanguage): string {
  const safe = clampTaskDuration(minutes);
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  const digit = (n: number) =>
    language === "bn" ? String(n).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[Number(d)]!) : String(n);
  if (language === "bn") {
    if (hours > 0 && mins > 0) return `${digit(hours)} ঘণ্টা ${digit(mins)} মি.`;
    if (hours > 0) return `${digit(hours)} ঘণ্টা`;
    return `${digit(mins)} মিনিট`;
  }
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function formatCountdownMs(remainingMs: number, language: DisplayLanguage): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const raw = hours > 0 ? `${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  return language === "bn" ? raw.replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[Number(d)]!) : raw;
}

export function formatDeadlineClock(deadlineAtMs: number, language: DisplayLanguage): string {
  return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka"
  }).format(new Date(deadlineAtMs));
}
