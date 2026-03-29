import React, { useMemo, useState } from "react";
import {
  Bell,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Edit2,
  Plus,
  Trash2,
} from "lucide-react";
import { useTasks } from "../hooks/useTasks";
import { useSettings } from "../hooks/useSettings";
import { SectionCard } from "./SectionCard";
import { ReminderPopover } from "./ReminderPopover";
import type { Task } from "../types";

const BORDER = "#2a2a2e";
const BTN_IDLE = "#141416";
const BTN_HOVER = "#1e1e22";
const ACCENT = "#7c3aed";

export function TaskList() {
  const { settings } = useSettings();
  const simple = settings.tasksSimpleMode;

  const {
    tasks,
    focusedTaskId,
    pendingFocusComplete,
    addTask,
    toggleTask,
    deleteTask,
    toggleFocusedTask,
    updateTaskText,
    moveTask,
    setTaskReminder,
    clearTaskReminder,
    dismissPendingFocusComplete,
    confirmPendingFocusComplete,
  } = useTasks();

  const [input, setInput] = useState("");
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [reminderOpenId, setReminderOpenId] = useState<string | null>(null);

  const { pendingSorted, completedSorted } = useMemo(() => {
    const pending = tasks
      .filter((t) => !t.completed)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const completed = tasks
      .filter((t) => t.completed)
      .sort((a, b) => b.createdAt - a.createdAt);
    return { pendingSorted: pending, completedSorted: completed };
  }, [tasks]);

  const pendingCount = pendingSorted.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      addTask(input);
      setInput("");
    }
  };

  const handleAdd = () => {
    if (input.trim()) {
      addTask(input);
      setInput("");
    }
  };

  const startEdit = (t: Task) => {
    setEditingId(t.id);
    setEditDraft(t.text);
  };

  const commitEdit = () => {
    if (editingId && editDraft.trim()) {
      updateTaskText(editingId, editDraft);
    }
    setEditingId(null);
    setEditDraft("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const hasReminder = (t: Task) =>
    typeof t.reminderAt === "number" && t.reminderAt > 0;

  const rowHoverBg = "#1a1a1e";

  const renderRow = (task: Task, opts: { showReorder: boolean }) => {
    const isFocusedRow = !simple && focusedTaskId === task.id;

    return (
    <div
      key={task.id}
      className="flex items-center gap-1.5 group rounded-xl px-2 py-1.5 transition-colors min-h-[34px]"
      style={{
        cursor: "default",
        background: isFocusedRow ? "rgba(124,58,237,0.12)" : "transparent",
        boxShadow: isFocusedRow
          ? "inset 0 0 0 1px rgba(124,58,237,0.35)"
          : undefined,
      }}
      onMouseEnter={(e) => {
        if (isFocusedRow) return;
        (e.currentTarget as HTMLElement).style.background = rowHoverBg;
      }}
      onMouseLeave={(e) => {
        if (isFocusedRow) {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(124,58,237,0.12)";
        } else {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
    >
      <button
        type="button"
        onClick={() => toggleTask(task.id)}
        className="shrink-0 cursor-pointer"
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        <div
          className="w-4 h-4 rounded-md flex items-center justify-center transition-colors"
          style={{
            background: task.completed ? ACCENT : "transparent",
            border: task.completed
              ? `1px solid ${ACCENT}`
              : "1px solid #3f3f46",
          }}
        >
          {task.completed && (
            <svg viewBox="0 0 10 8" className="w-2.5 h-2">
              <path
                d="M1 4l3 3 5-6"
                stroke="white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>
      {!simple && editingId === task.id ? (
        <input
          autoFocus
          value={editDraft}
          onChange={(e) => setEditDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          onBlur={commitEdit}
          className="flex-1 min-w-0 rounded-lg px-2 py-0.5 text-sm outline-none"
          style={{
            background: "#0f0f11",
            border: `1px solid ${ACCENT}`,
            color: "#e4e4e7",
          }}
        />
      ) : (
        <span
          role={simple ? undefined : "button"}
          tabIndex={simple ? undefined : 0}
          className="flex-1 text-sm truncate min-w-0 text-left"
          style={{
            color: task.completed ? "#52525b" : "#e4e4e7",
            textDecoration: task.completed ? "line-through" : "none",
          }}
          onDoubleClick={() =>
            !simple && !task.completed && startEdit(task)
          }
          onKeyDown={(e) => {
            if (simple) return;
            if ((e.key === "Enter" || e.key === " ") && !task.completed) {
              e.preventDefault();
              startEdit(task);
            }
          }}
        >
          {task.text}
        </span>
      )}
      {!simple && opts.showReorder && (
        <div className="flex flex-col shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            aria-label="Move up"
            className="p-0.5 rounded cursor-pointer"
            style={{ color: "#52525b" }}
            onClick={() => moveTask(task.id, "up")}
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            aria-label="Move down"
            className="p-0.5 rounded cursor-pointer"
            style={{ color: "#52525b" }}
            onClick={() => moveTask(task.id, "down")}
          >
            <ChevronDown size={12} />
          </button>
        </div>
      )}
      {!simple && !task.completed && editingId !== task.id && (
        <>
          <button
            type="button"
            title={focusedTaskId === task.id ? "Clear focus" : "Focus for timer"}
            aria-pressed={focusedTaskId === task.id}
            className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
            style={{
              color: focusedTaskId === task.id ? ACCENT : "#52525b",
              background:
                focusedTaskId === task.id ? "rgba(124,58,237,0.2)" : "transparent",
            }}
            onClick={() => toggleFocusedTask(task.id)}
          >
            <Crosshair size={12} />
          </button>
          <div className="relative shrink-0">
            <button
              type="button"
              title={hasReminder(task) ? "Reminder set" : "Set reminder"}
              className={`p-1 rounded-lg cursor-pointer transition-opacity ${hasReminder(task) ? "" : "opacity-0 group-hover:opacity-100"}`}
              style={{
                color: hasReminder(task) ? "#a78bfa" : "#52525b",
              }}
              onClick={() =>
                setReminderOpenId(
                  reminderOpenId === task.id ? null : task.id
                )
              }
            >
              <Bell size={12} />
              {hasReminder(task) && (
                <span
                  className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#a78bfa" }}
                />
              )}
            </button>
          </div>
          <button
            type="button"
            title="Edit"
            className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
            style={{ color: "#52525b" }}
            onClick={() => startEdit(task)}
          >
            <Edit2 size={12} />
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer transition-all p-1"
        style={{ color: "#52525b" }}
        aria-label="Delete task"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#ef4444";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "#52525b";
        }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
  };

  return (
    <SectionCard
      title={`Tasks${pendingCount > 0 ? ` · ${pendingCount} left` : ""}`}
      icon={<CheckSquare size={13} />}
    >
      {pendingFocusComplete && !simple && (
        <div
          className="mb-3 rounded-xl px-3 py-2.5 flex flex-col gap-2"
          style={{
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.35)",
          }}
        >
          <p className="text-xs leading-snug" style={{ color: "#e4e4e7" }}>
            Mark{" "}
            <span className="font-medium" style={{ color: "#c4b5fd" }}>
              “{pendingFocusComplete.text.length > 48
                ? `${pendingFocusComplete.text.slice(0, 48)}…`
                : pendingFocusComplete.text}
            </span>{" "}
            done?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer text-white"
              style={{ background: ACCENT }}
              onClick={confirmPendingFocusComplete}
            >
              Yes
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
              style={{
                background: BTN_IDLE,
                color: "#a1a1aa",
                border: `1px solid ${BORDER}`,
              }}
              onClick={dismissPendingFocusComplete}
            >
              Not now
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex-1 flex items-stretch rounded-lg overflow-hidden min-w-0"
          style={{
            border: `1px solid ${BORDER}`,
            background: "#0f0f11",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task, press Enter…"
            className="flex-1 min-w-0 px-3 py-1.5 text-sm outline-none bg-transparent text-[#e4e4e7] placeholder:text-[#52525b]"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="p-1.5 rounded-lg text-white cursor-pointer transition-opacity shrink-0"
          style={{ background: BTN_IDLE, border: `1px solid ${BORDER}` }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = BTN_HOVER;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = BTN_IDLE;
          }}
          aria-label="Add task"
        >
          <Plus size={14} style={{ color: ACCENT }} />
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
        {tasks.length === 0 && (
          <p className="text-xs text-center py-2" style={{ color: "#3f3f46" }}>
            No tasks yet
          </p>
        )}
        {pendingSorted.map((t) =>
          renderRow(t, { showReorder: !simple })
        )}
        {completedSorted.length > 0 && (
          <>
            <button
              type="button"
              className="flex items-center gap-1 text-left text-[10px] uppercase tracking-wider py-1.5 mt-1 cursor-pointer"
              style={{ color: "#52525b" }}
              onClick={() => setDoneExpanded((e) => !e)}
            >
              <ChevronDown
                size={12}
                style={{
                  transform: doneExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 0.15s ease",
                }}
              />
              Done ({completedSorted.length})
            </button>
            {doneExpanded &&
              completedSorted.map((t) => renderRow(t, { showReorder: false }))}
          </>
        )}
      </div>

      {!simple && reminderOpenId && (() => {
        const t = tasks.find((x) => x.id === reminderOpenId);
        if (!t) return null;
        return (
          <ReminderPopover
            taskText={t.text}
            hasReminder={hasReminder(t)}
            reminderAt={t.reminderAt}
            onSet={(ts) => setTaskReminder(t.id, ts)}
            onClear={() => clearTaskReminder(t.id)}
            onClose={() => setReminderOpenId(null)}
          />
        );
      })()}
    </SectionCard>
  );
}
