import { useMemo, useState } from "react";
import type { DisplayLanguage } from "../integration/types.js";
import { DurationHourPicker } from "./DurationHourPicker.js";
import { monthNames, ui, weekdays } from "./i18n.js";
import { Icon, numFor, shortDate, todayIso } from "./shared.js";
import {
  formatDuration,
  formatScheduleRange,
  getScheduleStatus,
  getScheduleType,
  scheduleMatchesDate,
  sortSchedulesChronologically,
  type PersonalSchedule
} from "./schedules.js";
import {
  CAMPAIGN_LOGOS,
  TASK_TYPES,
  clampCampaignDays,
  clampGoalCount,
  clampTaskDuration,
  computeCampaignScore,
  computeDailyTaskScore,
  formatCountdownMs,
  formatDeadlineClock,
  formatTaskDuration,
  getCampaignLogo,
  getGoalForDate,
  getRunningLiveTask,
  getTaskType,
  resolveTaskComment,
  type Campaign,
  type CampaignLogoId,
  type CampaignScoreSummary,
  type DailyTaskGoals,
  type LiveTask,
  type TaskTypeId
} from "./tasks.js";

interface LiveTaskViewProps {
  tasks: LiveTask[];
  goals: DailyTaskGoals;
  campaigns: Campaign[];
  schedules: PersonalSchedule[];
  onChangeTasks: (next: LiveTask[]) => void;
  onChangeGoals: (next: DailyTaskGoals) => void;
  onChangeCampaigns: (next: Campaign[]) => void;
  onDetachScheduleCampaign: (scheduleId: string) => void;
  onStartTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  date: string;
  onSelectDate: (isoDate: string) => void;
  nowMs: number;
  exactNowMinutes: number;
  language: DisplayLanguage;
}

const CAMPAIGN_DAY_PRESETS = [7, 14, 21, 30, 60, 90];

function campaignVerdict(summary: CampaignScoreSummary, u: typeof ui.bn): { title: string; body: string; tone: "good" | "mid" | "low" } {
  if (summary.tier === "achieved") {
    return { title: u.verdictAchievedTitle, body: u.verdictAchievedMsg, tone: "good" };
  }
  if (summary.tier === "strong") {
    return { title: u.verdictStrongTitle, body: u.verdictStrongMsg, tone: "mid" };
  }
  if (summary.tier === "steady") {
    return { title: u.verdictSteadyTitle, body: u.verdictSteadyMsg, tone: "mid" };
  }
  if (!summary.hasActivity || (summary.doneCount === 0 && summary.failedCount === 0)) {
    return { title: u.verdictLowFreshTitle, body: u.verdictLowFreshMsg, tone: "low" };
  }
  return { title: u.verdictLowBehindTitle, body: u.verdictLowBehindMsg, tone: "low" };
}

