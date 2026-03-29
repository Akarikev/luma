import { load } from "@tauri-apps/plugin-store";

export const STORE_PATH = "luma-data.json";

let _store: Awaited<ReturnType<typeof load>> | null = null;

async function getStore() {
  if (!_store) {
    _store = await load(STORE_PATH, { defaults: {}, autoSave: true });
  }
  return _store;
}

export async function storeGet<T>(key: string): Promise<T | null> {
  const s = await getStore();
  return (await s.get<T>(key)) ?? null;
}

export async function storeSet<T>(key: string, value: T): Promise<void> {
  const s = await getStore();
  await s.set(key, value);
}

/** Clears every key in the Tauri store file (tasks, pomodoro, settings, etc.). */
export async function clearEntireStore(): Promise<void> {
  const s = await getStore();
  await s.clear();
  await s.save();
}
