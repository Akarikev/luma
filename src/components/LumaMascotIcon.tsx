import type { CSSProperties } from "react";

export type LumaMascotVariant = "idle" | "focus" | "break";

type Props = {
  variant?: LumaMascotVariant;
  size?: number;
  className?: string;
  style?: CSSProperties;
  softShine?: boolean;
  title?: string;
};

/** Match LumaCompanion palette + lighter tray-friendly fills */
const PALETTES: Record<
  LumaMascotVariant,
  { body: string; rim: string; eye: string; mouth: string; shine: string }
> = {
  idle: {
    body: "#343840",
    rim: "#64748b",
    eye: "#f8fafc",
    mouth: "#94a3b8",
    shine: "rgba(255,255,255,0.18)",
  },
  focus: {
    body: "#3a2d58",
    rim: "#a78bfa",
    eye: "#faf5ff",
    mouth: "#c4b5fd",
    shine: "rgba(237,233,254,0.22)",
  },
  break: {
    body: "#4f3f24",
    rim: "#fbbf24",
    eye: "#fffbeb",
    mouth: "#fcd34d",
    shine: "rgba(254,249,195,0.2)",
  },
};

/**
 * Static mascot: wide oval head + vertical eye ovals + pill mouth
 * (same language as LumaCompanion, not a stroke “smile” arc).
 */
export function LumaMascotIcon({
  variant = "focus",
  size = 22,
  className,
  style,
  softShine = true,
  title = "Luma",
}: Props) {
  const c = PALETTES[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={{ flexShrink: 0, ...style }}
      role="img"
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {/* Horizontal oval body — companion is 72×56 */}
      <ellipse
        cx="16"
        cy="13"
        rx="11.5"
        ry="9"
        fill={c.body}
        stroke={c.rim}
        strokeWidth={1.75}
      />
      {softShine ? (
        <ellipse cx="10.5" cy="9.5" rx="4.5" ry="3.5" fill={c.shine} />
      ) : null}
      {/* Eyes: vertical ovals like companion 9×11 scaled */}
      <ellipse cx="12.6" cy="12.2" rx="2.1" ry="2.75" fill={c.eye} />
      <ellipse cx="19.4" cy="12.2" rx="2.1" ry="2.75" fill={c.eye} />
      {/* Pill mouth — inside the oval */}
      <rect
        x="12.5"
        y="16.5"
        width="7"
        height="2.8"
        rx="1.4"
        ry="1.4"
        fill={c.mouth}
      />
    </svg>
  );
}
