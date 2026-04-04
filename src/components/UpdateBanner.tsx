import { useCallback } from "react";
import { Download, X } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { RELEASES_LATEST_URL, setDismissedReleaseTag } from "../lib/updateCheck";

type Props = {
  latestTag: string;
  onDismiss: () => void;
};

export function UpdateBanner({ latestTag, onDismiss }: Props) {
  const handleOpen = useCallback(() => {
    void openUrl(RELEASES_LATEST_URL);
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissedReleaseTag(latestTag);
    onDismiss();
  }, [latestTag, onDismiss]);

  return (
    <div
      className="shrink-0 flex items-center gap-2 px-3 py-2"
      style={{
        background: "linear-gradient(90deg, rgba(109,40,217,0.2), rgba(15,15,17,0.95))",
        borderBottom: "1px solid #2a2140",
      }}
    >
      <p className="text-[11px] leading-snug flex-1 min-w-0" style={{ color: "#e4e4e7" }}>
        <span className="font-medium" style={{ color: "#c4b5fd" }}>
          Update available
        </span>
        <span style={{ color: "#71717a" }}> — </span>
        <span style={{ color: "#a1a1aa" }}>{latestTag}</span>
        <span style={{ color: "#52525b" }}> on GitHub</span>
      </p>
      <button
        type="button"
        onClick={() => void handleOpen()}
        className="shrink-0 flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md cursor-pointer"
        style={{
          background: "#6d28d9",
          color: "#fafafa",
        }}
      >
        <Download size={12} />
        Get it
      </button>
      <button
        type="button"
        title="Hide until the next release"
        onClick={handleDismiss}
        className="shrink-0 p-1 rounded-md cursor-pointer"
        style={{ color: "#71717a" }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
