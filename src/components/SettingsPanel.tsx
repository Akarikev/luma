import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Settings, Trash2, BellRing, RefreshCw } from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useSettings } from "../hooks/useSettings";
import { clearEntireStore } from "../lib/store";
import { revealLumaStoreInExplorer } from "../lib/dataPaths";
import { notify } from "../lib/notifications";
import { SectionCard } from "./SectionCard";
import {
  checkForAppUpdate,
  RELEASES_LATEST_URL,
  updateAvailableNotificationBody,
} from "../lib/updateCheck";
import type { DurationUnitPreference } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: "#e4e4e7" }}>
          {label}
        </p>
        {description && (
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "#71717a" }}>
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="shrink-0 w-10 h-5 rounded-full relative transition-colors cursor-pointer disabled:opacity-45"
        style={{
          background: checked ? "#6d28d9" : "#3f3f46",
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? 22 : 2 }}
        />
      </button>
    </div>
  );
}

function SegmentedUnit({
  value,
  onChange,
}: {
  value: DurationUnitPreference;
  onChange: (v: DurationUnitPreference) => void;
}) {
  const seg = (u: DurationUnitPreference, label: string) => (
    <button
      key={u}
      type="button"
      onClick={() => onChange(u)}
      className="flex-1 text-xs py-1.5 rounded-md transition-colors cursor-pointer font-medium"
      style={{
        background: value === u ? "#2a2140" : "transparent",
        color: value === u ? "#c4b5fd" : "#71717a",
      }}
    >
      {label}
    </button>
  );
  return (
    <div
      className="flex rounded-lg p-0.5 gap-0.5"
      style={{ background: "#0f0f11", border: "1px solid #2a2a2e" }}
    >
      {seg("min", "Minutes")}
      {seg("hr", "Hours")}
    </div>
  );
}

