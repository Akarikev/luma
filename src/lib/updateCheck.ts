/** Body text for the desktop alert when a newer GitHub release exists (keep in sync with UI copy). */
export function updateAvailableNotificationBody(latestTag: string): string {
  return `Version ${latestTag} is ready. Open the app to download the update.`;
}

/** Public repo used for “latest release” checks (must match published GitHub Releases). */
export const UPDATE_REPO_OWNER = "Akarikev";
export const UPDATE_REPO_NAME = "luma";

export const RELEASES_LATEST_URL = `https://github.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/releases/latest`;

const GH_API = `https://api.github.com/repos/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/releases/latest`;

const STORAGE_DISMISSED_TAG = "luma_update_dismissed_tag";
const STORAGE_NOTIFIED_TAG = "luma_update_notified_tag";

function normalizeSemver(s: string): string {
  return s.replace(/^v/i, "").split(/[+-]/)[0] ?? "";
}

/** True if `a` is strictly newer than `b` (major.minor.patch). */
export function semverGreater(a: string, b: string): boolean {
  const pa = normalizeSemver(a)
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const pb = normalizeSemver(b)
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const n = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < n; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return true;
    if (da < db) return false;
  }
  return false;
}

type GhReleaseLatest = { tag_name?: string };

export async function fetchLatestReleaseTag(): Promise<string | null> {
  const res = await fetch(GH_API, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as GhReleaseLatest;
  const tag = data.tag_name?.trim();
  return tag && tag.length > 0 ? tag : null;
}

export function getDismissedReleaseTag(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_DISMISSED_TAG);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setDismissedReleaseTag(tag: string): void {
  try {
    localStorage.setItem(STORAGE_DISMISSED_TAG, tag);
  } catch {
    /* ignore */
  }
}

/** Last release tag we already showed a desktop alert for (one ping per new tag, not every launch). */
export function getNotifiedReleaseTag(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_NOTIFIED_TAG);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setNotifiedReleaseTag(tag: string): void {
  try {
    localStorage.setItem(STORAGE_NOTIFIED_TAG, tag);
  } catch {
    /* ignore */
  }
}

/** Newer release on GitHub vs this build; banner may be hidden if the user dismissed it for this tag. */
export type UpdateUiState = {
  latestTag: string;
  showBanner: boolean;
};

export async function getUpdateUiState(
  currentVersion: string
): Promise<UpdateUiState | null> {
  const latestTag = await fetchLatestReleaseTag();
  if (!latestTag || !semverGreater(latestTag, currentVersion)) return null;
  const dismissed = getDismissedReleaseTag();
  const showBanner = dismissed !== latestTag;
  return { latestTag, showBanner };
}

export type UpdateCheckResult =
  | { status: "current"; current: string }
  | { status: "available"; current: string; latestTag: string }
  | { status: "skipped" };

export async function checkForAppUpdate(
  currentVersion: string,
  options?: { ignoreDismissed?: boolean }
): Promise<UpdateCheckResult> {
  const latestTag = await fetchLatestReleaseTag();
  if (!latestTag) return { status: "skipped" };

  if (!semverGreater(latestTag, currentVersion)) {
    return { status: "current", current: currentVersion };
  }

  if (!options?.ignoreDismissed) {
    const dismissed = getDismissedReleaseTag();
    if (dismissed === latestTag) {
      return { status: "skipped" };
    }
  }

  return { status: "available", current: currentVersion, latestTag };
}
