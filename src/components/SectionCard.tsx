import React from "react";

interface Props {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, icon, children, className = "" }: Props) {
  return (
    <div
      className={`rounded-2xl p-4 ${className}`}
      style={{ background: "#111113", border: "1px solid #222226" }}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span style={{ color: "#7c3aed" }}>{icon}</span>}
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#52525b" }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
