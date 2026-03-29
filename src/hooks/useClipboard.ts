import { useState, useEffect, useRef } from "react";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import type { ClipboardEntry } from "../types";

const MAX_HISTORY = 15;
const POLL_MS = 500;

export function useClipboard() {
  const [history, setHistory] = useState<ClipboardEntry[]>([]);
  const lastTextRef = useRef<string>("");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const text = await readText();
        if (text && text !== lastTextRef.current && text.trim().length > 0) {
          lastTextRef.current = text;
          setHistory((prev) => {
            const entry: ClipboardEntry = {
              id: crypto.randomUUID(),
              text,
              timestamp: Date.now(),
            };
            const filtered = prev.filter((e) => e.text !== text);
            return [entry, ...filtered].slice(0, MAX_HISTORY);
          });
        }
      } catch {
        // clipboard empty or inaccessible — silent
      }
    }, POLL_MS);

    return () => clearInterval(interval);
  }, []);

  return history;
}
