import { useEffect, useMemo, useState } from "react";
import type { DisplayLanguage } from "../integration/types.js";
import {
  AGENDA_TYPES,
  agendaMatchesDate,
  formatAgendaTime,
  getAgendaType,
  reorderAgendasBySubset,
  resolveAgendaComment,
  type AgendaRepeat,
  type AgendaTypeId,
  type PersonalAgenda
} from "./agendas.js";
import { monthNames, ui, weekdays } from "./i18n.js";
import { requestWebNotificationPermission } from "./notifications.js";
import { Icon, numFor, shortDate, todayIso } from "./shared.js";

interface MyAgendaViewProps {
  agendas: PersonalAgenda[];
  onChange: (next: PersonalAgenda[]) => void;
  date: string;
  onSelectDate: (isoDate: string) => void;
  language: DisplayLanguage;
}

const REPEAT_OPTIONS: { id: AgendaRepeat; labelKey: "repeatOnce" | "repeatWeekly" | "repeatMonthly" | "repeatYearly" | "repeatWeekdays" }[] = [
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

export function MyAgendaView({ agendas, onChange, date, onSelectDate, language }: MyAgendaViewProps) {
  const u = ui[language];
  const num = numFor(language);
  const today = todayIso();

  const [filter, setFilter] = useState<"day" | "all">("day");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [time, setTime] = useState("09:00");
  const [reminder, setReminder] = useState(true);
  const [repeat, setRepeat] = useState<AgendaRepeat>("once");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(() => [dateWeekday(date)]);
  const [typeId, setTypeId] = useState<AgendaTypeId>("birthday");
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
    setEditingId(null);
    setTitle("");
    setIsAllDay(true);
    setTime("09:00");
    setReminder(true);
    setRepeat("once");
    setSelectedWeekdays([dateWeekday(date)]);
    setTypeId("birthday");
    setComment("");
  };

  const focusCreate = () => {
    const el = document.getElementById("agenda-title-input") as HTMLInputElement | null;
    el?.focus();
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const startEdit = (item: PersonalAgenda) => {
    setEditingId(item.id);
    setTitle(item.title);
    setIsAllDay(item.isAllDay);
    setTime(item.time ?? "09:00");
    setReminder(item.reminder);
    setRepeat(item.repeat);
    setSelectedWeekdays(item.weekdays?.length ? item.weekdays : [dateWeekday(item.date)]);
    setTypeId(item.type);
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

  const handleRepeatChange = (nextRepeat: AgendaRepeat) => {
    setRepeat(nextRepeat);
    if (nextRepeat === "weekdays" && selectedWeekdays.length === 0) {
      setSelectedWeekdays([dateWeekday(date)]);
    }
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const cleanComment = comment.trim();
    const nextWeekdays = repeat === "weekdays"
      ? (selectedWeekdays.length ? selectedWeekdays : [dateWeekday(date)])
      : undefined;

    if (editingId) {
      const updated = agendas.map(item => {
        if (item.id !== editingId) return item;
        const base: PersonalAgenda = {
          id: item.id,
          title: cleanTitle,
          date,
          isAllDay,
          reminder,
          repeat,
          type: typeId,
          createdAt: item.createdAt,
          ...(!isAllDay ? { time } : {}),
          ...(nextWeekdays ? { weekdays: nextWeekdays } : {}),
          ...(cleanComment ? { comment: cleanComment } : {})
        };
        return base;
      });
      onChange(updated);
      resetForm();
      return;
    }

    const created: PersonalAgenda = {
      id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `ag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: cleanTitle,
      date,
      isAllDay,
      reminder,
      repeat,
      type: typeId,
      createdAt: new Date().toISOString(),
      ...(!isAllDay ? { time } : {}),
      ...(nextWeekdays ? { weekdays: nextWeekdays } : {}),
      ...(cleanComment ? { comment: cleanComment } : {})
    };
    onChange([...agendas, created]);
    if (reminder) requestWebNotificationPermission();
    resetForm();
  };

  const deleteAgenda = (id: string) => {
    onChange(agendas.filter(item => item.id !== id));
    if (editingId === id) resetForm();
  };

  const moveItem = (visibleList: PersonalAgenda[], index: number, delta: -1 | 1) => {
    const target = visibleList[index + delta];
    const current = visibleList[index];
    if (!current || !target) return;
    onChange(reorderAgendasBySubset(agendas, current.id, target.id));
  };

  const dayAgendas = useMemo(
    () => agendas.filter(item => agendaMatchesDate(item, date)),
    [agendas, date]
  );
  const visibleAgendas = filter === "day" ? dayAgendas : agendas;
  const activeTypeMeta = getAgendaType(typeId);

  const repeatLabel = (item: PersonalAgenda) => {
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
            <h2>{u.yourAgendas}</h2>
            <span className="count-badge">{num(agendas.length)}</span>
          </div>
          {agendas.length > 0 && (
            <div className="mini-seg" role="group" aria-label={u.yourAgendas}>
              <button
                type="button"
                className={filter === "day" ? "active" : ""}
                aria-pressed={filter === "day"}
                onClick={() => setFilter("day")}
              >
                {u.filterDay} ({num(dayAgendas.length)})
              </button>
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                aria-pressed={filter === "all"}
                onClick={() => setFilter("all")}
              >
                {u.filterAll} ({num(agendas.length)})
              </button>
            </div>
          )}
        </div>

        {agendas.length === 0 ? (
          <div className="agenda-empty-box">
            <p className="empty-message">{u.noAgendasEmpty}</p>
            <button type="button" className="primary-button" onClick={focusCreate}>
              <Icon name="plus" />
              {u.setAgenda}
            </button>
          </div>
        ) : visibleAgendas.length === 0 ? (
          <div className="agenda-empty-box">
            <p className="empty-message">{u.noDayAgendas}</p>
          </div>
        ) : (
          <>
            {visibleAgendas.length > 1 && <p className="agenda-priority-hint">{u.dragPriorityHint}</p>}
            <div className="my-agenda-list">
              {visibleAgendas.map((item, idx) => {
                const typeMeta = getAgendaType(item.type);
                const isMain = filter === "day" && idx === 0 && visibleAgendas.length > 1 && item.isAllDay;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragId(item.id)}
                    onDragOver={(e: { preventDefault: () => void }) => {
                      e.preventDefault();
                      if (dragOverId !== item.id) setDragOverId(item.id);
                    }}
                    onDrop={(e: { preventDefault: () => void }) => {
                      e.preventDefault();
                      if (dragId && dragId !== item.id) {
                        onChange(reorderAgendasBySubset(agendas, dragId, item.id));
                      }
                      setDragId(null);
                      setDragOverId(null);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDragOverId(null);
                    }}
                    className={`my-agenda-item ${dragId === item.id ? "dragging" : ""} ${dragOverId === item.id ? "drag-over" : ""} ${editingId === item.id ? "editing" : ""}`}
                  >
                    <span className="agenda-grip" aria-hidden="true"><Icon name="grip" /></span>
                    <span className="agenda-type-icon"><Icon name={typeMeta.icon} /></span>
                    <div className="agenda-item-body">
                      <div className="agenda-item-head">
                        <strong>{item.title}</strong>
                        {isMain && <span className="priority-tag">{u.mainBadge}</span>}
                        {item.reminder && <span className="reminder-tag" title={u.agendaReminder}><Icon name="bell" /></span>}
                      </div>
                      <div className="agenda-item-meta">
                        <span><Icon name="clock" />{formatAgendaTime(item, language)}</span>
                        <span><Icon name="repeat" />{repeatLabel(item)}</span>
                        {filter === "all" && (
                          <button type="button" className="agenda-date-link" onClick={() => onSelectDate(item.date)}>
                            {shortDate(item.date, language)}
                          </button>
                        )}
                      </div>
                      <p className="agenda-item-note">{resolveAgendaComment(item, language)}</p>
                    </div>
                    <div className="agenda-item-actions">
                      {visibleAgendas.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="icon-button small"
                            disabled={idx === 0}
                            onClick={() => moveItem(visibleAgendas, idx, -1)}
                            aria-label="Move up"
                          >
                            <Icon name="up" />
                          </button>
                          <button
                            type="button"
                            className="icon-button small"
                            disabled={idx === visibleAgendas.length - 1}
                            onClick={() => moveItem(visibleAgendas, idx, 1)}
                            aria-label="Move down"
                          >
                            <Icon name="down" />
                          </button>
                        </>
                      )}
                      <button type="button" className="icon-button small" onClick={() => startEdit(item)} title={u.editAgenda} aria-label={u.editAgenda}>
                        <Icon name="edit" />
                      </button>
                      <button type="button" className="icon-button small danger" onClick={() => deleteAgenda(item.id)} aria-label="Delete">
                        <Icon name="trash" />
                      </button>
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
              const count = agendas.filter(item => agendaMatchesDate(item, dIso)).length;
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
            <h2>{editingId ? u.editAgenda : u.createAgenda}</h2>
            <span className="calendar-tag">{shortDate(date, language)}</span>
          </div>

          <form className="agenda-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span className="field-label">{u.agendaName}</span>
              <input
                id="agenda-title-input"
                type="text"
                className="text-input"
                value={title}
                onChange={(e: { target: { value: string } }) => setTitle(e.target.value)}
                placeholder={u.agendaNamePlaceholder}
                required
              />
            </label>

            <div className="field-row">
              <div className="field-group">
                <span className="field-label">{u.agendaTimeMode}</span>
                <div className="mini-seg full" role="group" aria-label={u.agendaTimeMode}>
                  <button type="button" className={isAllDay ? "active" : ""} aria-pressed={isAllDay} onClick={() => setIsAllDay(true)}>{u.allDay}</button>
                  <button type="button" className={!isAllDay ? "active" : ""} aria-pressed={!isAllDay} onClick={() => setIsAllDay(false)}>{u.specificTime}</button>
                </div>
              </div>

              {!isAllDay && (
                <label className="field-group time-field">
                  <span className="field-label">{u.specificTime}</span>
                  <input type="time" className="text-input" value={time} onChange={(e: { target: { value: string } }) => setTime(e.target.value)} required />
                </label>
              )}

              <div className="field-group">
                <span className="field-label">{u.agendaReminder}</span>
                <div className="mini-seg full" role="group" aria-label={u.agendaReminder}>
                  <button type="button" className={reminder ? "active" : ""} aria-pressed={reminder} onClick={() => setReminder(true)}>{u.reminderOn}</button>
                  <button type="button" className={!reminder ? "active" : ""} aria-pressed={!reminder} onClick={() => setReminder(false)}>{u.reminderOff}</button>
                </div>
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
              <span className="field-label">{u.agendaTypePrompt}</span>
              <div className="agenda-type-grid" role="group" aria-label={u.agendaTypePrompt}>
                {AGENDA_TYPES.map(item => (
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
                {editingId ? u.updateAgenda : u.saveAgenda}
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
