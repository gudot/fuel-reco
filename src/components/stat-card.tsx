import React from "react";

export function StatCard({
  label,
  value,
  accent = "brand",
  icon
}: {
  label: string;
  value: string | number;
  accent?: "brand" | "fuel" | "alert" | "ok" | "info" | "violet";
  icon?: React.ReactNode;
}) {
  return (
    <div className={`stat-card accent-${accent}`}>
      <span>
        {icon ? <span style={{ display: "inline-flex" }}>{icon}</span> : null}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

