import { useEffect, useMemo, useState } from "react";
import type { DisplayLanguage } from "../integration/types.js";
import { monthNames, ui, weekdays } from "./i18n.js";
import { requestWebNotificationPermission } from "./notifications.js";
import { RingClockPicker } from "./RingClockPicker.js";
import {
  SCHEDULE_TYPES,
  formatDuration,
  formatScheduleRange,
  getScheduleStatus,
  getScheduleTickMinutesLeft,
  getScheduleType,
  getSegmentProgressPct,
  isScheduleLockedForToday,
  resolveScheduleComment,
  scheduleMatchesDate,
  sortSchedulesChronologically,
  type PersonalSchedule,
  type ScheduleRepeat,
  type ScheduleTypeId
} from "./schedules.js";
import { Icon, numFor, shortDate, todayIso } from "./shared.js";
import type { Campaign } from "./tasks.js";

interface ScheduleViewProps {
  schedules: PersonalSchedule[];
  campaigns: Campaign[];
  onChange: (next: PersonalSchedule[]) => void;
  onMarkDone: (id: string, targetIso: string) => void;
  date: string;
  onSelectDate: (isoDate: string) => void;
  exactNowMinutes: number;
  language: DisplayLanguage;
}

const REPEAT_OPTIONS: { id: ScheduleRepeat; labelKey: "repeatOnce" | "repeatWeekly" | "repeatMonthly" | "repeatYearly" | "repeatWeekdays" }[] = [
  { id: "once", labelKey: "repeatOnce" },
  { id: "weekly", labelKey: "repeatWeekly" },
  { id: "monthly", labelKey: "repeatMonthly" },
  { id: "yearly", labelKey: "repeatYearly" },
  { id: "weekdays", labelKey: "repeatWeekdays" }
];

