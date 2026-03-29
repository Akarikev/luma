import { useState } from "react";
import { Clipboard, Copy, Check, ListPlus } from "lucide-react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useClipboard } from "../hooks/useClipboard";
import { useTasks } from "../hooks/useTasks";
import { SectionCard } from "./SectionCard";

export function ClipboardHistory() {
  const history = useClipboard();
  const { addTask } = useTasks();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    await writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  return (
    <SectionCard title="Clipboard" icon={<Clipboard size={13} />}>
      <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
        {history.length === 0 && (
          <p className="text-xs text-center py-2" style={{ color: "#3f3f46" }}>
            Nothing copied yet
          </p>
        )}
        {history.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-1 w-full rounded-xl px-2 py-1.5 transition-colors group min-w-0"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#1a1a1e";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <button
              type="button"
              onClick={() => handleCopy(entry.id, entry.text)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer bg-transparent border-0 p-0"
              style={{ color: "inherit" }}
            >
              <span
                className="flex-1 text-xs truncate font-mono"
                style={{ color: "#a1a1aa" }}
              >
                {entry.text}
              </span>
            </button>
            <button
              type="button"
              title="Add as task"
              aria-label="Add clip as task"
              className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              style={{ color: "#7c3aed" }}
              onClick={(e) => {
                e.stopPropagation();
                addTask(entry.text);
              }}
            >
              <ListPlus size={14} />
            </button>
            <span
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-[18px] flex justify-center"
              style={{ color: copiedId === entry.id ? "#22c55e" : "#52525b" }}
            >
              {copiedId === entry.id ? <Check size={11} /> : <Copy size={11} />}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
