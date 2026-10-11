import React from "react";
import { Link } from "react-router-dom";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useStaffStrengthReport } from "../hooks/useStaffStrengthReport";
import type { DistributionSlice, HeadcountRow } from "../services/report.types";
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

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconBuilding = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="9" y1="6" x2="9" y2="6.01" />
    <line x1="15" y1="6" x2="15" y2="6.01" />
    <line x1="9" y1="10" x2="9" y2="10.01" />
    <line x1="15" y1="10" x2="15" y2="10.01" />
    <line x1="9" y1="14" x2="9" y2="14.01" />
    <line x1="15" y1="14" x2="15" y2="14.01" />
  </svg>
);

const IconBadge = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

const IconActivity = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

// ─── DistributionPanel ────────────────────────────────────────────────────
// Same CSS-only bar-list pattern as EmployeeAnalyticsReportPage's
// DistributionPanel — kept local to this file rather than shared so each
// report page can evolve its own layout independently.
interface DistributionPanelProps {
  icon: React.ReactNode;
  iconVariant: "blue" | "green" | "gold" | "purple";
  title: string;
  subtitle: string;
  slices: DistributionSlice[];
}

const DistributionPanel: React.FC<DistributionPanelProps> = ({ icon, iconVariant, title, subtitle, slices }) => (
  <div className="hr-analytics-panel">
    <div className="hr-analytics-panel-header">
      <div className={`stat-icon stat-icon-${iconVariant}`}>{icon}</div>
      <div>
        <div className="hr-analytics-panel-title">{title}</div>
        <div className="hr-analytics-panel-sub">{subtitle}</div>
      </div>
    </div>

    {slices.length === 0 ? (
      <p className="hr-dist-empty">No employees to analyze yet.</p>
    ) : (
      <div className="hr-dist-list">
        {slices.map((slice) => (
          <div key={slice.label} className="hr-dist-row">
            <div className="hr-dist-row-top">
              <span className="hr-dist-label">{slice.label}</span>
              <span className="hr-dist-meta">{slice.count} &middot; {slice.percentage}%</span>
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

const headcountCsvColumns: CsvColumn<HeadcountRow & { __category: string }>[] = [
  { header: "Category", accessor: (r) => r.__category },
  { header: "Group", accessor: (r) => r.name },
  { header: "Total", accessor: (r) => r.total },
  { header: "Active", accessor: (r) => r.active },
  { header: "Inactive", accessor: (r) => r.inactive },
];

// ─── StaffStrengthReportPage ─────────────────────────────────────────────────
// The "everything HR opens day to day" view: total headcount, active vs
// inactive, then four cuts of the same number — by department, by branch,
// by staff type, by job status. All four come from one backend call (see
// report.service.ts's getStaffStrengthReport), which itself composes the
// existing Headcount by Department/Branch endpoints rather than duplicating
// their queries.
const StaffStrengthReportPage: React.FC = () => {
  const { data, loading, error, refetch } = useStaffStrengthReport();

  const showBigLoadingState = loading && !data && !error;
  const showErrorState = !loading && !!error;
  const showPanels = !showBigLoadingState && !showErrorState && !!data;

  const csvRows = data
    ? [
        ...data.byDepartment.map((r) => ({ ...r, __category: "Department" })),
        ...data.byBranch.map((r) => ({ ...r, __category: "Branch" })),
      ]
    : [];

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
              <Link to="/hr/reports" className="breadcrumb-item">Reports</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">Staff Strength</span>
            </nav>
            <h1 className="hr-page-title">Staff Strength Report</h1>
          </div>

          <ExportCsvButton rows={csvRows} columns={headcountCsvColumns} filename="staff-strength-report" />
        </div>

        {data && (
          <div className="hr-report-summary-strip">
            <div className="hr-report-summary-item">
              <div className="stat-icon stat-icon-blue"><IconUsers /></div>
              <div className="hr-report-summary-item-text">
                <div className="hr-report-summary-value">{data.totalEmployees}</div>
                <div className="hr-report-summary-label">Total staff</div>
              </div>
            </div>
            <div className="hr-report-summary-item">
              <div className="stat-icon stat-icon-green"><IconActivity /></div>
              <div className="hr-report-summary-item-text">
                <div className="hr-report-summary-value">{data.activeEmployees}</div>
                <div className="hr-report-summary-label">Active</div>
              </div>
            </div>
            <div className="hr-report-summary-item">
              <div className="stat-icon stat-icon-purple"><IconActivity /></div>
              <div className="hr-report-summary-item-text">
                <div className="hr-report-summary-value">{data.inactiveEmployees}</div>
                <div className="hr-report-summary-label">Inactive</div>
              </div>
            </div>
          </div>
        )}

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap"><span className="spinner" /></span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Crunching the numbers…</p>
            </div>
          </div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap">
            <div className="hr-state hr-state-error">
              <div className="hr-state-icon"><IconAlertTriangle /></div>
              <p className="hr-state-title">Couldn't generate the report</p>
              <p className="hr-state-message">{error}</p>
              <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button>
            </div>
          </div>
        )}

        {showPanels && data && (
          <div className="hr-analytics-grid">
            <DistributionPanel
              icon={<IconBuilding />}
              iconVariant="blue"
              title="By Department"
              subtitle={`${data.byDepartment.length} departments`}
              slices={data.byDepartment.map((r) => ({
                label: r.name,
                count: r.total,
                percentage: data.totalEmployees > 0 ? Math.round((r.total / data.totalEmployees) * 1000) / 10 : 0,
              }))}
            />
            <DistributionPanel
              icon={<IconBuilding />}
              iconVariant="green"
              title="By Campus"
              subtitle={`${data.byBranch.length} campuses`}
              slices={data.byBranch.map((r) => ({
                label: r.name,
                count: r.total,
                percentage: data.totalEmployees > 0 ? Math.round((r.total / data.totalEmployees) * 1000) / 10 : 0,
              }))}
            />
            <DistributionPanel
              icon={<IconBadge />}
              iconVariant="gold"
              title="By Staff Type"
              subtitle={`${data.byStaffType.length} categories`}
              slices={data.byStaffType}
            />
            <DistributionPanel
              icon={<IconActivity />}
              iconVariant="purple"
              title="By Job Status"
              subtitle={`${data.byJobStatus.length} categories`}
              slices={data.byJobStatus}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffStrengthReportPage;
