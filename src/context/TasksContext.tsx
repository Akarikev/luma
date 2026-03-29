import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { storeGet, storeSet } from "../lib/store";
import { notify } from "../lib/notifications";
import {
  subscribeFocusSegmentComplete,
  subscribePomodoroSessionStarted,
} from "../lib/pomodoroBridge";
import { useSettings } from "../hooks/useSettings";
import type { Task } from "../types";

const STORE_TASKS = "tasks";
const STORE_FOCUS = "tasksFocus";

const PENDING_PROMPT_MS = 120_000;

function migrateTasks(list: Task[]): { tasks: Task[]; didMigrate: boolean } {
  if (list.length === 0) return { tasks: list, didMigrate: false };
  const anyMissing = list.some((t) => typeof t.sortOrder !== "number");
  if (!anyMissing) return { tasks: list, didMigrate: false };
  const tasks = [...list]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((t, i) => ({ ...t, sortOrder: i }));
  return { tasks, didMigrate: true };
}

export type TasksContextValue = {
  tasks: Task[];
  focusedTaskId: string | null;
  focusedTask: Task | null;
  pendingFocusComplete: { taskId: string; text: string } | null;
  taskDoneCelebrateToken: number;
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  setFocusedTaskId: (id: string | null) => void;
  toggleFocusedTask: (id: string) => void;
  updateTaskText: (id: string, text: string) => void;
  moveTask: (id: string, direction: "up" | "down") => void;
  setTaskReminder: (id: string, timestamp: number) => void;
  clearTaskReminder: (id: string) => void;
  dismissPendingFocusComplete: () => void;
  confirmPendingFocusComplete: () => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { settings: appSettings } = useSettings();
  const remindersOnRef = useRef(appSettings.remindersEnabled);
  remindersOnRef.current = appSettings.remindersEnabled;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusedTaskId, setFocusedTaskIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [pendingFocusComplete, setPendingFocusComplete] = useState<{
    taskId: string;
    text: string;
  } | null>(null);
  const [taskDoneCelebrateToken, setTaskDoneCelebrateToken] = useState(0);

  const focusedTaskIdRef = useRef<string | null>(null);
  focusedTaskIdRef.current = focusedTaskId;
  const tasksRef = useRef<Task[]>([]);
  tasksRef.current = tasks;

  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimer = useCallback(() => {
    if (pendingTimeoutRef.current != null) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [rawTasks, savedFocus] = await Promise.all([
        storeGet<Task[]>(STORE_TASKS),
        storeGet<string | null>(STORE_FOCUS),
      ]);
      if (cancelled) return;
      const { tasks: migrated, didMigrate } = rawTasks
        ? migrateTasks(rawTasks)
        : { tasks: [] as Task[], didMigrate: false };
      setTasks(migrated);
      if (didMigrate) {
        void storeSet(STORE_TASKS, migrated);
      }
      const focus =
        savedFocus &&
        migrated.some((t) => t.id === savedFocus && !t.completed)
          ? savedFocus
          : null;
      setFocusedTaskIdState(focus);
      focusedTaskIdRef.current = focus;
      if (focus !== savedFocus) {
        void storeSet(STORE_FOCUS, focus);
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const valid =
      focusedTaskId != null &&
      tasks.some((t) => t.id === focusedTaskId && !t.completed);
    if (!valid && focusedTaskId != null) {
      setFocusedTaskIdState(null);
      focusedTaskIdRef.current = null;
      void storeSet(STORE_FOCUS, null);
    }
  }, [tasks, focusedTaskId, hydrated]);

  const setFocusedTaskId = useCallback((id: string | null) => {
    setFocusedTaskIdState((prev) => {
      if (id === null) {
        focusedTaskIdRef.current = null;
        void storeSet(STORE_FOCUS, null);
        return null;
      }
      const ok = tasksRef.current.some((t) => t.id === id && !t.completed);
      if (!ok) return prev;
      focusedTaskIdRef.current = id;
      void storeSet(STORE_FOCUS, id);
      return id;
    });
  }, []);

  const toggleFocusedTask = useCallback(
    (id: string) => {
      const target = tasksRef.current.find((t) => t.id === id);
      if (!target || target.completed) return;
      if (focusedTaskIdRef.current === id) {
        setFocusedTaskId(null);
      } else {
        setFocusedTaskId(id);
      }
    },
    [setFocusedTaskId]
  );

  const addTask = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTasks((prev) => {
      const pending = prev.filter((t) => !t.completed);
      const sortOrder =
        pending.length === 0
          ? 0
          : Math.min(...pending.map((t) => t.sortOrder)) - 1;
      const task: Task = {
        id: crypto.randomUUID(),
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
        sortOrder,
      };
      const updated = [task, ...prev];
      void storeSet(STORE_TASKS, updated);
      return updated;
    });
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      const toggled = updated.find((t) => t.id === id);
      if (!toggled) return prev;
      if (toggled.completed && focusedTaskIdRef.current === id) {
        queueMicrotask(() => {
          setFocusedTaskIdState(null);
          focusedTaskIdRef.current = null;
          void storeSet(STORE_FOCUS, null);
        });
      }
      void storeSet(STORE_TASKS, updated);
      return updated;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      if (focusedTaskIdRef.current === id) {
        queueMicrotask(() => {
          setFocusedTaskIdState(null);
          focusedTaskIdRef.current = null;
          void storeSet(STORE_FOCUS, null);
        });
      }
      void storeSet(STORE_TASKS, updated);
      return updated;
    });
    setPendingFocusComplete((p) => (p?.taskId === id ? null : p));
  }, []);

  const updateTaskText = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, text: trimmed } : t
      );
      void storeSet(STORE_TASKS, updated);
      return updated;
    });
  }, []);

  const moveTask = useCallback((id: string, direction: "up" | "down") => {
    setTasks((prev) => {
      const pending = prev
        .filter((t) => !t.completed)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const idx = pending.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= pending.length) return prev;
      const a = pending[idx];
      const b = pending[swapWith];
      const updated = prev.map((t) => {
        if (t.id === a.id) return { ...t, sortOrder: b.sortOrder };
        if (t.id === b.id) return { ...t, sortOrder: a.sortOrder };
        return t;
      });
      void storeSet(STORE_TASKS, updated);
      return updated;
    });
  }, []);

  const setTaskReminder = useCallback((id: string, timestamp: number) => {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, reminderAt: timestamp } : t
      );
      void storeSet(STORE_TASKS, updated);
      return updated;
    });
  }, []);

  const clearTaskReminder = useCallback((id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, reminderAt: null } : t
      );
      void storeSet(STORE_TASKS, updated);
      return updated;
    });
  }, []);

  // Fire notifications for due reminders every 15s.
  // Read from ref (not inside a setState updater) so notify() can't be
  // double-invoked by React 18 Strict Mode.
  useEffect(() => {
    if (!hydrated) return;
    const tid = window.setInterval(() => {
      const now = Date.now();
      const cur = tasksRef.current;
      const due = cur.filter(
        (t) =>
          !t.completed &&
          typeof t.reminderAt === "number" &&
          t.reminderAt > 0 &&
          t.reminderAt <= now
      );
      if (due.length === 0) return;
      const dueIds = new Set(due.map((d) => d.id));
      if (remindersOnRef.current) {
        for (const t of due) {
          void notify("Luma · Reminder", t.text);
        }
      }
      setTasks((prev) => {
        const updated = prev.map((t) =>
          dueIds.has(t.id) ? { ...t, reminderAt: null } : t
        );
        void storeSet(STORE_TASKS, updated);
        return updated;
      });
    }, 15_000);
    return () => clearInterval(tid);
  }, [hydrated]);

  const dismissPendingFocusComplete = useCallback(() => {
    clearPendingTimer();
    setPendingFocusComplete(null);
  }, [clearPendingTimer]);

  const confirmPendingFocusComplete = useCallback(() => {
    setPendingFocusComplete((p) => {
      if (!p) return null;
      const id = p.taskId;
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === id ? { ...t, completed: true } : t
        );
        if (focusedTaskIdRef.current === id) {
          queueMicrotask(() => {
            setFocusedTaskIdState(null);
            focusedTaskIdRef.current = null;
            void storeSet(STORE_FOCUS, null);
          });
        }
        void storeSet(STORE_TASKS, updated);
        return updated;
      });
      queueMicrotask(() => setTaskDoneCelebrateToken((n) => n + 1));
      return null;
    });
    clearPendingTimer();
  }, [clearPendingTimer]);

  useEffect(() => {
    if (!hydrated) return;
    const unsubComplete = subscribeFocusSegmentComplete(() => {
      const fid = focusedTaskIdRef.current;
      if (!fid) return;
      const t = tasksRef.current.find((x) => x.id === fid);
      if (t && !t.completed) {
        setPendingFocusComplete({ taskId: t.id, text: t.text });
      }
    });
    const unsubStart = subscribePomodoroSessionStarted(() => {
      clearPendingTimer();
      setPendingFocusComplete(null);
    });
    return () => {
      unsubComplete();
      unsubStart();
    };
  }, [hydrated, clearPendingTimer]);

  useEffect(() => {
    if (!pendingFocusComplete) {
      clearPendingTimer();
      return;
    }
    clearPendingTimer();
    pendingTimeoutRef.current = window.setTimeout(() => {
      setPendingFocusComplete(null);
      pendingTimeoutRef.current = null;
    }, PENDING_PROMPT_MS);
    return clearPendingTimer;
  }, [pendingFocusComplete, clearPendingTimer]);

  const focusedTask = useMemo(() => {
    if (focusedTaskId == null) return null;
    const t = tasks.find((x) => x.id === focusedTaskId);
    return t && !t.completed ? t : null;
  }, [tasks, focusedTaskId]);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      focusedTaskId,
      focusedTask,
      pendingFocusComplete,
      taskDoneCelebrateToken,
      addTask,
      toggleTask,
      deleteTask,
      setFocusedTaskId,
      toggleFocusedTask,
      updateTaskText,
      moveTask,
      setTaskReminder,
      clearTaskReminder,
      dismissPendingFocusComplete,
      confirmPendingFocusComplete,
    }),
    [
      tasks,
      focusedTaskId,
      focusedTask,
      pendingFocusComplete,
      taskDoneCelebrateToken,
      addTask,
      toggleTask,
      deleteTask,
      setFocusedTaskId,
      toggleFocusedTask,
      updateTaskText,
      moveTask,
      setTaskReminder,
      clearTaskReminder,
      dismissPendingFocusComplete,
      confirmPendingFocusComplete,
    ]
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasks must be used within TasksProvider");
  }
  return ctx;
}
