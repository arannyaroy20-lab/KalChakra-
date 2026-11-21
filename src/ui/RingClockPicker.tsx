import { useEffect, useState } from "react";
import type { DisplayLanguage } from "../integration/types.js";
import { ui } from "./i18n.js";
import { format12hMinutes, formatDuration, from24Minutes, to24Minutes, type TimePeriod } from "./schedules.js";
import { numFor } from "./shared.js";

interface RingClockPickerProps {
  startMinutes: number;
  endMinutes: number;
  onChange: (nextStart: number, nextEnd: number) => void;
  language: DisplayLanguage;
}

const CX = 130;
const CY = 130;
const RING_R = 94;
const NUM_R = 68;

function polar(cx: number, cy: number, r: number, degFromTop: number): { x: number; y: number } {
  const rad = ((degFromTop - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function angularDist(a: number, b: number): number {
  const diff = Math.abs(a - b) % 720;
  return Math.min(diff, 720 - diff);
}

function pointToMins12(clientX: number, clientY: number): number | null {
  const svg = document.getElementById("schedule-ring-svg");
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  const rawMins = (deg / 360) * 720;
  return (Math.round(rawMins / 5) * 5) % 720;
}

export function RingClockPicker({ startMinutes, endMinutes, onChange, language }: RingClockPickerProps) {
  const u = ui[language];
  const num = numFor(language);

  const [dragging, setDragging] = useState<"start" | "end" | null>(null);
  const [activeHandle, setActiveHandle] = useState<"start" | "end">("start");

  const startParts = from24Minutes(startMinutes);
  const endParts = from24Minutes(endMinutes);
  const isValid = endMinutes > startMinutes;

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: PointerEvent) => {
      const mins12 = pointToMins12(e.clientX, e.clientY);
      if (mins12 === null) return;
      if (dragging === "start") {
        onChange(to24Minutes(mins12, startParts.period), endMinutes);
      } else {
        onChange(startMinutes, to24Minutes(mins12, endParts.period));
      }
    };

    const handleUp = () => setDragging(null);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragging, startMinutes, endMinutes, startParts.period, endParts.period, onChange]);

  const startDeg = (startParts.mins12 / 720) * 360;
  const endDeg = (endParts.mins12 / 720) * 360;
  const startPt = polar(CX, CY, RING_R, startDeg);
  const endPt = polar(CX, CY, RING_R, endDeg);

  const span12 = ((endParts.mins12 - startParts.mins12) + 720) % 720;
  const fullOrOver = isValid && endMinutes - startMinutes >= 720;
  const arcDeg = isValid ? (span12 / 720) * 360 : 0;
  const largeArc = arcDeg > 180 ? 1 : 0;
  const arcPath = span12 > 0
    ? `M ${startPt.x.toFixed(2)} ${startPt.y.toFixed(2)} A ${RING_R} ${RING_R} 0 ${largeArc} 1 ${endPt.x.toFixed(2)} ${endPt.y.toFixed(2)}`
    : "";

  const handleTrackPointerDown = (e: { clientX: number; clientY: number; preventDefault: () => void }) => {
    e.preventDefault();
    const mins12 = pointToMins12(e.clientX, e.clientY);
    if (mins12 === null) return;
    const distStart = angularDist(mins12, startParts.mins12);
    const distEnd = angularDist(mins12, endParts.mins12);
    const chosen: "start" | "end" = distStart === distEnd ? activeHandle : distStart < distEnd ? "start" : "end";
    setActiveHandle(chosen);
    setDragging(chosen);
    if (chosen === "start") {
      onChange(to24Minutes(mins12, startParts.period), endMinutes);
    } else {
      onChange(startMinutes, to24Minutes(mins12, endParts.period));
    }
  };

  const setPeriod = (target: "start" | "end", period: TimePeriod) => {
    setActiveHandle(target);
    if (target === "start") {
      onChange(to24Minutes(startParts.mins12, period), endMinutes);
    } else {
      onChange(startMinutes, to24Minutes(endParts.mins12, period));
    }
  };

  const nudgeMinutes = (target: "start" | "end", delta: number) => {
    setActiveHandle(target);
    if (target === "start") {
      const next = Math.max(0, Math.min(1435, startMinutes + delta));
      onChange(next, endMinutes);
    } else {
      const next = Math.max(5, Math.min(1435, endMinutes + delta));
      onChange(startMinutes, next);
    }
  };

  const durationText = formatDuration(startMinutes, endMinutes, language);

  return (
    <div className="ring-clock-box">
      <div className="ring-dial-wrap">
        <svg
          id="schedule-ring-svg"
          className={`ring-clock-svg ${dragging ? "is-dragging" : ""}`}
          viewBox="0 0 260 260"
          role="group"
          aria-label={u.ringClockTitle}
        >
          <circle cx={CX} cy={CY} r={RING_R} className="ring-track" onPointerDown={handleTrackPointerDown} />

          {fullOrOver && <circle cx={CX} cy={CY} r={RING_R} className="ring-arc-base" />}
          {isValid && arcPath && (
            <path d={arcPath} className="ring-arc-active" onPointerDown={handleTrackPointerDown} />
          )}

          {Array.from({ length: 12 }, (_, idx) => {
            const deg = idx * 30;
            const p1 = polar(CX, CY, RING_R - 8, deg);
            const p2 = polar(CX, CY, RING_R + 8, deg);
            const np = polar(CX, CY, NUM_R, deg);
            const label = idx === 0 ? 12 : idx;
            return (
              <g key={idx} className="ring-tick-group">
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className="ring-hour-tick" />
                <text x={np.x} y={np.y} textAnchor="middle" dominantBaseline="central" className="ring-hour-num">
                  {num(label)}
                </text>
              </g>
            );
          })}

          <g className="ring-center-readout">
            <text x={CX} y={CY - 8} textAnchor="middle" className="ring-center-duration">
              {isValid ? durationText : "—"}
            </text>
            <text x={CX} y={CY + 13} textAnchor="middle" className="ring-center-sub">
              {isValid ? `${format12hMinutes(startMinutes, language)}` : u.ringInvalidOrder}
            </text>
          </g>

          <g
            className={`ring-handle start ${activeHandle === "start" ? "focused" : ""}`}
            transform={`translate(${startPt.x}, ${startPt.y})`}
            onPointerDown={(e: { stopPropagation: () => void; preventDefault: () => void }) => {
              e.stopPropagation();
              e.preventDefault();
              setActiveHandle("start");
              setDragging("start");
            }}
          >
            <circle r={15} className="ring-handle-hit" />
            <circle r={11} className="ring-handle-body start" />
            <circle r={3.5} className="ring-handle-core start" />
          </g>

          <g
            className={`ring-handle end ${activeHandle === "end" ? "focused" : ""}`}
            transform={`translate(${endPt.x}, ${endPt.y})`}
            onPointerDown={(e: { stopPropagation: () => void; preventDefault: () => void }) => {
              e.stopPropagation();
              e.preventDefault();
              setActiveHandle("end");
              setDragging("end");
            }}
          >
            <circle r={15} className="ring-handle-hit" />
            <circle r={11} className="ring-handle-body end" />
            <circle r={4} className="ring-handle-core end" />
          </g>
        </svg>
      </div>

      <div className="ring-controls-col">
        <div
          className={`ring-endpoint-card ${activeHandle === "start" ? "active" : ""}`}
          onClick={() => setActiveHandle("start")}
        >
          <div className="ring-endpoint-head">
            <span className="ring-dot start" />
            <span className="ring-endpoint-label">{u.ringStart}</span>
            <strong className="ring-time-readout">{format12hMinutes(startMinutes, language)}</strong>
          </div>
          <div className="ring-endpoint-actions">
            <div className="mini-seg period-seg" role="group" aria-label={`${u.ringStart} AM/PM`}>
              <button
                type="button"
                className={startParts.period === "AM" ? "active" : ""}
                aria-pressed={startParts.period === "AM"}
                onClick={() => setPeriod("start", "AM")}
              >
                AM
              </button>
              <button
                type="button"
                className={startParts.period === "PM" ? "active" : ""}
                aria-pressed={startParts.period === "PM"}
                onClick={() => setPeriod("start", "PM")}
              >
                PM
              </button>
            </div>
            <div className="ring-step-pair">
              <button type="button" className="step-btn" onClick={() => nudgeMinutes("start", -15)} aria-label="-15m">−{num(15)}</button>
              <button type="button" className="step-btn" onClick={() => nudgeMinutes("start", 15)} aria-label="+15m">+{num(15)}</button>
            </div>
          </div>
        </div>

        <div
          className={`ring-endpoint-card ${activeHandle === "end" ? "active" : ""}`}
          onClick={() => setActiveHandle("end")}
        >
          <div className="ring-endpoint-head">
            <span className="ring-dot end" />
            <span className="ring-endpoint-label">{u.ringEnd}</span>
            <strong className="ring-time-readout">{format12hMinutes(endMinutes, language)}</strong>
          </div>
          <div className="ring-endpoint-actions">
            <div className="mini-seg period-seg" role="group" aria-label={`${u.ringEnd} AM/PM`}>
              <button
                type="button"
                className={endParts.period === "AM" ? "active" : ""}
                aria-pressed={endParts.period === "AM"}
                onClick={() => setPeriod("end", "AM")}
              >
                AM
              </button>
              <button
                type="button"
                className={endParts.period === "PM" ? "active" : ""}
                aria-pressed={endParts.period === "PM"}
                onClick={() => setPeriod("end", "PM")}
              >
                PM
              </button>
            </div>
            <div className="ring-step-pair">
              <button type="button" className="step-btn" onClick={() => nudgeMinutes("end", -15)} aria-label="-15m">−{num(15)}</button>
              <button type="button" className="step-btn" onClick={() => nudgeMinutes("end", 15)} aria-label="+15m">+{num(15)}</button>
            </div>
          </div>
        </div>

        {!isValid && <p className="ring-error-note">{u.ringInvalidOrder}</p>}
      </div>
    </div>
  );
}
