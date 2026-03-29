import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { STORE_PATH } from "./store";

/** Reveals `luma-data.json` in the system file manager (Tauri only). */
export async function revealLumaStoreInExplorer(): Promise<void> {
  const base = await appLocalDataDir();
  const path = await join(base, STORE_PATH);
  await revealItemInDir(path);
}
