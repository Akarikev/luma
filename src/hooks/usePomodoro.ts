import { useState, useEffect, useRef, useCallback } from "react";
import type { PomodoroMode, PomodoroState } from "../types";
import { setTrayState } from "../lib/tauri";
import { notify } from "../lib/notifications";
import { storeGet, storeSet } from "../lib/store";
import {
  emitFocusSegmentComplete,
  emitPomodoroMode,
  emitPomodoroSessionStarted,
  emitPomodoroUi,
} from "../lib/pomodoroBridge";

const STORE_FOCUS = "pomodoroFocusMinutes";
const STORE_BREAK = "pomodoroBreakMinutes";

const DEFAULT_FOCUS_MIN = 25;
const DEFAULT_BREAK_MIN = 5;
const MIN_FOCUS = 1;
const MAX_FOCUS = 180;
const MIN_BREAK = 1;
const MAX_BREAK = 120;

function clampFocus(m: number) {
  return Math.min(MAX_FOCUS, Math.max(MIN_FOCUS, Math.round(m)));
}

function clampBreak(m: number) {
  return Math.min(MAX_BREAK, Math.max(MIN_BREAK, Math.round(m)));
}

export function usePomodoro() {
  const focusSecondsRef = useRef(DEFAULT_FOCUS_MIN * 60);
  const breakSecondsRef = useRef(DEFAULT_BREAK_MIN * 60);

  const [focusMinutes, setFocusMinutesState] = useState(DEFAULT_FOCUS_MIN);
  const [breakMinutes, setBreakMinutesState] = useState(DEFAULT_BREAK_MIN);
  const [state, setState] = useState<PomodoroState>({
    mode: "idle",
    secondsLeft: DEFAULT_FOCUS_MIN * 60,
    sessionCount: 0,
    isRunning: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const naturalBreakEndRef = useRef(false);
  const prevPhaseRef = useRef({
    mode: "idle" as PomodoroMode,
    sessionCount: 0,
    isRunning: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fm =
        (await storeGet<number>(STORE_FOCUS)) ?? DEFAULT_FOCUS_MIN;
      const bm =
        (await storeGet<number>(STORE_BREAK)) ?? DEFAULT_BREAK_MIN;
      const fmc = clampFocus(fm);
      const bmc = clampBreak(bm);
      const fs = fmc * 60;
      const bs = bmc * 60;
      if (cancelled) return;
      focusSecondsRef.current = fs;
      breakSecondsRef.current = bs;
      setFocusMinutesState(fmc);
      setBreakMinutesState(bmc);
      setState((s) =>
        s.mode === "idle" && !s.isRunning ? { ...s, secondsLeft: fs } : s
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    emitPomodoroMode(state.mode);
    emitPomodoroUi({ mode: state.mode, isRunning: state.isRunning });
  }, [state.mode, state.isRunning]);

  // Side effects once per real transition (avoids duplicate notify under React Strict
  // Mode, which double-invokes state updater functions in development).
  useEffect(() => {
    const prev = prevPhaseRef.current;
    if (
      prev.mode === "focus" &&
      state.mode === "break" &&
      state.sessionCount > prev.sessionCount
    ) {
      const brMin = Math.max(
        1,
        Math.round(breakSecondsRef.current / 60)
      );
      void notify(
        "Luma",
        `Session ${state.sessionCount} complete! Take a ${brMin}-minute break.`
      );
      void setTrayState("break");
      emitFocusSegmentComplete();
    } else if (
      prev.mode === "break" &&
      state.mode === "idle" &&
      !state.isRunning &&
      naturalBreakEndRef.current
    ) {
      naturalBreakEndRef.current = false;
      void notify("Luma", "Break over. Ready to focus?");
      void setTrayState("idle");
    }
    prevPhaseRef.current = {
      mode: state.mode,
      sessionCount: state.sessionCount,
      isRunning: state.isRunning,
    };
  }, [state.mode, state.sessionCount, state.isRunning]);

  const tick = useCallback(() => {
    setState((prev) => {
      const focusSec = focusSecondsRef.current;
      const breakSec = breakSecondsRef.current;

      if (prev.secondsLeft <= 1) {
        if (prev.mode === "focus") {
          const newCount = prev.sessionCount + 1;
          return {
            mode: "break" as PomodoroMode,
            secondsLeft: breakSec,
            sessionCount: newCount,
            isRunning: true,
          };
        }
        if (prev.mode === "break") {
          naturalBreakEndRef.current = true;
          return {
            mode: "idle" as PomodoroMode,
            secondsLeft: focusSec,
            sessionCount: prev.sessionCount,
            isRunning: false,
          };
        }
      }
      return { ...prev, secondsLeft: prev.secondsLeft - 1 };
    });
  }, []);

  const start = useCallback(() => {
    setState((prev) => {
      const focusSec = focusSecondsRef.current;
      if (prev.mode === "idle") {
        return {
          ...prev,
          mode: "focus" as PomodoroMode,
          secondsLeft: focusSec,
          isRunning: true,
        };
      }
      return { ...prev, mode: "focus" as PomodoroMode, isRunning: true };
    });
    setTrayState("focus");
    emitPomodoroSessionStarted();
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
    setTrayState("idle");
  }, []);

  const reset = useCallback(() => {
    naturalBreakEndRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const focusSec = focusSecondsRef.current;
    setState({
      mode: "idle",
      secondsLeft: focusSec,
      sessionCount: 0,
      isRunning: false,
    });
    setTrayState("idle");
  }, []);

  const setFocusMinutes = useCallback((minutes: number) => {
    const m = clampFocus(minutes);
    const sec = m * 60;
    focusSecondsRef.current = sec;
    setFocusMinutesState(m);
    void storeSet(STORE_FOCUS, m);
    setState((s) =>
      s.mode === "idle" && !s.isRunning ? { ...s, secondsLeft: sec } : s
    );
  }, []);

  const setBreakMinutes = useCallback((minutes: number) => {
    const m = clampBreak(minutes);
    breakSecondsRef.current = m * 60;
    setBreakMinutesState(m);
    void storeSet(STORE_BREAK, m);
  }, []);

  const applyPreset = useCallback((focusM: number, breakM: number) => {
    setFocusMinutes(focusM);
    setBreakMinutes(breakM);
  }, [setFocusMinutes, setBreakMinutes]);

  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, tick]);

  const canEditDurations = !state.isRunning && state.mode === "idle";

  return {
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
    focusSecondsForRing: focusMinutes * 60,
    breakSecondsForRing: breakMinutes * 60,
  };
}
