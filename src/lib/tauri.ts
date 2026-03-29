import { invoke } from "@tauri-apps/api/core";
import type { SystemStats } from "../types";

export const getSystemStats = (): Promise<SystemStats> =>
  invoke<SystemStats>("get_system_stats");

export const setTrayState = (state: "focus" | "break" | "idle"): Promise<void> =>
  invoke("set_tray_state", { state });

export const syncPinWindow = (pinned: boolean): Promise<void> =>
  invoke("sync_pin_window", { pinned });
