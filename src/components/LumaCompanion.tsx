import { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useAnimationControls,
  AnimatePresence,
} from "framer-motion";
import type { PomodoroMode } from "../types";
import {
  DIZZY_CHATTER,
  EYE_HOVER_CHATTER,
  MOVE_CHATTER,
  TASK_DONE_CHATTER,
  pickRandom,
} from "../data/companionChatter";

/** px/s — bursts above this can trigger dizzy lines. */
const FAST_POINTER_PX_PER_S = 2_450;
const MOVE_CHATTER_MIN_GAP_MS = 5_600;
const MOVE_CHATTER_SAMPLE_MS = 240;
const MOVE_CHATTER_ROLL = 0.018;
const DIZZY_MIN_GAP_MS = 6_000;
const DIZZY_AFTER_ANY_BUBBLE_MS = 2_400;
const DIZZY_CHANCE = 0.42;
const EYE_HOVER_MIN_GAP_MS = 7_200;
const EYE_HOVER_SHOW_CHANCE = 0.42;
const TASK_DONE_CELEBRATION_MIN_GAP_MS = 5_500;

type Props = {
  mode: PomodoroMode;
  isRunning: boolean;
  sessionCount: number;
  secondsLeft: number;
  segmentTotalSeconds: number;
  /** Increments when user confirms completing the focused task after a Pomodoro. */
  taskDoneCelebrateToken?: number;
  /** Pointer-move / eye-hover chatter; session and task-done bubbles stay on. */
  ambientChatterEnabled?: boolean;
};

/** Max pupil shift (px); pet-local tracking makes small values read clearly. */
const MAX_EYE_SHIFT_X = 4;
const MAX_EYE_SHIFT_Y = 2.8;

