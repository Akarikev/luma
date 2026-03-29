import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Timer, Minus, Plus } from "lucide-react";
import { usePomodoro } from "../hooks/usePomodoro";
import { useTasks } from "../hooks/useTasks";
import { useSettings } from "../hooks/useSettings";
import { SectionCard } from "./SectionCard";
import { LumaCompanion } from "./LumaCompanion";

const RADIUS = 48;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

type DurationUnit = "min" | "hr";

type DurationStepperProps = {
  label: string;
  /** Always in minutes */
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  /** When duration is under one hour, the stepper opens in this unit */
  defaultUnit?: DurationUnit;
  /** Emits total minutes */
  onChange: (v: number) => void;
};

function DurationStepper({
  label,
  value,
  min,
  max,
  disabled,
  defaultUnit = "min",
  onChange,
}: DurationStepperProps) {
  const [unit, setUnit] = useState<DurationUnit>(() =>
    value >= 60 ? "hr" : defaultUnit
  );
  useEffect(() => {
    if (value < 60) setUnit(defaultUnit);
  }, [defaultUnit, value]);
  const border = "#2a2a2e";
  const btnIdle = "#141416";
  const btnHover = "#1e1e22";

  const display = unit === "hr" ? +(value / 60).toFixed(1) : value;
  const stepSize = unit === "hr" ? 60 : 1;

  const clampMin = (totalMin: number) =>
    Math.min(max, Math.max(min, Math.round(totalMin)));

  const step = (d: number) => onChange(clampMin(value + d * stepSize));

  const toggleUnit = () => {
    if (disabled) return;
    setUnit((u) => (u === "min" ? "hr" : "min"));
  };

  const canDec = value > min;
  const canInc = value < max;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="text-xs shrink-0 w-[42px]"
        style={{ color: "#71717a" }}
      >
        {label}
      </span>
      <div
        className="flex items-stretch rounded-lg overflow-hidden shrink-0"
        style={{
          border: `1px solid ${border}`,
          background: "#0f0f11",
          opacity: disabled ? 0.65 : 1,
        }}
      >
        <button
          type="button"
          disabled={disabled || !canDec}
          aria-label={`Decrease ${label}`}
          className="flex items-center justify-center px-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-35"
          style={{
            background: btnIdle,
            color: "#a1a1aa",
            borderRight: `1px solid ${border}`,
          }}
          onMouseEnter={(e) => {
            if ((e.currentTarget as HTMLButtonElement).disabled) return;
            (e.currentTarget as HTMLElement).style.background = btnHover;
            (e.currentTarget as HTMLElement).style.color = "#e4e4e7";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = btnIdle;
            (e.currentTarget as HTMLElement).style.color = "#a1a1aa";
          }}
          onClick={() => step(-1)}
        >
          <Minus size={13} strokeWidth={2.25} />
        </button>
        <input
          type="number"
          aria-label={`${label} ${unit === "hr" ? "hours" : "minutes"}`}
          className="luma-duration-input w-10 py-1.5 text-center text-xs tabular-nums outline-none bg-transparent border-0 text-[#e4e4e7] disabled:cursor-not-allowed"
          disabled={disabled}
          value={display}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return;
            const v = Number(raw);
            if (!Number.isFinite(v)) return;
            const totalMin = unit === "hr" ? Math.round(v * 60) : v;
            onChange(clampMin(totalMin));
          }}
        />
        <button
          type="button"
          disabled={disabled || !canInc}
          aria-label={`Increase ${label}`}
          className="flex items-center justify-center px-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-35"
          style={{
            background: btnIdle,
            color: "#a1a1aa",
            borderLeft: `1px solid ${border}`,
          }}
          onMouseEnter={(e) => {
            if ((e.currentTarget as HTMLButtonElement).disabled) return;
            (e.currentTarget as HTMLElement).style.background = btnHover;
            (e.currentTarget as HTMLElement).style.color = "#e4e4e7";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = btnIdle;
            (e.currentTarget as HTMLElement).style.color = "#a1a1aa";
          }}
          onClick={() => step(1)}
        >
          <Plus size={13} strokeWidth={2.25} />
        </button>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={toggleUnit}
        className="text-[10px] shrink-0 cursor-pointer transition-colors disabled:cursor-not-allowed"
        style={{ color: "#52525b" }}
        title={`Switch to ${unit === "min" ? "hours" : "minutes"}`}
        onMouseEnter={(e) => {
          if ((e.currentTarget as HTMLButtonElement).disabled) return;
          (e.currentTarget as HTMLElement).style.color = "#a78bfa";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#52525b";
        }}
      >
        {unit}
      </button>
    </div>
  );
}

