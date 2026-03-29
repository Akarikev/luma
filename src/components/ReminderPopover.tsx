import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";

const PRESETS = [
  { label: "5 min", ms: 5 * 60_000 },
  { label: "15 min", ms: 15 * 60_000 },
  { label: "30 min", ms: 30 * 60_000 },
  { label: "1 hr", ms: 60 * 60_000 },
  { label: "2 hr", ms: 120 * 60_000 },
] as const;

type Props = {
  taskText: string;
  onSet: (timestamp: number) => void;
  onClear: () => void;
  onClose: () => void;
  hasReminder: boolean;
  reminderAt: number | null | undefined;
};

function formatReminderTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function ReminderPopover({
  taskText,
  onSet,
  onClear,
  onClose,
  hasReminder,
  reminderAt,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [customMin, setCustomMin] = useState("");

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  const handlePreset = (ms: number) => {
    onSet(Date.now() + ms);
    onClose();
  };

  const handleCustom = () => {
    const n = parseInt(customMin, 10);
    if (!n || n <= 0) return;
    onSet(Date.now() + n * 60_000);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        className="rounded-2xl py-4 px-4 flex flex-col gap-2 w-[220px]"
        style={{
          background: "#141416",
          border: "1px solid #2a2a2e",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(124,58,237,0.08)",
        }}
      >
        <div className="flex items-center gap-2 pb-1">
          <Bell size={14} style={{ color: "#a78bfa" }} />
          <span
            className="text-xs font-semibold truncate flex-1"
            style={{ color: "#e4e4e7" }}
            title={taskText}
          >
            {taskText}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-0.5 rounded cursor-pointer shrink-0"
            style={{ color: "#52525b" }}
          >
            <X size={14} />
          </button>
        </div>

        <span
          className="text-[10px] uppercase tracking-wider font-semibold px-0.5"
          style={{ color: "#52525b" }}
        >
          Remind in
        </span>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p.ms)}
              className="text-xs px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              style={{
                background: "#1e1e22",
                color: "#e4e4e7",
                border: "1px solid #2a2a2e",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#2a2140";
                (e.currentTarget as HTMLElement).style.borderColor = "#7c3aed";
                (e.currentTarget as HTMLElement).style.color = "#c4b5fd";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#1e1e22";
                (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2e";
                (e.currentTarget as HTMLElement).style.color = "#e4e4e7";
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div
          className="flex items-center gap-1.5 pt-2 mt-1"
          style={{ borderTop: "1px solid #1e1e22" }}
        >
          <input
            autoFocus
            type="number"
            min={1}
            placeholder="min"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCustom();
            }}
            className="w-16 rounded-lg px-2.5 py-1.5 text-xs outline-none tabular-nums"
            style={{
              background: "#0f0f11",
              border: "1px solid #2a2a2e",
              color: "#e4e4e7",
            }}
          />
          <button
            type="button"
            onClick={handleCustom}
            className="text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer"
            style={{ background: "#7c3aed", color: "white" }}
          >
            Set
          </button>
        </div>

        {hasReminder && reminderAt && (
          <div
            className="flex items-center justify-between pt-2 mt-1"
            style={{ borderTop: "1px solid #1e1e22" }}
          >
            <span className="text-[10px]" style={{ color: "#a78bfa" }}>
              Set for {formatReminderTime(reminderAt)}
            </span>
            <button
              type="button"
              onClick={() => {
                onClear();
                onClose();
              }}
              className="text-[10px] px-2 py-0.5 rounded-md cursor-pointer"
              style={{ color: "#ef4444" }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
