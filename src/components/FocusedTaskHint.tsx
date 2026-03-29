import { useEffect, useState } from "react";
import { useTasks } from "../hooks/useTasks";
import {
  subscribePomodoroUi,
  type PomodoroUiSnapshot,
} from "../lib/pomodoroBridge";

/**
 * Shows the current focus task while you’re on the ready screen (idle, timer not running).
 * Hidden as soon as a session is active so the timer UI stays clean.
 */
export function FocusedTaskHint() {
  const { focusedTask } = useTasks();
  const [ui, setUi] = useState<PomodoroUiSnapshot>({
    mode: "idle",
    isRunning: false,
  });

  useEffect(() => {
    return subscribePomodoroUi(setUi);
  }, []);

  const show =
    focusedTask != null && ui.mode === "idle" && !ui.isRunning;

  if (!show) return null;

  return (
    <div
      className="rounded-xl px-3 py-2.5 min-h-[40px] flex items-center gap-2 shrink-0"
      style={{
        background: "rgba(124,58,237,0.08)",
        border: "1px solid rgba(124,58,237,0.22)",
      }}
    >
      <span
        className="text-[10px] uppercase tracking-wide font-semibold shrink-0"
        style={{ color: "#a78bfa" }}
      >
        Next focus
      </span>
      <span
        className="text-xs truncate min-w-0 flex-1 leading-snug"
        style={{ color: "#e4e4e7" }}
        title={focusedTask.text}
      >
        {focusedTask.text}
      </span>
    </div>
  );
}