export function PomodoroTimer() {
  const { settings } = useSettings();
  const {
    state,
    start,
    pause,
    reset,
    focusMinutes,
    breakMinutes,
    setFocusMinutes,
    setBreakMinutes,
    applyPreset,
    canEditDurations,
    focusSecondsForRing,
    breakSecondsForRing,
  } = usePomodoro();

  const { taskDoneCelebrateToken } = useTasks();

  const totalSeconds =
    state.mode === "break" ? breakSecondsForRing : focusSecondsForRing;
  const progress =
    totalSeconds > 0 ? 1 - state.secondsLeft / totalSeconds : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, progress)));

  const ringColor =
    state.mode === "focus"
      ? "#7c3aed"
      : state.mode === "break"
        ? "#f59e0b"
        : "#3f3f46";

  const btnColor =
    state.mode === "break" ? "#d97706" : "#7c3aed";

  const showHours = state.secondsLeft >= 3600;
  const ringSize = showHours ? "w-36 h-36" : "w-28 h-28";
  const timeTextSize = showHours ? "text-xl" : "text-2xl";

  return (
    <SectionCard title="Focus Timer" icon={<Timer size={13} />}>
      <div className="flex flex-col items-center gap-3">
        <LumaCompanion
          mode={state.mode}
          isRunning={state.isRunning}
          sessionCount={state.sessionCount}
          secondsLeft={state.secondsLeft}
          segmentTotalSeconds={
            state.mode === "break"
              ? breakSecondsForRing
              : focusSecondsForRing
          }
          taskDoneCelebrateToken={taskDoneCelebrateToken}
          ambientChatterEnabled={settings.companionAmbientChatter}
        />

        <div className={`relative ${ringSize}`} style={{ transition: "width 0.3s ease, height 0.3s ease" }}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
            <circle
              cx="55"
              cy="55"
              r={RADIUS}
              fill="none"
              stroke="#1e1e22"
              strokeWidth="7"
            />
            <circle
              cx="55"
              cy="55"
              r={RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dashoffset 1s linear, stroke 0.5s ease",
                filter: state.isRunning
                  ? `drop-shadow(0 0 6px ${ringColor})`
                  : "none",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-mono ${timeTextSize} font-bold tabular-nums`}
              style={{ color: "#f4f4f5", transition: "font-size 0.3s ease" }}
            >
              {formatTime(state.secondsLeft)}
            </span>
            <span
              className="text-xs capitalize mt-0.5"
              style={{ color: "#71717a" }}
            >
              {state.mode === "idle" ? "ready" : state.mode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="p-2 rounded-xl transition-colors cursor-pointer"
            style={{ background: "#1e1e22", color: "#71717a" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#2a2a2e";
              (e.currentTarget as HTMLElement).style.color = "#d4d4d8";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#1e1e22";
              (e.currentTarget as HTMLElement).style.color = "#71717a";
            }}
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            onClick={state.isRunning ? pause : start}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
            style={{ background: btnColor }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = "1";
            }}
          >
            {state.isRunning ? (
              <>
                <Pause size={13} /> Pause
              </>
            ) : (
              <>
                <Play size={13} />{" "}
                {state.mode === "idle" ? "Start" : "Resume"}
              </>
            )}
          </button>
        </div>

        <div
          className="w-full rounded-xl px-3 py-2 flex flex-col gap-2"
          style={{ background: "#121214", border: "1px solid #1e1e22" }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider shrink-0" style={{ color: "#52525b" }}>
              Session
            </span>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {[
                { label: "25 / 5", f: 25, b: 5 },
                { label: "50 / 10", f: 50, b: 10 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  disabled={!canEditDurations}
                  onClick={() => applyPreset(p.f, p.b)}
                  className="text-[10px] px-2 py-1 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    background: "#1e1e22",
                    color: "#a1a1aa",
                    border: "1px solid #2a2a2e",
                  }}
                  onMouseEnter={(e) => {
                    if ((e.currentTarget as HTMLButtonElement).disabled) return;
                    (e.currentTarget as HTMLElement).style.background =
                      "#2a2140";
                    (e.currentTarget as HTMLElement).style.color = "#c4b5fd";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "#1e1e22";
                    (e.currentTarget as HTMLElement).style.color = "#a1a1aa";
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 px-0.5"
            style={{ color: "#71717a" }}
          >
            <DurationStepper
              label="Focus"
              value={focusMinutes}
              min={1}
              max={180}
              disabled={!canEditDurations}
              defaultUnit={settings.defaultDurationUnit}
              onChange={setFocusMinutes}
            />
            <span className="text-[#3f3f46] select-none leading-none pb-0.5" aria-hidden>
              ·
            </span>
            <DurationStepper
              label="Break"
              value={breakMinutes}
              min={1}
              max={120}
              disabled={!canEditDurations}
              defaultUnit={settings.defaultDurationUnit}
              onChange={setBreakMinutes}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                background:
                  i < state.sessionCount % 4 ? "#7c3aed" : "#27272a",
                boxShadow:
                  i < state.sessionCount % 4
                    ? "0 0 6px rgba(124,58,237,0.6)"
                    : "none",
              }}
            />
          ))}
          <span className="text-xs ml-1.5" style={{ color: "#52525b" }}>
            {state.sessionCount} session{state.sessionCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
