import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BadgeAlert, Minimize2, Pin, PinOff, Settings } from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openUrl } from "@tauri-apps/plugin-opener";
import { FocusedTaskHint } from "./components/FocusedTaskHint";
import { LumaMascotIcon } from "./components/LumaMascotIcon";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { TaskList } from "./components/TaskList";
import { TasksProvider } from "./hooks/useTasks";
import { ClipboardHistory } from "./components/ClipboardHistory";
import { SystemStats } from "./components/SystemStats";
import { SettingsPanel } from "./components/SettingsPanel";
import { UpdateBanner } from "./components/UpdateBanner";
import { useSettings } from "./hooks/useSettings";
import {
  getNotifiedReleaseTag,
  getUpdateUiState,
  RELEASES_LATEST_URL,
  setNotifiedReleaseTag,
  updateAvailableNotificationBody,
} from "./lib/updateCheck";
import { notify } from "./lib/notifications";
import { storeGet, storeSet } from "./lib/store";
import { subscribePomodoroMode } from "./lib/pomodoroBridge";
import { syncPinWindow } from "./lib/tauri";
import type { PomodoroMode } from "./types";
import "./App.css";

const PIN_STORE_KEY = "pinWindow";

export default function App() {
  const { settings } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pinReady, setPinReady] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<PomodoroMode>("idle");
  const [updateAvailableTag, setUpdateAvailableTag] = useState<string | null>(
    null
  );
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await storeGet<boolean>(PIN_STORE_KEY);
      const value = saved === true;
      if (!cancelled) {
        setPinned(value);
        try {
          await syncPinWindow(value);
        } catch {
          /* dev without tauri */
        }
        setPinReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribePomodoroMode(setPomodoroMode);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await getVersion();
        const state = await getUpdateUiState(v);
        if (cancelled || !state) {
          if (!cancelled) {
            setUpdateAvailableTag(null);
            setShowUpdateBanner(false);
          }
          return;
        }
        const { latestTag, showBanner } = state;
        if (getNotifiedReleaseTag() !== latestTag) {
          await notify("Luma", updateAvailableNotificationBody(latestTag));
          setNotifiedReleaseTag(latestTag);
        }
        setUpdateAvailableTag(latestTag);
        setShowUpdateBanner(showBanner);
      } catch {
        if (!cancelled) {
          setUpdateAvailableTag(null);
          setShowUpdateBanner(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openDownloadsPage = useCallback(() => {
    void openUrl(RELEASES_LATEST_URL);
  }, []);

  const togglePin = useCallback(async () => {
    const next = !pinned;
    setPinned(next);
    await storeSet(PIN_STORE_KEY, next);
    try {
      await syncPinWindow(next);
    } catch {
      /* ignore */
    }
  }, [pinned]);

  const hideToTray = useCallback(() => {
    void getCurrentWindow().hide();
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <TasksProvider>
    <div className="relative w-full h-full min-h-0" style={{ background: "transparent" }}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-0 w-full h-full flex flex-col rounded-2xl"
        style={{
          background: "#0d0d0f",
          border: "1px solid #1e1e22",
          filter:
            "drop-shadow(0 32px 48px rgba(0,0,0,0.88)) drop-shadow(0 12px 28px rgba(0,0,0,0.55))",
        }}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-2xl">
        {showUpdateBanner && updateAvailableTag && (
          <UpdateBanner
            latestTag={updateAvailableTag}
            onDismiss={() => setShowUpdateBanner(false)}
          />
        )}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid #1a1a1e" }}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1 py-0.5">
            <LumaMascotIcon
              variant={pomodoroMode}
              size={24}
              title="Luma"
              style={{
                filter:
                  pomodoroMode === "focus"
                    ? "drop-shadow(0 0 6px rgba(124,58,237,0.5))"
                    : pomodoroMode === "break"
                      ? "drop-shadow(0 0 6px rgba(245,158,11,0.45))"
                      : "none",
              }}
            />
            <span
              className="text-sm font-semibold tracking-tight truncate"
              style={{ color: "#f4f4f5" }}
            >
              Luma
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {updateAvailableTag && (
              <button
                type="button"
                onClick={openDownloadsPage}
                aria-label={`New version ${updateAvailableTag} available, open downloads page`}
                title={`New version ${updateAvailableTag} is available — click to open downloads`}
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{
                  background: "transparent",
                  color: "#f59e0b",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#422006";
                  (e.currentTarget as HTMLElement).style.color = "#fbbf24";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#f59e0b";
                }}
              >
                <BadgeAlert size={15} aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ background: "transparent", color: "#52525b" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#1e1e22";
                (e.currentTarget as HTMLElement).style.color = "#a1a1aa";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "#52525b";
              }}
            >
              <Settings size={15} />
            </button>
            <button
              type="button"
              onClick={() => void togglePin()}
              disabled={!pinReady}
              title={pinned ? "Unpin (hide when clicking away)" : "Pin open"}
              className="p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              style={{
                background: pinned ? "#2a2140" : "transparent",
                color: pinned ? "#a78bfa" : "#52525b",
              }}
              onMouseEnter={(e) => {
                if ((e.currentTarget as HTMLButtonElement).disabled) return;
                (e.currentTarget as HTMLElement).style.background = pinned
                  ? "#352850"
                  : "#1e1e22";
                (e.currentTarget as HTMLElement).style.color = pinned
                  ? "#c4b5fd"
                  : "#a1a1aa";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = pinned
                  ? "#2a2140"
                  : "transparent";
                (e.currentTarget as HTMLElement).style.color = pinned
                  ? "#a78bfa"
                  : "#52525b";
              }}
            >
              {pinned ? <Pin size={15} /> : <PinOff size={15} />}
            </button>
            <button
              type="button"
              onClick={hideToTray}
              title="Hide to tray"
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ background: "transparent", color: "#52525b" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#1e1e22";
                (e.currentTarget as HTMLElement).style.color = "#a1a1aa";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLElement).style.color = "#52525b";
              }}
            >
              <Minimize2 size={15} />
            </button>
            <span className="text-xs pl-1" style={{ color: "#3f3f46" }}>
              {today}
            </span>
          </div>
        </div>

        <div
          className={`flex-1 overflow-y-auto px-3 pb-3 pt-3 flex flex-col ${settings.compactLayout ? "gap-2" : "gap-3"}`}
        >
          {settings.showPomodoro && (
            <>
              <PomodoroTimer />
              <FocusedTaskHint />
            </>
          )}
          <TaskList />
          {settings.showClipboard && <ClipboardHistory />}
          {settings.showSystemStats && <SystemStats />}
        </div>
        </div>
      </motion.div>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
    </TasksProvider>
  );
}
