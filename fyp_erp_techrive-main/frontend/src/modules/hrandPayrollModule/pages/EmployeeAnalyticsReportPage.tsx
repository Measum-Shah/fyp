import React from "react";
import { Link } from "react-router-dom";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useEmployeeAnalyticsReport } from "../hooks/useEmployeeAnalyticsReport";
import type { DistributionSlice } from "../services/report.types";
import "./employee-module.css";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconBadge = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const IconGender = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="14" r="5" />
    <path d="M19 5l-5.4 5.4" />
    <path d="M19 5h-5" />
    <path d="M19 5v5" />
  </svg>
);

const IconTag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.82 0l4.6-4.6a2 2 0 0 0 0-2.82Z" />
    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── DistributionPanel ────────────────────────────────────────────────────
// One card: an icon+title header, then one CSS-only bar per slice. No
// charting library is added for this (same reasoning as ExportCsvButton.tsx
// not adding a CSV library) — a labelled width-percentage bar communicates
// a distribution just as well as a pie/bar chart would for this many
// categories, without a new dependency.
interface DistributionPanelProps {
  icon: React.ReactNode;
  iconVariant: "blue" | "green" | "gold" | "purple";
  title: string;
  subtitle: string;
  slices: DistributionSlice[];
  emptyLabel: string;
}

const DistributionPanel: React.FC<DistributionPanelProps> = ({
  icon,
  iconVariant,
  title,
  subtitle,
  slices,
  emptyLabel,
}) => (
  <div className="hr-analytics-panel">
    <div className="hr-analytics-panel-header">
      <div className={`stat-icon stat-icon-${iconVariant}`}>{icon}</div>
      <div>
        <div className="hr-analytics-panel-title">{title}</div>
        <div className="hr-analytics-panel-sub">{subtitle}</div>
      </div>
    </div>

    {slices.length === 0 ? (
      <p className="hr-dist-empty">{emptyLabel}</p>
    ) : (
      <div className="hr-dist-list">
        {slices.map((slice) => (
          <div key={slice.label} className="hr-dist-row">
            <div className="hr-dist-row-top">
              <span className="hr-dist-label">{slice.label}</span>
              <span className="hr-dist-meta">
                {slice.count} &middot; {slice.percentage}%
              </span>
            </div>
            <div className="hr-dist-bar-track">
              <div
                className={`hr-dist-bar-fill hr-dist-bar-fill-${iconVariant === "blue" ? "" : iconVariant}`.trim()}
                style={{ width: `${Math.min(slice.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── EmployeeAnalyticsReportPage ─────────────────────────────────────────────
// Phase 1, Report 5: four distributions over the active employee set —
// staff type, gender, designation and tenure band — each as a CSS-only bar
// list rather than a chart library. Export combines all four distributions
// into one flat CSV (Category column tells them apart).
const EmployeeAnalyticsReportPage: React.FC = () => {
  const { data, loading, error, refetch } = useEmployeeAnalyticsReport();

  const showBigLoadingState = loading && !data && !error;
  const showErrorState = !loading && !!error;
  const showPanels = !showBigLoadingState && !showErrorState && !!data;

  const combinedCsvRows = data
    ? [
        ...data.byStaffType.map((s) => ({ ...s, __category: "Staff Type" })),
        ...data.byGender.map((s) => ({ ...s, __category: "Gender" })),
        ...data.byDesignation.map((s) => ({ ...s, __category: "Designation" })),
        ...data.byTenure.map((s) => ({ ...s, __category: "Tenure" })),
      ]
    : [];

  const combinedCsvColumns: CsvColumn<DistributionSlice & { __category: string }>[] = [
    { header: "Category", accessor: (r) => r.__category },
    { header: "Group", accessor: (r) => r.label },
    { header: "Count", accessor: (r) => r.count },
    { header: "Percentage", accessor: (r) => `${r.percentage}%` },
  ];

  return (
    <div className="hr-page">
      <div className="hr-page-inner">
        <div className="hr-page-header">
          <div>
            <nav className="breadcrumb">
              <Link to="/dashboard" className="breadcrumb-item">
                <IconHome /> Dashboard
              </Link>
              <span className="breadcrumb-separator">›</span>
              <Link to="/hr/reports" className="breadcrumb-item">HR &amp; Payroll</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">Employee Analytics</span>
            </nav>
            <h1 className="hr-page-title">Employee Analytics</h1>
          </div>

          <ExportCsvButton
            rows={combinedCsvRows}
            columns={combinedCsvColumns}
            filename="employee-analytics-report"
          />
        </div>


        {data && (
          <div className="hr-report-summary-strip">
            <div className="hr-report-summary-item">
              <div className="stat-icon stat-icon-blue"><IconBadge /></div>
              <div className="hr-report-summary-item-text">
                <div className="hr-report-summary-value">{data.totalEmployees}</div>
                <div className="hr-report-summary-label">Active employees analyzed</div>
              </div>
            </div>
          </div>
        )}

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap"><span className="spinner" /></span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Crunching the numbers…
              </p>
            </div>
          </div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap">
            <div className="hr-state hr-state-error">
              <div className="hr-state-icon"><IconAlertTriangle /></div>
              <p className="hr-state-title">Couldn't generate the report</p>
              <p className="hr-state-message">{error}</p>
              <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>
                Try again
              </button>
            </div>
          </div>
        )}

        {showPanels && data && (
          <div className="hr-analytics-grid">
            <DistributionPanel
              icon={<IconBadge />}
              iconVariant="blue"
              title="By Staff Type"
              subtitle={`${data.byStaffType.length} categories`}
              slices={data.byStaffType}
              emptyLabel="No employees to analyze yet."
            />
            <DistributionPanel
              icon={<IconGender />}
              iconVariant="green"
              title="By Gender"
              subtitle={`${data.byGender.length} categories`}
              slices={data.byGender}
              emptyLabel="No employees to analyze yet."
            />
            <DistributionPanel
              icon={<IconTag />}
              iconVariant="gold"
              title="By Designation"
              subtitle={
                data.byDesignation.length > 10
                  ? "Top 10, rest grouped as Other"
                  : `${data.byDesignation.length} designations`
              }
              slices={data.byDesignation}
              emptyLabel="No employees to analyze yet."
            />
            <DistributionPanel
              icon={<IconClock />}
              iconVariant="purple"
              title="By Tenure"
              subtitle="Time since join date"
              slices={data.byTenure}
              emptyLabel="No employees to analyze yet."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAnalyticsReportPage;