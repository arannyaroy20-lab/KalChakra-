import { useEffect, useState } from "react";
import type { DisplayLanguage } from "../integration/types.js";
import { ui } from "./i18n.js";
import { numFor } from "./shared.js";
import {
  MAX_TASK_DURATION_MINS,
  MIN_TASK_DURATION_MINS,
  clampTaskDuration,
  formatTaskDuration
} from "./tasks.js";

interface DurationHourPickerProps {
  durationMinutes: number;
  onChange: (nextMinutes: number) => void;
  language: DisplayLanguage;
}

const CX = 130;
const CY = 130;
const RING_R = 92;
const NUM_R = 66;
const QUICK_PRESETS = [30, 60, 120, 180, 240];

function polar(cx: number, cy: number, r: number, degFromTop: number): { x: number; y: number } {
  const rad = ((degFromTop - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function pointToDuration(clientX: number, clientY: number, currentDuration: number): number | null {
  const svg = document.getElementById("duration-ring-svg");
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;

  if (currentDuration >= 180 && deg < 42) {
    return MAX_TASK_DURATION_MINS;
  }
  if (currentDuration <= 60 && deg > 318) {
    return MIN_TASK_DURATION_MINS;
  }
  const rawMins = (deg / 360) * MAX_TASK_DURATION_MINS;
  return clampTaskDuration(rawMins);
}

export function DurationHourPicker({ durationMinutes, onChange, language }: DurationHourPickerProps) {
  const u = ui[language];
  const num = numFor(language);
  const [dragging, setDragging] = useState(false);

  const safeMinutes = clampTaskDuration(durationMinutes);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: PointerEvent) => {
      const next = pointToDuration(e.clientX, e.clientY, safeMinutes);
      if (next !== null) onChange(next);
    };

    const handleUp = () => setDragging(false);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [dragging, safeMinutes, onChange]);

  const deg = (safeMinutes / MAX_TASK_DURATION_MINS) * 360;
  const startPt = polar(CX, CY, RING_R, 0);
  const endPt = polar(CX, CY, RING_R, deg);
  const isFullCircle = safeMinutes >= MAX_TASK_DURATION_MINS;
  const largeArc = deg > 180 ? 1 : 0;
  const arcPath = !isFullCircle && safeMinutes > 0
    ? `M ${startPt.x.toFixed(2)} ${startPt.y.toFixed(2)} A ${RING_R} ${RING_R} 0 ${largeArc} 1 ${endPt.x.toFixed(2)} ${endPt.y.toFixed(2)}`
    : "";

  const handleTrackPointerDown = (e: { clientX: number; clientY: number; preventDefault: () => void }) => {
    e.preventDefault();
    const next = pointToDuration(e.clientX, e.clientY, safeMinutes);
    setDragging(true);
    if (next !== null) onChange(next);
  };

  return (
    <div className="ring-clock-box duration-ring-box">
      <div className="ring-dial-wrap">
        <svg
          id="duration-ring-svg"
          className={`ring-clock-svg ${dragging ? "is-dragging" : ""}`}
          viewBox="0 0 260 260"
          role="slider"
          aria-label={u.durationRingTitle}
          aria-valuemin={MIN_TASK_DURATION_MINS}
          aria-valuemax={MAX_TASK_DURATION_MINS}
          aria-valuenow={safeMinutes}
        >
          <circle cx={CX} cy={CY} r={RING_R} className="ring-track" onPointerDown={handleTrackPointerDown} />

          {isFullCircle ? (
            <circle cx={CX} cy={CY} r={RING_R} className="ring-arc-active" onPointerDown={handleTrackPointerDown} />
          ) : (
            arcPath && <path d={arcPath} className="ring-arc-active" onPointerDown={handleTrackPointerDown} />
          )}

          {Array.from({ length: 16 }, (_, idx) => {
            const tickDeg = idx * 22.5;
            const isMajor = idx % 4 === 0;
            const p1 = polar(CX, CY, RING_R - (isMajor ? 9 : 4), tickDeg);
            const p2 = polar(CX, CY, RING_R + (isMajor ? 9 : 4), tickDeg);
            return (
              <line
                key={idx}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                className={isMajor ? "ring-hour-tick major" : "ring-hour-tick"}
              />
            );
          })}

          {[
            { deg: 90, hr: 1 },
            { deg: 180, hr: 2 },
            { deg: 270, hr: 3 },
            { deg: 0, hr: 4 }
          ].map(point => {
            const np = polar(CX, CY, NUM_R, point.deg);
            return (
              <text
                key={point.hr}
                x={np.x}
                y={np.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="ring-hour-num duration-point"
                onPointerDown={(e: { stopPropagation: () => void; preventDefault: () => void }) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange(point.hr * 60);
                }}
              >
                {num(point.hr)}{u.hourShort}
              </text>
            );
          })}

          <g className="ring-center-readout">
            <text x={CX} y={CY - 7} textAnchor="middle" className="ring-center-duration">
              {formatTaskDuration(safeMinutes, language)}
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" className="ring-center-sub">
              {u.durationScaleHint}
            </text>
          </g>

          <g
            className="ring-handle start focused"
            transform={`translate(${endPt.x}, ${endPt.y})`}
            onPointerDown={(e: { stopPropagation: () => void; preventDefault: () => void }) => {
              e.stopPropagation();
              e.preventDefault();
              setDragging(true);
            }}
          >
            <circle r={16} className="ring-handle-hit" />
            <circle r={11.5} className="ring-handle-body start" />
            <circle r={3.5} className="ring-handle-core start" />
          </g>
        </svg>
      </div>

      <div className="ring-controls-col">
        <div className="ring-endpoint-card active">
          <div className="ring-endpoint-head">
            <span className="ring-dot start" />
            <span className="ring-endpoint-label">{u.taskDurationLabel}</span>
            <strong className="ring-time-readout">{formatTaskDuration(safeMinutes, language)}</strong>
          </div>
          <div className="ring-endpoint-actions">
            <div className="ring-step-pair">
              <button
                type="button"
                className="step-btn"
                onClick={() => onChange(clampTaskDuration(safeMinutes - 15))}
                aria-label="-15m"
              >
                −{num(15)}{u.minShort}
              </button>
              <button
                type="button"
                className="step-btn"
                onClick={() => onChange(clampTaskDuration(safeMinutes - 5))}
                aria-label="-5m"
              >
                −{num(5)}{u.minShort}
              </button>
              <button
                type="button"
                className="step-btn"
                onClick={() => onChange(clampTaskDuration(safeMinutes + 5))}
                aria-label="+5m"
              >
                +{num(5)}{u.minShort}
              </button>
              <button
                type="button"
                className="step-btn"
                onClick={() => onChange(clampTaskDuration(safeMinutes + 15))}
                aria-label="+15m"
              >
                +{num(15)}{u.minShort}
              </button>
            </div>
          </div>
        </div>

        <div className="duration-presets" role="group" aria-label={u.durationRingTitle}>
          {QUICK_PRESETS.map(mins => (
            <button
              key={mins}
              type="button"
              className={`choice-chip ${safeMinutes === mins ? "active" : ""}`}
              aria-pressed={safeMinutes === mins}
              onClick={() => onChange(mins)}
            >
              {formatTaskDuration(mins, language)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