export function LiveTaskView({
  tasks,
  goals,
  campaigns,
  schedules,
  onChangeTasks,
  onChangeGoals,
  onChangeCampaigns,
  onDetachScheduleCampaign,
  onStartTask,
  onCompleteTask,
  date,
  onSelectDate,
  nowMs,
  exactNowMinutes,
  language
}: LiveTaskViewProps) {
  const u = ui[language];
  const num = numFor(language);
  const today = todayIso();

  const [section, setSection] = useState<"daily" | "campaigns">("daily");
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  // Daily task queue form state
  const [filter, setFilter] = useState<"day" | "all">("day");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [typeId, setTypeId] = useState<TaskTypeId>("study");
  const [comment, setComment] = useState("");

  // New Campaign form state
  const [campTitle, setCampTitle] = useState("");
  const [campLogo, setCampLogo] = useState<CampaignLogoId>("trophy");
  const [campDays, setCampDays] = useState(14);
  const [campDailyGoal, setCampDailyGoal] = useState(3);
  const [campDesc, setCampDesc] = useState("");

  // Inside-campaign task form state
  const [campTaskTitle, setCampTaskTitle] = useState("");
  const [campTaskDuration, setCampTaskDuration] = useState(60);
  const [campTaskType, setCampTaskType] = useState<TaskTypeId>("work");
  const [campTaskNote, setCampTaskNote] = useState("");

  const [year, month] = date.split("-").map(Number) as [number, number];
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthLabel = `${monthNames[language][month - 1]} ${num(year)}`;

  const calendarCells = useMemo(
    () => [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)],
    [firstWeekday, daysInMonth]
  );

  const isoForDay = (d: number) => `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const moveMonth = (amount: number) => {
    const next = new Date(Date.UTC(year, month - 1 + amount, 1));
    onSelectDate(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-01`);
  };

  const runningTask = useMemo(() => getRunningLiveTask(tasks, nowMs), [tasks, nowMs]);
  const runningCampaign = runningTask?.campaignId
    ? campaigns.find(c => c.id === runningTask.campaignId) ?? null
    : null;

  const regularTasks = useMemo(() => tasks.filter(task => !task.campaignId), [tasks]);
  const todayScore = useMemo(() => computeDailyTaskScore(tasks, goals, today), [tasks, goals, today]);
  const selectedGoal = getGoalForDate(goals, date);
  const selectedScore = useMemo(() => computeDailyTaskScore(tasks, goals, date), [tasks, goals, date]);
  const activeScore = date === today ? todayScore : selectedScore;

  const setGoalCount = (targetDate: string, nextGoal: number) => {
    onChangeGoals({ ...goals, [targetDate]: clampGoalCount(nextGoal) });
  };

  const dayTasks = useMemo(() => {
    const rank = { running: 0, pending: 1, done: 2, failed: 3 } as const;
    return regularTasks
      .filter(task => task.date === date)
      .sort((a, b) => rank[a.status] - rank[b.status] || b.createdAt.localeCompare(a.createdAt));
  }, [regularTasks, date]);

  const allTasksSorted = useMemo(() => {
    const rank = { running: 0, pending: 1, done: 2, failed: 3 } as const;
    return [...regularTasks].sort(
      (a, b) => rank[a.status] - rank[b.status] || a.date.localeCompare(b.date) || b.createdAt.localeCompare(a.createdAt)
    );
  }, [regularTasks]);

  const visibleTasks = filter === "day" ? dayTasks : allTasksSorted;
  const activeTypeMeta = getTaskType(typeId);
  const activeCampaign = useMemo(
    () => (activeCampaignId ? campaigns.find(c => c.id === activeCampaignId) ?? null : null),
    [campaigns, activeCampaignId]
  );
  const activeCampaignTasks = useMemo(() => {
    if (!activeCampaign) return [];
    const rank = { running: 0, pending: 1, done: 2, failed: 3 } as const;
    return tasks
      .filter(t => t.campaignId === activeCampaign.id && !t.sourceScheduleId)
      .sort((a, b) => rank[a.status] - rank[b.status] || b.createdAt.localeCompare(a.createdAt));
  }, [tasks, activeCampaign]);
  const activeCampaignSchedules = useMemo(() => {
    if (!activeCampaign) return [];
    return sortSchedulesChronologically(schedules.filter(s => s.campaignId === activeCampaign.id));
  }, [schedules, activeCampaign]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDurationMinutes(60);
    setTypeId("study");
    setComment("");
  };

  const focusCreate = () => {
    const el = document.getElementById("live-task-title-input") as HTMLInputElement | null;
    el?.focus();
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const startEdit = (task: LiveTask) => {
    if (task.status !== "pending") return;
    setEditingId(task.id);
    setTitle(task.title);
    setDurationMinutes(task.durationMinutes);
    setTypeId(task.type);
    setComment(task.comment ?? "");
    onSelectDate(task.date);
    focusCreate();
  };

  const deleteTask = (task: LiveTask) => {
    if (task.status === "running") return;
    onChangeTasks(tasks.filter(item => item.id !== task.id));
    if (editingId === task.id) resetForm();
  };

  const makeId = (prefix: string) =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const handleSubmitDaily = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const cleanComment = comment.trim();
    const safeDuration = clampTaskDuration(durationMinutes);

    if (editingId) {
      const next = tasks.map(item => {
        if (item.id !== editingId || item.status !== "pending") return item;
        const updated: LiveTask = {
          id: item.id,
          title: cleanTitle,
          date,
          durationMinutes: safeDuration,
          type: typeId,
          status: "pending",
          createdAt: item.createdAt,
          ...(item.campaignId ? { campaignId: item.campaignId } : {}),
          ...(cleanComment ? { comment: cleanComment } : {})
        };
        return updated;
      });
      onChangeTasks(next);
      resetForm();
      return;
    }

    const created: LiveTask = {
      id: makeId("tsk"),
      title: cleanTitle,
      date,
      durationMinutes: safeDuration,
      type: typeId,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...(cleanComment ? { comment: cleanComment } : {})
    };
    onChangeTasks([...tasks, created]);
    resetForm();
  };

  const handleCreateCampaign = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const cleanTitle = campTitle.trim();
    if (!cleanTitle) return;
    const cleanDesc = campDesc.trim();
    const created: Campaign = {
      id: makeId("cmp"),
      title: cleanTitle,
      logo: campLogo,
      totalDays: clampCampaignDays(campDays),
      dailyGoal: clampGoalCount(campDailyGoal),
      startDate: today,
      createdAt: new Date().toISOString(),
      ...(cleanDesc ? { description: cleanDesc } : {})
    };
    onChangeCampaigns([created, ...campaigns]);
    setCampTitle("");
    setCampDesc("");
    setActiveCampaignId(created.id);
  };

  const deleteCampaign = (campaignId: string) => {
    const hasRunning = tasks.some(t => t.campaignId === campaignId && t.status === "running");
    if (hasRunning) return;
    onChangeCampaigns(campaigns.filter(c => c.id !== campaignId));
    onChangeTasks(tasks.filter(t => t.campaignId !== campaignId));
    for (const s of schedules) {
      if (s.campaignId === campaignId) onDetachScheduleCampaign(s.id);
    }
    if (activeCampaignId === campaignId) setActiveCampaignId(null);
  };

  const handleSubmitCampaignTask = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!activeCampaign) return;
    const cleanTitle = campTaskTitle.trim();
    if (!cleanTitle) return;
    const cleanNote = campTaskNote.trim();
    const created: LiveTask = {
      id: makeId("ctsk"),
      title: cleanTitle,
      date: today,
      durationMinutes: clampTaskDuration(campTaskDuration),
      type: campTaskType,
      campaignId: activeCampaign.id,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...(cleanNote ? { comment: cleanNote } : {})
    };
    onChangeTasks([...tasks, created]);
    setCampTaskTitle("");
    setCampTaskNote("");
  };

  const scoreTone =
    activeScore.scorePct >= 100
      ? "good"
      : activeScore.scorePct >= 50
        ? "mid"
        : "low";

  const runningRemainingMs = runningTask && runningTask.deadlineAtMs ? Math.max(0, runningTask.deadlineAtMs - nowMs) : 0;
  const runningTotalMs = runningTask ? runningTask.durationMinutes * 60_000 : 1;
  const runningProgressPct = runningTask
    ? Math.max(0, Math.min(100, ((runningTotalMs - runningRemainingMs) / runningTotalMs) * 100))
    : 0;

  return (
    <main className="my-agenda-page">
      <div className="task-mode-bar">
        <div className="mini-seg" role="tablist" aria-label={u.liveTask}>
          <button
            type="button"
            role="tab"
            aria-selected={section === "daily"}
            className={section === "daily" ? "active" : ""}
            onClick={() => setSection("daily")}
          >
            {u.tabDailyTasks} ({num(regularTasks.length)})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === "campaigns"}
            className={section === "campaigns" ? "active" : ""}
            onClick={() => setSection("campaigns")}
          >
            {u.tabCampaigns} ({num(campaigns.length)})
          </button>
        </div>
      </div>

      {runningTask && (
        <section className="info-card live-running-banner" aria-live="polite">
          <div className="live-banner-top">
            <div className="live-banner-info">
              <span className="agenda-type-icon"><Icon name={getTaskType(runningTask.type).icon} /></span>
              <div className="live-banner-copy">
                <span className="live-kicker">
                  {runningCampaign ? `${runningCampaign.title} · ` : ""}
                  {u.liveRunningTitle} · {formatTaskDuration(runningTask.durationMinutes, language)}
                  {runningTask.deadlineAtMs ? ` · ${u.liveEndsAt} ${formatDeadlineClock(runningTask.deadlineAtMs, language)}` : ""}
                </span>
                <strong>{runningTask.title}</strong>
                <small>{resolveTaskComment(runningTask, language)}</small>
              </div>
            </div>
            <div className="live-banner-actions">
              <div className="live-timer-readout">{formatCountdownMs(runningRemainingMs, language)}</div>
              <button
                type="button"
                className="got-it-button"
                onClick={() => onCompleteTask(runningTask.id)}
              >
                <Icon name="check" />
                <span>{u.markDoneBtn}</span>
              </button>
            </div>
          </div>
          <div className="live-progress-track" aria-hidden="true">
            <div className="live-progress-fill" style={{ width: `${runningProgressPct.toFixed(1)}%` }} />
          </div>
        </section>
      )}

      {section === "daily" && (
        <>
          <section className="info-card task-goal-strip">
            <div className="task-goal-grid">
              <div className="task-goal-left">
                <div className="task-goal-head">
                  <span className="agenda-type-icon"><Icon name="target" /></span>
                  <div>
                    <h2>{date === today ? u.todaysGoalTitle : `${shortDate(date, language)} · ${u.goalTargetLabel}`}</h2>
                    <p className="task-goal-sub">
                      {num(activeScore.doneCount)}/{num(activeScore.goal)} {u.taskStatusDone}
                      {" · "}
                      {num(activeScore.failedCount)} {u.taskStatusFailed}
                    </p>
                  </div>
                </div>
                <div className="task-score-bar-track" aria-hidden="true">
                  <div className={`task-score-bar-fill ${scoreTone}`} style={{ width: `${activeScore.scorePct}%` }} />
                </div>
              </div>

              <div className="task-goal-right">
                <div className="task-score-readout">
                  <span className="task-score-caption">{u.scoreOutOf100}</span>
                  <strong className={`task-score-value ${scoreTone}`}>{num(activeScore.scorePct)}%</strong>
                </div>
                <div className="task-goal-stepper" role="group" aria-label={u.goalTargetLabel}>
                  <span className="task-goal-label">{u.goalTargetLabel}</span>
                  <div className="ring-step-pair">
                    <button type="button" className="step-btn" onClick={() => setGoalCount(date, selectedGoal - 1)} aria-label="Decrease goal">−</button>
                    <span className="task-goal-count">{num(selectedGoal)}</span>
                    <button type="button" className="step-btn" onClick={() => setGoalCount(date, selectedGoal + 1)} aria-label="Increase goal">+</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="info-card your-agendas-card">
            <div className="section-heading">
              <div className="your-agendas-title">
                <h2>{u.yourTasks}</h2>
                <span className="count-badge">{num(regularTasks.length)}</span>
              </div>
              {regularTasks.length > 0 && (
                <div className="mini-seg" role="group" aria-label={u.yourTasks}>
                  <button
                    type="button"
                    className={filter === "day" ? "active" : ""}
                    aria-pressed={filter === "day"}
                    onClick={() => setFilter("day")}
                  >
                    {u.taskFilterDay} ({num(dayTasks.length)})
                  </button>
                  <button
                    type="button"
                    className={filter === "all" ? "active" : ""}
                    aria-pressed={filter === "all"}
                    onClick={() => setFilter("all")}
                  >
                    {u.taskFilterAll} ({num(regularTasks.length)})
                  </button>
                </div>
              )}
            </div>

            {regularTasks.length === 0 ? (
              <div className="agenda-empty-box">
                <p className="empty-message">{u.noTasksEmpty}</p>
                <button type="button" className="primary-button" onClick={focusCreate}>
                  <Icon name="plus" />
                  {u.createTask}
                </button>
              </div>
            ) : visibleTasks.length === 0 ? (
              <div className="agenda-empty-box">
                <p className="empty-message">{u.noDayTasks}</p>
              </div>
            ) : (
              <div className="my-agenda-list">
                {visibleTasks.map(task => {
                  const typeMeta = getTaskType(task.type);
                  const isRunning = task.status === "running";
                  const isPending = task.status === "pending";
                  const isDone = task.status === "done";
                  const isFailed = task.status === "failed";
                  const blockedByOther = isPending && Boolean(runningTask);

                  return (
                    <article key={task.id} className={`task-queue-row status-${task.status} ${editingId === task.id ? "editing" : ""}`}>
                      <span className="agenda-type-icon"><Icon name={typeMeta.icon} /></span>
                      <div className="agenda-item-body">
                        <div className="agenda-item-head">
                          <strong>{task.title}</strong>
                          <span className={`task-status-label ${task.status}`}>
                            {isRunning ? u.taskStatusRunning
                              : isDone ? u.taskStatusDone
                              : isFailed ? u.taskStatusFailed
                              : u.taskStatusPending}
                          </span>
                        </div>
                        <div className="agenda-item-meta">
                          <span><Icon name="clock" />{formatTaskDuration(task.durationMinutes, language)}</span>
                          {filter === "all" && (
                            <button type="button" className="agenda-date-link" onClick={() => onSelectDate(task.date)}>
                              {shortDate(task.date, language)}
                            </button>
                          )}
                          {isRunning && task.deadlineAtMs && (
                            <span className="task-live-clock-meta">{formatCountdownMs(Math.max(0, task.deadlineAtMs - nowMs), language)}</span>
                          )}
                        </div>
                        <p className="agenda-item-note">{resolveTaskComment(task, language)}</p>
                      </div>

                      <div className="schedule-row-right">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              className="primary-button task-start-btn"
                              disabled={blockedByOther}
                              title={blockedByOther ? u.anotherRunningHint : u.startLiveBtn}
                              onClick={() => onStartTask(task.id)}
                            >
                              <Icon name="play" />
                              <span>{u.startLiveBtn}</span>
                            </button>
                            <div className="agenda-item-actions">
                              <button type="button" className="icon-button small" onClick={() => startEdit(task)} title={u.editTask} aria-label={u.editTask}><Icon name="edit" /></button>
                              <button type="button" className="icon-button small danger" onClick={() => deleteTask(task)} aria-label="Delete"><Icon name="trash" /></button>
                            </div>
                          </>
                        )}
                        {isRunning && (
                          <button type="button" className="got-it-button" onClick={() => onCompleteTask(task.id)}>
                            <Icon name="check" />
                            <span>{u.markDoneBtn}</span>
                          </button>
                        )}
                        {isDone && (
                          <span className="big-green-tick" aria-label={u.taskStatusDone}><Icon name="checkCircle" /></span>
                        )}
                        {isFailed && (
                          <div className="task-failed-right">
                            <span className="task-failed-icon" aria-label={u.taskStatusFailed}><Icon name="xCircle" /></span>
                            <button type="button" className="icon-button small danger" onClick={() => deleteTask(task)} aria-label="Delete"><Icon name="trash" /></button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <div className="my-agenda-workspace">
            <section className="calendar-card agenda-picker-card">
              <div className="calendar-heading">
                <div className="heading-text">
                  <h2>{monthLabel}</h2>
                  <span className="calendar-tag">{shortDate(date, language)}</span>
                </div>
                <div className="date-toolbar">
                  <button type="button" className="today-button" onClick={() => onSelectDate(today)}>{u.todayTag}</button>
                  <div className="nav-pair">
                    <button type="button" className="icon-button" onClick={() => moveMonth(-1)} aria-label={u.prevMonth}><Icon name="left" /></button>
                    <button type="button" className="icon-button" onClick={() => moveMonth(1)} aria-label={u.nextMonth}><Icon name="right" /></button>
                  </div>
                </div>
              </div>

              <div className="month-grid agenda-cal-grid" role="grid" aria-label={monthLabel}>
                {weekdays[language].map((w, i) => (
                  <div className={`weekday ${i === 5 ? "weekend" : ""}`} key={w}>{w}</div>
                ))}
                {calendarCells.map((dayNum, i) => {
                  if (dayNum === null) return <div className="day-cell empty" key={`empty-${i}`} />;
                  const dIso = isoForDay(dayNum);
                  const count = regularTasks.filter(item => item.date === dIso).length;
                  return (
                    <button
                      type="button"
                      key={dIso}
                      role="gridcell"
                      aria-selected={dIso === date}
                      onClick={() => onSelectDate(dIso)}
                      className={`day-cell compact-cell ${dIso === date ? "selected" : ""} ${dIso === today ? "today" : ""} ${count > 0 ? "has-agenda" : ""}`}
                    >
                      <span className="day-number">{num(dayNum)}</span>
                      {count > 0 && <span className="agenda-cell-dot" aria-label={`${count}`} />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="info-card agenda-form-card">
              <div className="section-heading">
                <h2>{editingId ? u.editTask : u.createTask}</h2>
                <span className="calendar-tag">{shortDate(date, language)}</span>
              </div>

              <form className="agenda-form" onSubmit={handleSubmitDaily}>
                <label className="field-group">
                  <span className="field-label">{u.taskName}</span>
                  <input
                    id="live-task-title-input"
                    type="text"
                    className="text-input"
                    value={title}
                    onChange={(e: { target: { value: string } }) => setTitle(e.target.value)}
                    placeholder={u.taskNamePlaceholder}
                    required
                  />
                </label>

                <div className="field-group">
                  <span className="field-label">{u.durationRingTitle}</span>
                  <DurationHourPicker durationMinutes={durationMinutes} onChange={setDurationMinutes} language={language} />
                </div>

                <div className="field-group">
                  <span className="field-label">{u.taskCategoryPrompt}</span>
                  <div className="agenda-type-grid" role="group" aria-label={u.taskCategoryPrompt}>
                    {TASK_TYPES.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className={`type-option ${typeId === item.id ? "active" : ""}`}
                        aria-pressed={typeId === item.id}
                        onClick={() => setTypeId(item.id)}
                      >
                        <Icon name={item.icon} />
                        <span>{item.label[language]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="field-group">
                  <span className="field-label">{u.agendaComment}</span>
                  <input
                    type="text"
                    className="text-input"
                    value={comment}
                    onChange={(e: { target: { value: string } }) => setComment(e.target.value)}
                    placeholder={activeTypeMeta.defaultComment[language]}
                  />
                </label>

                <div className="form-actions">
                  <button type="submit" className="primary-button" disabled={!title.trim()}>
                    <Icon name="check" />
                    {editingId ? u.updateTask : u.saveTask}
                  </button>
                  {editingId && (
                    <button type="button" className="ghost-button" onClick={resetForm}>{u.cancelEdit}</button>
                  )}
                </div>
              </form>
            </section>
          </div>
        </>
      )}

      {section === "campaigns" && !activeCampaign && (
        <div className="my-agenda-workspace campaign-overview-grid">
          <section className="info-card your-agendas-card">
            <div className="section-heading">
              <div className="your-agendas-title">
                <h2>{u.yourCampaigns}</h2>
                <span className="count-badge">{num(campaigns.length)}</span>
              </div>
            </div>
            <p className="campaign-zone-sub">{u.campaignZoneNote}</p>

            {campaigns.length === 0 ? (
              <div className="agenda-empty-box">
                <p className="empty-message">{u.noCampaignsEmpty}</p>
              </div>
            ) : (
              <div className="campaign-card-list">
                {campaigns.map(camp => {
                  const summary = computeCampaignScore(camp, tasks, today);
                  const verdict = campaignVerdict(summary, u);
                  const logoMeta = getCampaignLogo(camp.logo);
                  const hasRunningHere = runningTask?.campaignId === camp.id;
                  return (
                    <article key={camp.id} className={`campaign-item-card tone-${verdict.tone}`}>
                      <div className="campaign-item-head">
                        <span className={`campaign-logo-badge tone-${verdict.tone}`}>
                          <Icon name={logoMeta.icon} />
                        </span>
                        <div className="campaign-item-title-col">
                          <strong>{camp.title}</strong>
                          <span className="campaign-item-meta">
                            {num(camp.totalDays)} {u.daysUnit} · {num(camp.dailyGoal)} {u.tasksUnit}/{u.daysUnit} · {u.dayCounterLabel} {num(summary.daysElapsed)}/{num(camp.totalDays)}
                          </span>
                        </div>
                        <div className="campaign-score-col">
                          <strong className={`task-score-value ${verdict.tone}`}>{num(summary.scorePct)}%</strong>
                          <span className="campaign-fraction">{num(summary.doneCount)}/{num(summary.totalTarget)}</span>
                        </div>
                      </div>

                      <div className="task-score-bar-track" aria-hidden="true">
                        <div className={`task-score-bar-fill ${verdict.tone}`} style={{ width: `${summary.scorePct}%` }} />
                      </div>

                      <div className="campaign-verdict-row">
                        <div className="campaign-verdict-copy">
                          <strong className={`campaign-verdict-title ${verdict.tone}`}>{verdict.title}</strong>
                          <p className="campaign-verdict-text">{verdict.body}</p>
                        </div>
                        <div className="campaign-item-actions">
                          <button type="button" className="primary-button task-start-btn" onClick={() => setActiveCampaignId(camp.id)}>
                            <span>{u.openCampaignBtn}</span>
                            <Icon name="right" />
                          </button>
                          <button
                            type="button"
                            className="icon-button small danger"
                            disabled={hasRunningHere}
                            onClick={() => deleteCampaign(camp.id)}
                            aria-label="Delete"
                          >
                            <Icon name="trash" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="info-card agenda-form-card">
            <div className="section-heading">
              <h2>{u.createCampaign}</h2>
              <span className="calendar-tag">{num(clampCampaignDays(campDays) * clampGoalCount(campDailyGoal))} {u.tasksUnit}</span>
            </div>

            <form className="agenda-form" onSubmit={handleCreateCampaign}>
              <label className="field-group">
                <span className="field-label">{u.campaignName}</span>
                <input
                  type="text"
                  className="text-input"
                  value={campTitle}
                  onChange={(e: { target: { value: string } }) => setCampTitle(e.target.value)}
                  placeholder={u.campaignNamePlaceholder}
                  required
                />
              </label>

              <div className="field-group">
                <span className="field-label">{u.campaignLogoPrompt}</span>
                <div className="agenda-type-grid" role="group" aria-label={u.campaignLogoPrompt}>
                  {CAMPAIGN_LOGOS.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      className={`type-option ${campLogo === item.id ? "active" : ""}`}
                      aria-pressed={campLogo === item.id}
                      onClick={() => setCampLogo(item.id)}
                    >
                      <Icon name={item.icon} />
                      <span>{item.label[language]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field-group">
                <span className="field-label">{u.campaignDaysLabel}</span>
                <div className="campaign-number-row">
                  <div className="repeat-grid">
                    {CAMPAIGN_DAY_PRESETS.map(d => (
                      <button
                        key={d}
                        type="button"
                        className={`choice-chip ${campDays === d ? "active" : ""}`}
                        onClick={() => setCampDays(d)}
                      >
                        {num(d)} {u.daysUnit}
                      </button>
                    ))}
                  </div>
                  <div className="ring-step-pair">
                    <button type="button" className="step-btn" onClick={() => setCampDays(clampCampaignDays(campDays - 1))}>−</button>
                    <span className="task-goal-count">{num(campDays)}</span>
                    <button type="button" className="step-btn" onClick={() => setCampDays(clampCampaignDays(campDays + 1))}>+</button>
                  </div>
                </div>
              </div>

              <div className="field-group">
                <span className="field-label">{u.campaignDailyGoalLabel}</span>
                <div className="campaign-goal-inline">
                  <div className="ring-step-pair">
                    <button type="button" className="step-btn" onClick={() => setCampDailyGoal(clampGoalCount(campDailyGoal - 1))}>−</button>
                    <span className="task-goal-count">{num(campDailyGoal)}</span>
                    <button type="button" className="step-btn" onClick={() => setCampDailyGoal(clampGoalCount(campDailyGoal + 1))}>+</button>
                  </div>
                  <span className="campaign-total-calc">
                    {u.campaignTotalTarget}: <strong>{num(clampCampaignDays(campDays) * clampGoalCount(campDailyGoal))} {u.tasksUnit}</strong>
                  </span>
                </div>
              </div>

              <label className="field-group">
                <span className="field-label">{u.campaignNoteLabel}</span>
                <input
                  type="text"
                  className="text-input"
                  value={campDesc}
                  onChange={(e: { target: { value: string } }) => setCampDesc(e.target.value)}
                  placeholder={u.campaignNotePlaceholder}
                />
              </label>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={!campTitle.trim()}>
                  <Icon name="check" />
                  {u.saveCampaignBtn}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {section === "campaigns" && activeCampaign && (() => {
        const summary = computeCampaignScore(activeCampaign, tasks, today);
        const verdict = campaignVerdict(summary, u);
        const logoMeta = getCampaignLogo(activeCampaign.logo);
        return (
          <>
            <div className="campaign-back-bar">
              <button type="button" className="ghost-button" onClick={() => setActiveCampaignId(null)}>
                <Icon name="left" />
                <span>{u.backToCampaigns}</span>
              </button>
            </div>

            <section className={`info-card campaign-detail-hero tone-${verdict.tone}`}>
              <div className="campaign-detail-top">
                <div className="campaign-detail-brand">
                  <span className={`campaign-logo-badge lg tone-${verdict.tone}`}>
                    <Icon name={logoMeta.icon} />
                  </span>
                  <div>
                    <h2>{activeCampaign.title}</h2>
                    <p className="campaign-item-meta">
                      {u.dayCounterLabel} {num(summary.daysElapsed)}/{num(activeCampaign.totalDays)}
                      {" · "}
                      {num(summary.doneCount)}/{num(summary.totalTarget)} {u.tasksUnit}
                      {" · "}
                      {u.todayDoneInCampaign}: {num(summary.todayDoneCount)}/{num(activeCampaign.dailyGoal)}
                    </p>
                    {activeCampaign.description && <p className="campaign-desc-line">{activeCampaign.description}</p>}
                  </div>
                </div>
                <div className="campaign-detail-score">
                  <span className="task-score-caption">{u.scoreOutOf100}</span>
                  <strong className={`task-score-value lg ${verdict.tone}`}>{num(summary.scorePct)}%</strong>
                </div>
              </div>

              <div className="task-score-bar-track" aria-hidden="true">
                <div className={`task-score-bar-fill ${verdict.tone}`} style={{ width: `${summary.scorePct}%` }} />
              </div>

              <div className="campaign-verdict-banner">
                <strong className={`campaign-verdict-title ${verdict.tone}`}>{verdict.title}</strong>
                <span>{verdict.body}</span>
              </div>
            </section>

            {activeCampaignSchedules.length > 0 && (
              <section className="info-card your-agendas-card">
                <div className="section-heading">
                  <div className="your-agendas-title">
                    <h2>{u.fixedTasksSectionTitle}</h2>
                    <span className="count-badge">{num(activeCampaignSchedules.length)}</span>
                  </div>
                </div>
                <p className="campaign-zone-sub">{u.fixedTaskScheduleNote}</p>
                <div className="my-agenda-list">
                  {activeCampaignSchedules.map(sch => {
                    const sMeta = getScheduleType(sch.type);
                    const matchesToday = scheduleMatchesDate(sch, today);
                    const schStatus = getScheduleStatus(sch, matchesToday ? today : sch.date, today, Math.floor(exactNowMinutes));
                    const linkedLive = tasks.find(t => t.id === `sch-live:${sch.id}:${today}`);
                    const effectiveStatus = linkedLive ? linkedLive.status : schStatus;
                    const isLiveNow = linkedLive?.status === "running";
                    const isCompleted = effectiveStatus === "done";
                    const isFailed = effectiveStatus === "failed" || effectiveStatus === "passed";

                    return (
                      <article key={sch.id} className={`task-queue-row status-${isLiveNow ? "running" : isCompleted ? "done" : isFailed ? "failed" : "pending"}`}>
                        <span className="agenda-type-icon"><Icon name={sMeta.icon} /></span>
                        <div className="agenda-item-body">
                          <div className="agenda-item-head">
                            <strong>{sch.title}</strong>
                            <span className="fixed-tag-text">{u.fixedTaskBadge}</span>
                            <span className={`task-status-label ${isLiveNow ? "running" : isCompleted ? "done" : isFailed ? "failed" : "pending"}`}>
                              {isLiveNow ? u.taskStatusRunning
                                : isCompleted ? u.taskStatusDone
                                : isFailed ? u.taskStatusFailed
                                : u.taskStatusPending}
                            </span>
                          </div>
                          <div className="agenda-item-meta">
                            <span><Icon name="clock" />{formatScheduleRange(sch.startMinutes, sch.endMinutes, language)} · {formatDuration(sch.startMinutes, sch.endMinutes, language)}</span>
                            {isLiveNow && linkedLive?.deadlineAtMs && (
                              <span className="task-live-clock-meta">{formatCountdownMs(Math.max(0, linkedLive.deadlineAtMs - nowMs), language)}</span>
                            )}
                          </div>
                        </div>

                        <div className="schedule-row-right">
                          {isLiveNow && linkedLive && (
                            <button type="button" className="got-it-button" onClick={() => onCompleteTask(linkedLive.id)}>
                              <Icon name="check" />
                              <span>{u.markDoneBtn}</span>
                            </button>
                          )}
                          {isCompleted && (
                            <span className="big-green-tick" aria-label={u.taskStatusDone}><Icon name="checkCircle" /></span>
                          )}
                          {isFailed && (
                            <span className="task-failed-icon" aria-label={u.taskStatusFailed}><Icon name="xCircle" /></span>
                          )}
                          <button
                            type="button"
                            className="ghost-button compact-detach-btn"
                            onClick={() => onDetachScheduleCampaign(sch.id)}
                          >
                            {u.detachCampaignBtn}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="my-agenda-workspace">
              <section className="info-card your-agendas-card">
                <div className="section-heading">
                  <div className="your-agendas-title">
                    <h2>{u.yourTasks}</h2>
                    <span className="count-badge">{num(activeCampaignTasks.length)}</span>
                  </div>
                </div>
                <p className="campaign-zone-sub">{u.campaignTaskHint}</p>

                {activeCampaignTasks.length === 0 ? (
                  <div className="agenda-empty-box">
                    <p className="empty-message">{u.noDayTasks}</p>
                  </div>
                ) : (
                  <div className="my-agenda-list">
                    {activeCampaignTasks.map(task => {
                      const tMeta = getTaskType(task.type);
                      const isRunning = task.status === "running";
                      const isPending = task.status === "pending";
                      const isDone = task.status === "done";
                      const isFailed = task.status === "failed";
                      const blockedByOther = isPending && Boolean(runningTask);

                      return (
                        <article key={task.id} className={`task-queue-row status-${task.status}`}>
                          <span className="agenda-type-icon"><Icon name={tMeta.icon} /></span>
                          <div className="agenda-item-body">
                            <div className="agenda-item-head">
                              <strong>{task.title}</strong>
                              <span className={`task-status-label ${task.status}`}>
                                {isRunning ? u.taskStatusRunning
                                  : isDone ? u.taskStatusDone
                                  : isFailed ? u.taskStatusFailed
                                  : u.taskStatusPending}
                              </span>
                            </div>
                            <div className="agenda-item-meta">
                              <span><Icon name="clock" />{formatTaskDuration(task.durationMinutes, language)}</span>
                              {isRunning && task.deadlineAtMs && (
                                <span className="task-live-clock-meta">{formatCountdownMs(Math.max(0, task.deadlineAtMs - nowMs), language)}</span>
                              )}
                            </div>
                            <p className="agenda-item-note">{resolveTaskComment(task, language)}</p>
                          </div>

                          <div className="schedule-row-right">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  className="primary-button task-start-btn"
                                  disabled={blockedByOther}
                                  title={blockedByOther ? u.anotherRunningHint : u.startLiveBtn}
                                  onClick={() => onStartTask(task.id)}
                                >
                                  <Icon name="play" />
                                  <span>{u.startLiveBtn}</span>
                                </button>
                                <button type="button" className="icon-button small danger" onClick={() => deleteTask(task)} aria-label="Delete"><Icon name="trash" /></button>
                              </>
                            )}
                            {isRunning && (
                              <button type="button" className="got-it-button" onClick={() => onCompleteTask(task.id)}>
                                <Icon name="check" />
                                <span>{u.markDoneBtn}</span>
                              </button>
                            )}
                            {isDone && (
                              <span className="big-green-tick" aria-label={u.taskStatusDone}><Icon name="checkCircle" /></span>
                            )}
                            {isFailed && (
                              <div className="task-failed-right">
                                <span className="task-failed-icon" aria-label={u.taskStatusFailed}><Icon name="xCircle" /></span>
                                <button type="button" className="icon-button small danger" onClick={() => deleteTask(task)} aria-label="Delete"><Icon name="trash" /></button>
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="info-card agenda-form-card">
                <div className="section-heading">
                  <h2>{u.createTask}</h2>
                  <span className="calendar-tag">{activeCampaign.title}</span>
                </div>

                <form className="agenda-form" onSubmit={handleSubmitCampaignTask}>
                  <label className="field-group">
                    <span className="field-label">{u.taskName}</span>
                    <input
                      type="text"
                      className="text-input"
                      value={campTaskTitle}
                      onChange={(e: { target: { value: string } }) => setCampTaskTitle(e.target.value)}
                      placeholder={u.taskNamePlaceholder}
                      required
                    />
                  </label>

                  <div className="field-group">
                    <span className="field-label">{u.durationRingTitle}</span>
                    <DurationHourPicker durationMinutes={campTaskDuration} onChange={setCampTaskDuration} language={language} />
                  </div>

                  <div className="field-group">
                    <span className="field-label">{u.taskCategoryPrompt}</span>
                    <div className="agenda-type-grid" role="group" aria-label={u.taskCategoryPrompt}>
                      {TASK_TYPES.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          className={`type-option ${campTaskType === item.id ? "active" : ""}`}
                          aria-pressed={campTaskType === item.id}
                          onClick={() => setCampTaskType(item.id)}
                        >
                          <Icon name={item.icon} />
                          <span>{item.label[language]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="field-group">
                    <span className="field-label">{u.agendaComment}</span>
                    <input
                      type="text"
                      className="text-input"
                      value={campTaskNote}
                      onChange={(e: { target: { value: string } }) => setCampTaskNote(e.target.value)}
                      placeholder={getTaskType(campTaskType).defaultComment[language]}
                    />
                  </label>

                  <div className="form-actions">
                    <button type="submit" className="primary-button" disabled={!campTaskTitle.trim()}>
                      <Icon name="check" />
                      {u.saveTask}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </>
        );
      })()}
    </main>
  );
}