function dateWeekday(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function defaultSlotForDate(isoDate: string, today: string, nowMinutes: number): { start: number; end: number } {
  if (isoDate === today) {
    const nextHour = Math.min(22 * 60, (Math.floor(nowMinutes / 60) + 1) * 60);
    return { start: nextHour, end: Math.min(23 * 60 + 45, nextHour + 60) };
  }
  return { start: 9 * 60, end: 10 * 60 };
}

export function ScheduleView({
  schedules,
  campaigns,
  onChange,
  onMarkDone,
  date,
  onSelectDate,
  exactNowMinutes,
  language
}: ScheduleViewProps) {
  const u = ui[language];
  const num = numFor(language);
  const today = todayIso();
  const nowMinutes = Math.floor(exactNowMinutes);

  const [filter, setFilter] = useState<"day" | "all">("day");
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialSlot = defaultSlotForDate(date, today, nowMinutes);
  const [title, setTitle] = useState("");
  const [startMinutes, setStartMinutes] = useState(initialSlot.start);
  const [endMinutes, setEndMinutes] = useState(initialSlot.end);
  const [reminder, setReminder] = useState(true);
  const [repeat, setRepeat] = useState<ScheduleRepeat>("once");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(() => [dateWeekday(date)]);
  const [typeId, setTypeId] = useState<ScheduleTypeId>("study");
  const [campaignId, setCampaignId] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!editingId && repeat === "weekdays" && selectedWeekdays.length === 0) {
      setSelectedWeekdays([dateWeekday(date)]);
    }
  }, [date, editingId, repeat, selectedWeekdays.length]);

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

  const resetForm = () => {
    const nextSlot = defaultSlotForDate(date, today, nowMinutes);
    setEditingId(null);
    setTitle("");
    setStartMinutes(nextSlot.start);
    setEndMinutes(nextSlot.end);
    setReminder(true);
    setRepeat("once");
    setSelectedWeekdays([dateWeekday(date)]);
    setTypeId("study");
    setCampaignId("");
    setComment("");
  };

  const focusCreate = () => {
    const el = document.getElementById("schedule-title-input") as HTMLInputElement | null;
    el?.focus();
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const startEdit = (item: PersonalSchedule) => {
    if (isScheduleLockedForToday(item, date, today, nowMinutes)) return;
    setEditingId(item.id);
    setTitle(item.title);
    setStartMinutes(item.startMinutes);
    setEndMinutes(item.endMinutes);
    setReminder(item.reminder);
    setRepeat(item.repeat);
    setSelectedWeekdays(item.weekdays?.length ? item.weekdays : [dateWeekday(item.date)]);
    setTypeId(item.type);
    setCampaignId(item.campaignId ?? "");
    setComment(item.comment ?? "");
    onSelectDate(item.date);
    focusCreate();
  };

  const toggleWeekday = (wd: number) => {
    setSelectedWeekdays(prev => {
      if (prev.includes(wd)) {
        return prev.length > 1 ? prev.filter(x => x !== wd) : prev;
      }
      return [...prev, wd].sort((a, b) => a - b);
    });
  };

  const handleRepeatChange = (nextRepeat: ScheduleRepeat) => {
    setRepeat(nextRepeat);
    if (nextRepeat === "weekdays" && selectedWeekdays.length === 0) {
      setSelectedWeekdays([dateWeekday(date)]);
    }
  };

  const isValidRange = endMinutes > startMinutes;

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || !isValidRange) return;
    const cleanComment = comment.trim();
    const nextWeekdays = repeat === "weekdays"
      ? (selectedWeekdays.length ? selectedWeekdays : [dateWeekday(date)])
      : undefined;

    if (editingId) {
      const updated = schedules.map(item => {
        if (item.id !== editingId) return item;
        const base: PersonalSchedule = {
          id: item.id,
          title: cleanTitle,
          date,
          startMinutes,
          endMinutes,
          reminder,
          repeat,
          type: typeId,
          createdAt: item.createdAt,
          ...(campaignId ? { campaignId } : {}),
          ...(item.completedDates?.length ? { completedDates: item.completedDates } : {}),
          ...(nextWeekdays ? { weekdays: nextWeekdays } : {}),
          ...(cleanComment ? { comment: cleanComment } : {})
        };
        return base;
      });
      onChange(updated);
      resetForm();
      return;
    }

    const created: PersonalSchedule = {
      id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `sch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: cleanTitle,
      date,
      startMinutes,
      endMinutes,
      reminder,
      repeat,
      type: typeId,
      createdAt: new Date().toISOString(),
      ...(campaignId ? { campaignId } : {}),
      ...(nextWeekdays ? { weekdays: nextWeekdays } : {}),
      ...(cleanComment ? { comment: cleanComment } : {})
    };
    onChange([...schedules, created]);
    if (reminder || campaignId) requestWebNotificationPermission();
    resetForm();
  };

  const deleteSchedule = (item: PersonalSchedule) => {
    if (isScheduleLockedForToday(item, date, today, nowMinutes)) return;
    onChange(schedules.filter(s => s.id !== item.id));
    if (editingId === item.id) resetForm();
  };

  const detachCampaign = (scheduleId: string) => {
    onChange(schedules.map(s => {
      if (s.id !== scheduleId) return s;
      const rest = { ...s };
      delete rest.campaignId;
      return rest;
    }));
  };

  const daySchedules = useMemo(
    () => sortSchedulesChronologically(schedules.filter(item => scheduleMatchesDate(item, date))),
    [schedules, date]
  );
  const allSchedulesSorted = useMemo(
    () => sortSchedulesChronologically(schedules),
    [schedules]
  );
  const visibleSchedules = filter === "day" ? daySchedules : allSchedulesSorted;
  const activeTypeMeta = getScheduleType(typeId);

  const repeatLabel = (item: PersonalSchedule) => {
    if (item.repeat === "weekdays" && item.weekdays?.length) {
      return item.weekdays.map(wd => weekdays[language][wd]).join(", ");
    }
    const found = REPEAT_OPTIONS.find(r => r.id === item.repeat);
    return found ? u[found.labelKey] : item.repeat;
  };

  return (
    <main className="my-agenda-page">
      <section className="info-card your-agendas-card">
        <div className="section-heading">
          <div className="your-agendas-title">
            <h2>{u.yourSchedules}</h2>
            <span className="count-badge">{num(schedules.length)}</span>
          </div>
          {schedules.length > 0 && (
            <div className="mini-seg" role="group" aria-label={u.yourSchedules}>
              <button
                type="button"
                className={filter === "day" ? "active" : ""}
                aria-pressed={filter === "day"}
                onClick={() => setFilter("day")}
              >
                {u.filterDay} ({num(daySchedules.length)})
              </button>
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
              >
                {u.filterAll} ({num(schedules.length)})
              </button>
            </div>
          )}
        </div>

        {schedules.length === 0 ? (
          <div className="agenda-empty-box">
            <p className="empty-message">{u.noSchedulesEmpty}</p>
            <button type="button" className="primary-button" onClick={focusCreate}>
              <Icon name="plus" />
              {u.setSchedule}
            </button>
          </div>
        ) : visibleSchedules.length === 0 ? (
          <div className="agenda-empty-box">
            <p className="empty-message">{u.noDaySchedules}</p>
          </div>
        ) : (
          <>
            <p className="schedule-rule-note">{u.tickWindowHint}</p>
            <div className="schedule-timeline">
              {visibleSchedules.map((item, idx) => {
                const typeMeta = getScheduleType(item.type);
                const targetIso = filter === "day" ? date : item.date;
                const status = getScheduleStatus(item, targetIso, today, nowMinutes);
                const locked = isScheduleLockedForToday(item, targetIso, today, nowMinutes);
                const showRail = filter === "day" && visibleSchedules.length > 1;
                const nextItem = visibleSchedules[idx + 1];
                const hasNext = showRail && Boolean(nextItem);
                const progressPct = !nextItem
                  ? 0
                  : targetIso < today
                    ? 100
                    : targetIso > today
                      ? 0
                      : getSegmentProgressPct(item.startMinutes, nextItem.startMinutes, exactNowMinutes);
                const minutesLeft = status === "active" ? getScheduleTickMinutesLeft(item, nowMinutes) : 0;

                return (
                  <div key={item.id} className={`schedule-row status-${status} ${editingId === item.id ? "editing" : ""}`}>
                    {showRail && (
                      <div className="timeline-rail" aria-hidden="true">
                        <span className={`timeline-node ${status}`}>
                          {status === "done" && <Icon name="check" />}
                        </span>
                        {hasNext && (
                          <span className="timeline-track">
                            <span className={`timeline-fill ${status}`} style={{ height: `${progressPct.toFixed(1)}%` }} />
                            {progressPct > 0 && progressPct < 100 && (
                              <span className="timeline-cursor" style={{ top: `${progressPct.toFixed(1)}%` }} />
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="schedule-card-row">
                      <span className="agenda-type-icon"><Icon name={typeMeta.icon} /></span>
                      <div className="agenda-item-body">
                        <div className="agenda-item-head">
                          <strong>{item.title}</strong>
                          <span className={`schedule-status-text ${status}`}>
                            {status === "active" ? u.statusActive
                              : status === "done" ? u.statusDone
                              : status === "passed" ? u.statusPassed
                              : u.statusUpcoming}
                          </span>
                          {item.reminder && <span className="reminder-tag" title={u.agendaReminder}><Icon name="bell" /></span>}
                        </div>
                        <div className="agenda-item-meta">
                          <span><Icon name="clock" />{formatScheduleRange(item.startMinutes, item.endMinutes, language)} · {formatDuration(item.startMinutes, item.endMinutes, language)}</span>
                          <span><Icon name="repeat" />{repeatLabel(item)}</span>
                          {item.campaignId && (() => {
                            const camp = campaigns.find(c => c.id === item.campaignId);
                            if (!camp) return null;
                            return (
                              <span className="schedule-camp-link">
                                <Icon name="target" />
                                <span>{camp.title} ({u.fixedTaskBadge})</span>
                                <button
                                  type="button"
                                  className="schedule-detach-link"
                                  onClick={() => detachCampaign(item.id)}
                                  title={u.detachCampaignBtn}
                                >
                                  {u.detachCampaignBtn}
                                </button>
                              </span>
                            );
                          })()}
                          {filter === "all" && (
                            <button type="button" className="agenda-date-link" onClick={() => onSelectDate(item.date)}>
                              {shortDate(item.date, language)}
                            </button>
                          )}
                        </div>
                        <p className="agenda-item-note">{resolveScheduleComment(item, language)}</p>
                      </div>

                      <div className="schedule-row-right">
                        {status === "active" && (
                          <div className="schedule-tick-wrap">
                            <button
                              type="button"
                              className="got-it-button"
                              onClick={() => onMarkDone(item.id, targetIso)}
                            >
                              <Icon name="check" />
                              <span>{u.gotItBtn}</span>
                            </button>
                            <span className="tick-window-label">{num(minutesLeft)} {u.minsLeftTag}</span>
                          </div>
                        )}
                        {status === "done" && (
                          <span className="big-green-tick" aria-label={u.statusDone}>
                            <Icon name="checkCircle" />
                          </span>
                        )}
                      {locked ? (
                        <span className="schedule-lock-note" title={u.lockedHint}>
                          <Icon name="lock" />
                        </span>
                      ) : (
                        <div className="agenda-item-actions">
                          <button type="button" className="icon-button small" onClick={() => startEdit(item)} title={u.editSchedule} aria-label={u.editSchedule}>
                            <Icon name="edit" />
                          </button>
                          <button type="button" className="icon-button small danger" onClick={() => deleteSchedule(item)} aria-label="Delete">
                            <Icon name="trash" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </>
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
              const count = schedules.filter(item => scheduleMatchesDate(item, dIso)).length;
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
            <h2>{editingId ? u.editSchedule : u.createSchedule}</h2>
            <span className="calendar-tag">{shortDate(date, language)}</span>
          </div>

          <form className="agenda-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span className="field-label">{u.scheduleName}</span>
              <input
                id="schedule-title-input"
                type="text"
                className="text-input"
                value={title}
                onChange={(e: { target: { value: string } }) => setTitle(e.target.value)}
                placeholder={u.scheduleNamePlaceholder}
                required
              />
            </label>

            <div className="field-group">
              <span className="field-label">{u.ringClockTitle}</span>
              <RingClockPicker
                startMinutes={startMinutes}
                endMinutes={endMinutes}
                onChange={(s, e) => {
                  setStartMinutes(s);
                  setEndMinutes(e);
                }}
                language={language}
              />
            </div>

            <div className="field-group">
              <span className="field-label">{u.agendaReminder}</span>
              <div className="mini-seg full" role="group" aria-label={u.agendaReminder}>
                <button type="button" className={reminder ? "active" : ""} aria-pressed={reminder} onClick={() => setReminder(true)}>{u.reminderOn}</button>
                <button type="button" className={!reminder ? "active" : ""} aria-pressed={!reminder} onClick={() => setReminder(false)}>{u.reminderOff}</button>
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">{u.agendaRepeat}</span>
              <div className="repeat-grid" role="group" aria-label={u.agendaRepeat}>
                {REPEAT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`choice-chip ${repeat === opt.id ? "active" : ""}`}
                    aria-pressed={repeat === opt.id}
                    onClick={() => handleRepeatChange(opt.id)}
                  >
                    {u[opt.labelKey]}
                  </button>
                ))}
              </div>
              {repeat === "weekdays" && (
                <div className="weekday-picker" role="group" aria-label={u.repeatWeekdays}>
                  {weekdays[language].map((wdLabel, wdIdx) => (
                    <button
                      key={wdLabel}
                      type="button"
                      className={`wd-chip ${selectedWeekdays.includes(wdIdx) ? "active" : ""}`}
                      aria-pressed={selectedWeekdays.includes(wdIdx)}
                      onClick={() => toggleWeekday(wdIdx)}
                    >
                      {wdLabel}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="field-group">
              <span className="field-label">{u.scheduleTypePrompt}</span>
              <div className="agenda-type-grid" role="group" aria-label={u.scheduleTypePrompt}>
                {SCHEDULE_TYPES.map(item => (
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

            {campaigns.length > 0 && (
              <label className="field-group">
                <span className="field-label">{u.linkCampaignLabel}</span>
                <select
                  className="text-input"
                  value={campaignId}
                  onChange={(e: { target: { value: string } }) => setCampaignId(e.target.value)}
                >
                  <option value="">{u.noCampaignOption}</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </label>
            )}

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
              <button type="submit" className="primary-button" disabled={!title.trim() || !isValidRange}>
                <Icon name="check" />
                {editingId ? u.updateSchedule : u.saveSchedule}
              </button>
              {editingId && (
                <button type="button" className="ghost-button" onClick={resetForm}>
                  {u.cancelEdit}
                </button>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