export function SettingsPanel({ open, onClose }: Props) {
  const { settings, hydrated, updateSettings } = useSettings();
  const [clearBusy, setClearBusy] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [checkBusy, setCheckBusy] = useState(false);
  const [checkHint, setCheckHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const v = await getVersion();
        if (!cancelled) setAppVersion(v);
      } catch {
        if (!cancelled) setAppVersion(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleCheckUpdates = useCallback(async () => {
    setCheckHint(null);
    try {
      const v = await getVersion();
      setAppVersion(v);
      setCheckBusy(true);
      const result = await checkForAppUpdate(v, { ignoreDismissed: true });
      if (result.status === "available") {
        setCheckHint(`New release: ${result.latestTag}`);
      } else if (result.status === "current") {
        setCheckHint("You're on the latest public release.");
      } else {
        setCheckHint("Could not compare versions (offline or GitHub unavailable).");
      }
    } catch {
      setCheckHint("Could not read app version.");
    } finally {
      setCheckBusy(false);
    }
  }, []);

  const handleOpenReleases = useCallback(() => {
    void openUrl(RELEASES_LATEST_URL);
  }, []);

  const handleRevealData = useCallback(async () => {
    try {
      await revealLumaStoreInExplorer();
    } catch {
      /* Vite without Tauri or FS error */
    }
  }, []);

  const handleClearAll = useCallback(async () => {
    const ok = window.confirm(
      "Reset Luma? This removes all tasks, focus timer data, clipboard history, and settings on this device. You cannot undo this."
    );
    if (!ok) return;
    setClearBusy(true);
    try {
      await clearEntireStore();
    } finally {
      setClearBusy(false);
    }
    window.location.reload();
  }, []);

  const testNotify = useCallback(() => {
    void notify("Luma", "Test notification — reminders use the same channel.");
  }, []);

  const testUpdateNotification = useCallback(() => {
    void notify("Luma", updateAvailableNotificationBody("v0.0.0 (preview)"));
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="w-full max-w-md max-h-[min(560px,85vh)] overflow-y-auto rounded-2xl"
            style={{
              background: "#0d0d0f",
              border: "1px solid #2a2a2e",
              filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.8))",
            }}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div
              className="sticky top-0 flex items-center justify-between px-4 py-3 z-10"
              style={{
                background: "#0d0d0f",
                borderBottom: "1px solid #1e1e22",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Settings size={16} style={{ color: "#7c3aed" }} />
                <h2
                  id="settings-title"
                  className="text-sm font-semibold truncate"
                  style={{ color: "#f4f4f5" }}
                >
                  Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium px-2.5 py-1 rounded-lg cursor-pointer"
                style={{ background: "#1e1e22", color: "#a1a1aa" }}
              >
                Done
              </button>
            </div>

            <div className="p-3 flex flex-col gap-3">
              {!hydrated && (
                <p className="text-xs text-center py-2" style={{ color: "#52525b" }}>
                  Loading preferences…
                </p>
              )}

              <SectionCard title="Tasks" icon={null}>
                <ToggleRow
                  label="Simple list"
                  description="Hide focus, reminders, reorder, and inline edit. Keep add, checkbox, and delete only."
                  checked={settings.tasksSimpleMode}
                  onChange={(v) => updateSettings({ tasksSimpleMode: v })}
                  disabled={!hydrated}
                />
              </SectionCard>

              <SectionCard title="Focus timer" icon={null}>
                <p className="text-[11px] mb-2" style={{ color: "#71717a" }}>
                  Default unit for duration steppers when under one hour.
                </p>
                <SegmentedUnit
                  value={settings.defaultDurationUnit}
                  onChange={(v) => updateSettings({ defaultDurationUnit: v })}
                />
              </SectionCard>

              <SectionCard title="Panels" icon={null}>
                <ToggleRow
                  label="Focus timer"
                  checked={settings.showPomodoro}
                  onChange={(v) => updateSettings({ showPomodoro: v })}
                  disabled={!hydrated}
                />
                <ToggleRow
                  label="Clipboard"
                  checked={settings.showClipboard}
                  onChange={(v) => updateSettings({ showClipboard: v })}
                  disabled={!hydrated}
                />
                <ToggleRow
                  label="System stats"
                  checked={settings.showSystemStats}
                  onChange={(v) => updateSettings({ showSystemStats: v })}
                  disabled={!hydrated}
                />
              </SectionCard>

              <SectionCard title="Notifications" icon={null}>
                <ToggleRow
                  label="Task reminders"
                  description="Desktop notifications when a reminder time is reached."
                  checked={settings.remindersEnabled}
                  onChange={(v) => updateSettings({ remindersEnabled: v })}
                  disabled={!hydrated}
                />
                <button
                  type="button"
                  onClick={testNotify}
                  className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: "#1e1e22",
                    color: "#a1a1aa",
                    border: "1px solid #2a2a2e",
                  }}
                >
                  <BellRing size={14} />
                  Send test notification
                </button>
              </SectionCard>

              <SectionCard title="Appearance" icon={null}>
                <ToggleRow
                  label="Compact spacing"
                  description="Tighter gaps between main panels."
                  checked={settings.compactLayout}
                  onChange={(v) => updateSettings({ compactLayout: v })}
                  disabled={!hydrated}
                />
              </SectionCard>

              <SectionCard title="Companion" icon={null}>
                <ToggleRow
                  label="Ambient bubbles"
                  description="Random chatter from pointer motion and hovering the eyes. Session and task-done lines stay on."
                  checked={settings.companionAmbientChatter}
                  onChange={(v) => updateSettings({ companionAmbientChatter: v })}
                  disabled={!hydrated}
                />
              </SectionCard>

              <SectionCard title="About" icon={null}>
                <p className="text-[11px] mb-2 leading-snug" style={{ color: "#71717a" }}>
                  We alert you when a newer release exists (desktop notification if allowed, plus a
                  banner in this window). Check below anytime. To update, use the{' '}
                  <a
                    href={RELEASES_LATEST_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-2 hover:underline"
                    style={{ color: "#a78bfa" }}
                    onClick={(e) => {
                      e.preventDefault();
                      void openUrl(RELEASES_LATEST_URL);
                    }}
                  >
                    downloads page
                  </a>
                  {'. '} Same install steps as the first time.
                </p>
                <p className="text-xs font-medium mb-2" style={{ color: "#e4e4e7" }}>
                  {appVersion ? `Version ${appVersion}` : "Version —"}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={checkBusy}
                    onClick={() => void handleCheckUpdates()}
                    className="flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg cursor-pointer disabled:opacity-50"
                    style={{
                      background: "#1e1e22",
                      color: "#e4e4e7",
                      border: "1px solid #2a2a2e",
                    }}
                  >
                    <RefreshCw size={14} className={checkBusy ? "animate-spin" : ""} />
                    Check for updates
                  </button>
                  {checkHint && (
                    <p className="text-[11px] leading-snug" style={{ color: "#a1a1aa" }}>
                      {checkHint}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleOpenReleases()}
                    className="text-[11px] font-medium py-1.5 rounded-lg cursor-pointer"
                    style={{ color: "#a78bfa" }}
                  >
                    Open downloads page
                  </button>
                  {import.meta.env.DEV && (
                    <button
                      type="button"
                      onClick={() => void testUpdateNotification()}
                      className="text-[11px] font-medium py-2 rounded-lg cursor-pointer text-left"
                      style={{ color: "#71717a", border: "1px dashed #3f3f46" }}
                    >
                      Preview update notification (dev)
                    </button>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Data" icon={null}>
                <p className="text-[11px] mb-3 leading-snug" style={{ color: "#71717a" }}>
                  Local data is stored in a JSON file next to the app data directory for your account.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRevealData()}
                    className="flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg cursor-pointer"
                    style={{
                      background: "#1e1e22",
                      color: "#e4e4e7",
                      border: "1px solid #2a2a2e",
                    }}
                  >
                    <FolderOpen size={14} />
                    Open data folder
                  </button>
                  <button
                    type="button"
                    disabled={clearBusy}
                    onClick={() => void handleClearAll()}
                    className="flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg cursor-pointer disabled:opacity-50"
                    style={{
                      background: "rgba(127,29,29,0.25)",
                      color: "#fca5a5",
                      border: "1px solid rgba(248,113,113,0.35)",
                    }}
                  >
                    <Trash2 size={14} />
                    Clear all local data…
                  </button>
                </div>
              </SectionCard>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
