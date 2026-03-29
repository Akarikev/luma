/** Decouples Pomodoro phase transitions from Tasks without lifting all hook state. */

import type { PomodoroMode } from "../types";

const FOCUS_SEGMENT_COMPLETE = "luma-focus-segment-complete";
const SESSION_STARTED = "luma-pomodoro-session-started";
const MODE_CHANGED = "luma-pomodoro-mode";

export function emitFocusSegmentComplete(): void {
  window.dispatchEvent(new CustomEvent(FOCUS_SEGMENT_COMPLETE));
}

export function emitPomodoroSessionStarted(): void {
  window.dispatchEvent(new CustomEvent(SESSION_STARTED));
}

export function subscribeFocusSegmentComplete(cb: () => void): () => void {
  const fn = () => cb();
  window.addEventListener(FOCUS_SEGMENT_COMPLETE, fn);
  return () => window.removeEventListener(FOCUS_SEGMENT_COMPLETE, fn);
}

export function subscribePomodoroSessionStarted(cb: () => void): () => void {
  const fn = () => cb();
  window.addEventListener(SESSION_STARTED, fn);
  return () => window.removeEventListener(SESSION_STARTED, fn);
}

export function emitPomodoroMode(mode: PomodoroMode): void {
  window.dispatchEvent(
    new CustomEvent(MODE_CHANGED, { detail: mode })
  );
}

export function subscribePomodoroMode(
  cb: (mode: PomodoroMode) => void
): () => void {
  const fn = (e: Event) => {
    const ce = e as CustomEvent<PomodoroMode>;
    if (ce.detail === "idle" || ce.detail === "focus" || ce.detail === "break") {
      cb(ce.detail);
    }
  };
  window.addEventListener(MODE_CHANGED, fn);
  return () => window.removeEventListener(MODE_CHANGED, fn);
}

const UI_SNAPSHOT = "luma-pomodoro-ui";

export type PomodoroUiSnapshot = {
  mode: PomodoroMode;
  isRunning: boolean;
};

export function emitPomodoroUi(snapshot: PomodoroUiSnapshot): void {
  window.dispatchEvent(new CustomEvent(UI_SNAPSHOT, { detail: snapshot }));
}

export function subscribePomodoroUi(
  cb: (snapshot: PomodoroUiSnapshot) => void
): () => void {
  const fn = (e: Event) => {
    const d = (e as CustomEvent<PomodoroUiSnapshot>).detail;
    if (
      d &&
      (d.mode === "idle" || d.mode === "focus" || d.mode === "break") &&
      typeof d.isRunning === "boolean"
    ) {
      cb(d);
    }
  };
  window.addEventListener(UI_SNAPSHOT, fn);
  return () => window.removeEventListener(UI_SNAPSHOT, fn);
}