export function LumaCompanion({
  mode,
  isRunning,
  sessionCount,
  secondsLeft,
  segmentTotalSeconds,
  taskDoneCelebrateToken = 0,
  ambientChatterEnabled = true,
}: Props) {
  /** Face bounds (72×56) — NOT the full-width row — so gaze matches the creature. */
  const faceTrackRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const prevSessionRef = useRef(sessionCount);
  const prevTaskDoneTokenRef = useRef(0);
  const [celebrateToken, setCelebrateToken] = useState(0);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const lookAccRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const [isBlinking, setIsBlinking] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBubbleAtRef = useRef(0);
  const lastMoveChatterSampleRef = useRef(0);
  const lastEyeHoverBubbleRef = useRef(0);
  const lastDizzyBubbleRef = useRef(0);
  const pointerVelRef = useRef<{ x: number; y: number; t: number } | null>(
    null
  );
  const lastPhraseRef = useRef<string | null>(null);
  const bubbleOpenRef = useRef(false);

  const almostDone =
    isRunning &&
    (mode === "focus" || mode === "break") &&
    segmentTotalSeconds > 0 &&
    secondsLeft > 0 &&
    secondsLeft <= Math.max(10, segmentTotalSeconds * 0.12);

  const clearBubbleTimer = useCallback(() => {
    if (bubbleTimeoutRef.current != null) {
      clearTimeout(bubbleTimeoutRef.current);
      bubbleTimeoutRef.current = null;
    }
  }, []);

  const showBubble = useCallback((text: string, durationMs?: number) => {
    clearBubbleTimer();
    lastPhraseRef.current = text;
    bubbleOpenRef.current = true;
    setBubbleText(text);
    const ms =
      durationMs ?? 1_900 + Math.random() * 750;
    bubbleTimeoutRef.current = window.setTimeout(() => {
      bubbleOpenRef.current = false;
      setBubbleText(null);
      bubbleTimeoutRef.current = null;
    }, ms);
  }, [clearBubbleTimer]);

  const showBubbleFnRef = useRef(showBubble);
  showBubbleFnRef.current = showBubble;

  useEffect(() => () => clearBubbleTimer(), [clearBubbleTimer]);

  const tryMoveChatter = useCallback(() => {
    const now = Date.now();
    if (bubbleOpenRef.current) return;
    if (now - lastBubbleAtRef.current < MOVE_CHATTER_MIN_GAP_MS) return;
    if (now - lastMoveChatterSampleRef.current < MOVE_CHATTER_SAMPLE_MS)
      return;
    lastMoveChatterSampleRef.current = now;
    if (Math.random() > MOVE_CHATTER_ROLL) return;
    const line = pickRandom(MOVE_CHATTER, lastPhraseRef.current ?? undefined);
    lastPhraseRef.current = line;
    lastBubbleAtRef.current = now;
    showBubbleFnRef.current(line);
  }, []);

  const tryDizzyChatter = useCallback((e: MouseEvent) => {
    const now = performance.now();
    const prev = pointerVelRef.current;
    pointerVelRef.current = {
      x: e.clientX,
      y: e.clientY,
      t: now,
    };
    if (!prev) return;
    const dt = now - prev.t;
    if (dt < 8 || dt > 140) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    const speed = (Math.hypot(dx, dy) / dt) * 1000;
    if (speed < FAST_POINTER_PX_PER_S) return;
    if (bubbleOpenRef.current) return;
    const wall = Date.now();
    if (wall - lastDizzyBubbleRef.current < DIZZY_MIN_GAP_MS) return;
    if (wall - lastBubbleAtRef.current < DIZZY_AFTER_ANY_BUBBLE_MS) return;
    if (Math.random() > DIZZY_CHANCE) return;
    const line = pickRandom(DIZZY_CHATTER, lastPhraseRef.current ?? undefined);
    lastPhraseRef.current = line;
    lastDizzyBubbleRef.current = wall;
    lastBubbleAtRef.current = wall;
    showBubbleFnRef.current(line, 1_750 + Math.random() * 500);
  }, []);

  const handleEyeHover = useCallback(() => {
    if (Math.random() > EYE_HOVER_SHOW_CHANCE) return;
    const now = Date.now();
    if (now - lastEyeHoverBubbleRef.current < EYE_HOVER_MIN_GAP_MS) return;
    if (now - lastBubbleAtRef.current < 900) return;
    lastEyeHoverBubbleRef.current = now;
    lastBubbleAtRef.current = now;
    const line = pickRandom(
      EYE_HOVER_CHATTER,
      lastPhraseRef.current ?? undefined
    );
    lastPhraseRef.current = line;
    showBubbleFnRef.current(line);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = faceTrackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const halfW = Math.max(r.width / 2, 1);
      const halfH = Math.max(r.height / 2, 1);
      const normX = (e.clientX - cx) / (halfW * 0.72);
      const normY = (e.clientY - cy) / (halfH * 0.85);
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      lookAccRef.current = {
        x: clamp(normX) * MAX_EYE_SHIFT_X,
        y: clamp(normY) * MAX_EYE_SHIFT_Y,
      };
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          setLook({ ...lookAccRef.current });
        });
      }
      if (ambientChatterEnabled) {
        tryDizzyChatter(e);
        tryMoveChatter();
      }
    },
    [tryDizzyChatter, tryMoveChatter, ambientChatterEnabled]
  );

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [onMouseMove]);

  useEffect(() => {
    let cancelled = false;
    let tid: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const active = isRunning && (mode === "focus" || mode === "break");
      const minMs = active ? 1900 : 2600;
      const maxMs = active ? 4200 : 6200;
      const delay = minMs + Math.random() * (maxMs - minMs);
      tid = window.setTimeout(() => {
        if (cancelled) return;
        setIsBlinking(true);
        window.setTimeout(() => {
          if (!cancelled) setIsBlinking(false);
        }, 120);
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, [isRunning, mode]);

  useEffect(() => {
    if (
      sessionCount > prevSessionRef.current &&
      mode === "break"
    ) {
      setCelebrateToken((t) => t + 1);
    }
    prevSessionRef.current = sessionCount;
  }, [sessionCount, mode]);

  useEffect(() => {
    if (celebrateToken === 0) return;
    void controls.start({
      scale: [1, 1.18, 1],
      rotate: [0, -8, 8, 0],
      transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] },
    });
  }, [celebrateToken, controls]);

  useEffect(() => {
    if (taskDoneCelebrateToken <= prevTaskDoneTokenRef.current) return;
    prevTaskDoneTokenRef.current = taskDoneCelebrateToken;
    const now = Date.now();
    if (now - lastBubbleAtRef.current < TASK_DONE_CELEBRATION_MIN_GAP_MS) {
      return;
    }
    if (bubbleOpenRef.current) return;
    const line = pickRandom(
      TASK_DONE_CHATTER,
      lastPhraseRef.current ?? undefined
    );
    lastPhraseRef.current = line;
    lastBubbleAtRef.current = now;
    showBubbleFnRef.current(line, 2_000 + Math.random() * 400);
  }, [taskDoneCelebrateToken]);

  const palette =
    mode === "focus"
      ? {
          body: "#1e1530",
          rim: "#7c3aed",
          glow: "rgba(124,58,237,0.45)",
          eye: "#e9d5ff",
        }
      : mode === "break"
        ? {
            body: "#1f170d",
            rim: "#f59e0b",
            glow: "rgba(245,158,11,0.35)",
            eye: "#fde68a",
          }
        : {
            body: "#141418",
            rim: "#3f3f46",
            glow: "rgba(124,58,237,0.12)",
            eye: "#a1a1aa",
          };

  const floatSpeed = mode === "break" ? 2.8 : mode === "focus" ? 2.2 : 3.2;
  const pulseScale =
    almostDone
      ? [1, 1.06, 1]
      : mode === "focus" && isRunning
        ? [1, 1.04, 1]
        : [1, 1.02, 1];
  const pulseDuration = almostDone ? 0.75 : mode === "break" ? 1.4 : mode === "focus" && isRunning ? 1.1 : 2;

  const rimHue =
    almostDone && mode === "focus"
      ? "#a78bfa"
      : almostDone && mode === "break"
        ? "#fcd34d"
        : palette.rim;

  const glowBoost =
    almostDone && mode === "focus"
      ? "rgba(167,139,250,0.55)"
      : almostDone && mode === "break"
        ? "rgba(252,211,77,0.45)"
        : palette.glow;

  const eyeAnim = isBlinking
    ? { scaleX: 1, scaleY: 0.12 }
    : almostDone
      ? { scaleX: 1.08, scaleY: 0.88 }
      : { scaleX: 1, scaleY: 1 };

  const eyeTransitionLeft = isBlinking
    ? { duration: 0.055 }
    : almostDone
      ? { type: "spring" as const, stiffness: 300, damping: 18 }
      : { duration: 0.2 };

  const eyeTransitionRight = isBlinking
    ? { duration: 0.055, delay: 0.028 }
    : almostDone
      ? { type: "spring" as const, stiffness: 300, damping: 18 }
      : { duration: 0.2 };

  return (
    <motion.div
      className="flex justify-center w-full select-none"
      animate={{ y: [0, almostDone ? -5 : -4, 0] }}
      transition={{
        duration: almostDone ? 0.9 : floatSpeed,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="relative flex flex-col items-center pt-1">
        <AnimatePresence>
          {bubbleText && (
            <motion.div
              key={bubbleText}
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 6, scale: 0.94, x: "-50%" }}
              animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
              exit={{ opacity: 0, y: 3, scale: 0.94, x: "-50%" }}
              transition={{ type: "spring", stiffness: 460, damping: 32 }}
              className="pointer-events-none absolute z-30 min-w-[72px] max-w-[150px] px-2 py-1.5 text-center text-[9px] font-bold leading-tight tracking-tight"
              style={{
                left: "50%",
                bottom: "calc(100% + 6px)",
                background: "#fffef5",
                color: "#18181b",
                border: "2px solid #18181b",
                borderRadius: "10px 10px 10px 4px",
                boxShadow: "2px 2px 0 #18181b",
              }}
            >
              {bubbleText}
              <span
                className="absolute left-1/2 bottom-0 block h-2 w-2 -translate-x-1/2 translate-y-1/2 rotate-45 border-r-2 border-b-2 border-[#18181b] bg-[#fffef5]"
                style={{ boxSizing: "border-box" }}
                aria-hidden
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          ref={faceTrackRef}
          animate={controls}
          className="relative z-10"
          style={{ width: 72, height: 56 }}
        >
          <motion.div
            className="absolute inset-0 rounded-[46%] rounded-t-[48%]"
            style={{
              background: palette.body,
              border: `2px solid ${rimHue}`,
              boxShadow: `0 0 ${almostDone ? 26 : 20}px ${glowBoost}, inset 0 2px 12px rgba(255,255,255,0.04)`,
            }}
            animate={{ scale: pulseScale }}
            transition={{
              duration: pulseDuration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute left-0 right-0 flex justify-center gap-2.5 px-2 py-1.5 cursor-default"
            style={{
              top: 12,
              zIndex: 2,
              willChange: "transform",
            }}
            animate={{ x: look.x, y: look.y }}
            transition={{
              type: "spring",
              stiffness: 640,
              damping: 36,
              mass: 0.22,
            }}
            onPointerEnter={ambientChatterEnabled ? handleEyeHover : undefined}
          >
            <motion.span
              className="rounded-full block origin-center"
              style={{
                width: 9,
                height: 11,
                background: palette.eye,
                opacity: 0.95,
              }}
              animate={eyeAnim}
              transition={eyeTransitionLeft}
            />
            <motion.span
              className="rounded-full block origin-center"
              style={{
                width: 9,
                height: 11,
                background: palette.eye,
                opacity: 0.95,
              }}
              animate={eyeAnim}
              transition={eyeTransitionRight}
            />
          </motion.div>
          <motion.div
            className="absolute rounded-full left-1/2 -translate-x-1/2 origin-center pointer-events-none"
            style={{
              width: 10,
              height: almostDone ? 6 : 5,
              bottom: almostDone ? 12 : 14,
              background: almostDone ? rimHue : palette.rim,
              opacity: mode === "break" ? 0.85 : almostDone ? 0.9 : 0.35,
              borderRadius: almostDone ? "40% 40% 50% 50% / 35% 35% 70% 70%" : "9999px",
            }}
            animate={
              almostDone
                ? { scaleX: 1.45, scaleY: 1.05, y: [0, 0.8, 0] }
                : { scaleX: mode === "break" ? [1, 1.15, 1] : 1, scaleY: 1 }
            }
            transition={
              almostDone
                ? {
                    scaleX: { type: "spring", stiffness: 280, damping: 16 },
                    scaleY: { type: "spring", stiffness: 280, damping: 16 },
                    y: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
                  }
                : {
                    duration: 1.2,
                    repeat: mode === "break" ? Infinity : 0,
                    ease: "easeInOut",
                  }
            }
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
