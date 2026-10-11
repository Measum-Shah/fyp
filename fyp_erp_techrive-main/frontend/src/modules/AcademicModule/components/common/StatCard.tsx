import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  color?: "blue" | "green" | "purple" | "gold" | "red" | "emerald";
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  trendDirection = "up",
  color = "blue",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`stat-card ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="stat-header">
        {icon ? (
          <div className={`stat-icon stat-icon-${color}`}>
            {icon}
          </div>
        ) : (
          <div className={`stat-icon stat-icon-${color}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
        )}
        {trend && (
          <span className="stat-change">
            {trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : "•"} {trend}
          </span>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {subtext && <div className="text-[11px] text-[var(--text-dark-sub)] mt-1">{subtext}</div>}
    </div>
  );
};
