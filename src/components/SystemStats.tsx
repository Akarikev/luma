import { Cpu, MemoryStick, Battery, BatteryLow } from "lucide-react";
import { useSystemStats } from "../hooks/useSystemStats";
import { SectionCard } from "./SectionCard";

function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="flex-1 h-1.5 rounded-full overflow-hidden"
      style={{ background: "#1e1e22" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          transition: "width 0.7s ease, background 0.3s ease",
        }}
      />
    </div>
  );
}

function formatBytes(bytes: number): string {
  return (bytes / 1024 ** 3).toFixed(1) + " GB";
}

function getColor(pct: number): string {
  if (pct > 80) return "#ef4444";
  if (pct > 60) return "#f59e0b";
  return "#7c3aed";
}

export function SystemStats() {
  const stats = useSystemStats();
  const ramPct = stats.ram_total > 0 ? (stats.ram_used / stats.ram_total) * 100 : 0;
  const batLow = stats.battery !== null && stats.battery < 20;

  return (
    <SectionCard title="System" icon={<Cpu size={13} />}>
      <div className="flex flex-col gap-2.5">
        {/* CPU */}
        <div className="flex items-center gap-2">
          <Cpu size={11} style={{ color: "#52525b", flexShrink: 0 }} />
          <span className="text-xs w-7" style={{ color: "#52525b" }}>CPU</span>
          <StatBar value={stats.cpu} color={getColor(stats.cpu)} />
          <span
            className="text-xs font-mono w-9 text-right"
            style={{ color: "#d4d4d8" }}
          >
            {stats.cpu.toFixed(0)}%
          </span>
        </div>

        {/* RAM */}
        <div className="flex items-center gap-2">
          <MemoryStick size={11} style={{ color: "#52525b", flexShrink: 0 }} />
          <span className="text-xs w-7" style={{ color: "#52525b" }}>RAM</span>
          <StatBar value={ramPct} color={getColor(ramPct)} />
          <span
            className="text-xs font-mono w-24 text-right whitespace-nowrap"
            style={{ color: "#d4d4d8" }}
          >
            {formatBytes(stats.ram_used)}/{formatBytes(stats.ram_total)}
          </span>
        </div>

        {/* Battery */}
        {stats.battery !== null && (
          <div className="flex items-center gap-2">
            {batLow ? (
              <BatteryLow size={11} style={{ color: "#ef4444", flexShrink: 0 }} />
            ) : (
              <Battery size={11} style={{ color: "#52525b", flexShrink: 0 }} />
            )}
            <span className="text-xs w-7" style={{ color: "#52525b" }}>BAT</span>
            <StatBar
              value={stats.battery}
              color={batLow ? "#ef4444" : "#22c55e"}
            />
            <span
              className="text-xs font-mono w-9 text-right"
              style={{ color: batLow ? "#ef4444" : "#d4d4d8" }}
            >
              {stats.battery.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
