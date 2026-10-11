import React from "react";
import type { ChartDataPoint } from "../../types";

interface ChartProps {
  title: string;
  data: ChartDataPoint[];
  height?: number;
}

export const BarChart: React.FC<ChartProps> = ({ title, data, height = 200 }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="panel-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div className="panel-card-header" style={{ marginBottom: "0.875rem" }}>
        <h3>{title}</h3>
        <span style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)" }}>Distribution</span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: "0.5rem", height: `${height}px`, paddingTop: "0.5rem" }}>
        {data.map((item, index) => {
          const heightPercent = Math.max(12, Math.round((item.value / maxValue) * 100));

          return (
            <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem", height: "100%", justifyContent: "flex-end", maxWidth: "60px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-dark)" }}>
                {item.value}
              </span>
              <div style={{ width: "100%", background: "var(--input-bg)", borderRadius: "8px", height: "100%", display: "flex", alignItems: "flex-end", overflow: "hidden", padding: "3px", border: "1px solid var(--card-border)" }}>
                <div
                  style={{
                    height: `${heightPercent}%`,
                    width: "100%",
                    background: "linear-gradient(135deg, var(--accent) 0%, var(--steel-light) 100%)",
                    borderRadius: "6px",
                    transition: "all 0.4s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 500, color: "var(--text-dark-sub)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LineChart: React.FC<ChartProps> = ({ title, data, height = 200 }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = 500;
  const svgHeight = height - 40;

  const points = data
    .map((d, i) => {
      const x = (i / Math.max(1, data.length - 1)) * (width - 40) + 20;
      const y = svgHeight - (d.value / maxValue) * (svgHeight - 40) - 20;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="panel-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div className="panel-card-header" style={{ marginBottom: "0.875rem" }}>
        <h3>{title}</h3>
        <span style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)" }}>Monthly</span>
      </div>

      <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
        <svg viewBox={`0 0 ${width} ${svgHeight}`} style={{ width: "100%", height: "80%", overflow: "visible" }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = svgHeight * ratio;
            return (
              <line
                key={i}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="var(--divider-color)"
                strokeDasharray="4 4"
              />
            );
          })}

          {data.length > 0 && (
            <polygon
              points={`20,${svgHeight} ${points} ${width - 20},${svgHeight}`}
              fill="url(#lineGrad)"
            />
          )}

          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {data.map((d, i) => {
            const x = (i / Math.max(1, data.length - 1)) * (width - 40) + 20;
            const y = svgHeight - (d.value / maxValue) * (svgHeight - 40) - 20;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="var(--accent)" stroke="var(--card-bg)" strokeWidth="2" />
                <title>{`${d.label}: ${d.value}`}</title>
              </g>
            );
          })}
        </svg>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem", color: "var(--text-dark-sub)", padding: "0 0.5rem" }}>
          {data.map((item, idx) => (
            <span key={idx} style={{ textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DonutChart: React.FC<ChartProps> = ({ title, data }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const colors = ["#1d6fbf", "#1a7a4e", "#8b5cf6", "#c9a227", "#d64040"];

  let cumulativeAngle = 0;

  return (
    <div className="panel-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div className="panel-card-header" style={{ marginBottom: "0.875rem" }}>
        <h3>{title}</h3>
        <span style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)" }}>Breakdown</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: "1.25rem", padding: "0.5rem 0" }}>
        <div style={{ position: "relative", width: "130px", height: "130px", flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            {data.map((item, index) => {
              const strokeDasharray = `${(item.value / total) * 283} 283`;
              const strokeDashoffset = -cumulativeAngle;
              cumulativeAngle += (item.value / total) * 283;
              const color = item.color || colors[index % colors.length];

              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                />
              );
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-dark)" }}>{total}</span>
            <span style={{ fontSize: "0.62rem", color: "var(--text-dark-sub)", textTransform: "uppercase", fontWeight: 600 }}>Total</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          {data.map((item, index) => {
            const color = item.color || colors[index % colors.length];
            const percentage = Math.round((item.value / total) * 100);

            return (
              <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                  <span style={{ color: "var(--text-dark)", fontWeight: 500 }}>{item.label}</span>
                </div>
                <div style={{ fontWeight: 700, color: "var(--text-dark)" }}>
                  <span>{item.value}</span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-dark-sub)", marginLeft: "0.25rem", fontWeight: 400 }}>({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
