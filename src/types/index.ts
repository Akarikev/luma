export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  /** Lower values appear higher in the list (same as index after sort). */
  sortOrder: number;
  /** Unix-ms timestamp when the reminder should fire. null = no reminder. */
  reminderAt?: number | null;
}

export interface ClipboardEntry {
  id: string;
  text: string;
  timestamp: number;
}

export interface SystemStats {
  cpu: number;
  ram_used: number;
  ram_total: number;
  battery: number | null;
}

export type PomodoroMode = "focus" | "break" | "idle";

export interface PomodoroState {
  mode: PomodoroMode;
  secondsLeft: number;
  sessionCount: number;
  isRunning: boolean;
}

export type DurationUnitPreference = "min" | "hr";

/** Persisted app preferences (store key `appSettings`). */
export interface AppSettings {
  tasksSimpleMode: boolean;
  /** Initial stepper unit when duration is under 60 minutes. */
  defaultDurationUnit: DurationUnitPreference;
  showPomodoro: boolean;
  showClipboard: boolean;
  showSystemStats: boolean;
  remindersEnabled: boolean;
  compactLayout: boolean;
  /** Mouse-move / hover random bubbles; session and task-done bubbles stay on. */
  companionAmbientChatter: boolean;
}
