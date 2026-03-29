import type { AppSettings } from "../types";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  tasksSimpleMode: false,
  defaultDurationUnit: "min",
  showPomodoro: true,
  showClipboard: true,
  showSystemStats: true,
  remindersEnabled: true,
  compactLayout: false,
  companionAmbientChatter: true,
};

export function mergeAppSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_APP_SETTINGS };
  const o = raw as Record<string, unknown>;
  return {
    tasksSimpleMode:
      o.tasksSimpleMode === true ? true : DEFAULT_APP_SETTINGS.tasksSimpleMode,
    defaultDurationUnit:
      o.defaultDurationUnit === "hr" ? "hr" : "min",
    showPomodoro:
      o.showPomodoro === false ? false : DEFAULT_APP_SETTINGS.showPomodoro,
    showClipboard:
      o.showClipboard === false ? false : DEFAULT_APP_SETTINGS.showClipboard,
    showSystemStats:
      o.showSystemStats === false ? false : DEFAULT_APP_SETTINGS.showSystemStats,
    remindersEnabled:
      o.remindersEnabled === false ? false : DEFAULT_APP_SETTINGS.remindersEnabled,
    compactLayout:
      o.compactLayout === true ? true : DEFAULT_APP_SETTINGS.compactLayout,
    companionAmbientChatter:
      o.companionAmbientChatter === false
        ? false
        : DEFAULT_APP_SETTINGS.companionAmbientChatter,
  };
}
