import React from "react";
import { Link } from "react-router-dom";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useHeadcountByBranchReport } from "../hooks/useHeadcountByBranchReport";
import type { BranchHeadcountRow } from "../services/report.types";
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

const IconArrows = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="17" y1="17" x2="21" y2="17" />
    <polyline points="17 13 21 17 17 21" />
    <line x1="7" y1="7" x2="3" y2="7" />
    <polyline points="7 3 3 7 7 11" />
  </svg>
);

const IconUsers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);

const csvColumns: CsvColumn<BranchHeadcountRow>[] = [
  { header: "Campus", accessor: (r) => r.name },
  { header: "School / University", accessor: (r) => r.company_name },
  { header: "Total Employees", accessor: (r) => r.total },
  { header: "Active", accessor: (r) => r.active },
  { header: "Inactive", accessor: (r) => r.inactive },
];

// ─── HeadcountByBranchReportPage ─────────────────────────────────────────────
// Phase 1, Report 3: one row per branch (grouped visually by company via the
// Company column), with active/inactive employee counts.
const HeadcountByBranchReportPage: React.FC = () => {
  const { rows, totalEmployees, loading, error, refetch } = useHeadcountByBranchReport();

  const showBigLoadingState = loading && rows.length === 0 && !error;
  const showErrorState = !loading && error;
  const showTable = !showBigLoadingState && !showErrorState;

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
              <span className="breadcrumb-item breadcrumb-current">Headcount by Campus</span>
            </nav>
            <h1 className="hr-page-title">Headcount by Campus</h1>
          </div>

          <ExportCsvButton
            rows={rows}
            columns={csvColumns}
            filename="headcount-by-branch-report"
          />
        </div>


        <div className="hr-report-summary-strip">
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-blue"><IconArrows /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{rows.length}</div>
              <div className="hr-report-summary-label">Campuses</div>
            </div>
          </div>
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-green"><IconUsers /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{totalEmployees}</div>
              <div className="hr-report-summary-label">Total employees</div>
            </div>
          </div>
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap"><span className="spinner" /></span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Generating report…
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

        {showTable && (
          <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
            <div className="hr-table-wrap">
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Campus</th>
                    <th>School / University</th>
                    <th>Total Employees</th>
                    <th>Active</th>
                    <th>Inactive</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="hr-table-name">{row.name}</td>
                      <td>{row.company_name}</td>
                      <td>{row.total}</td>
                      <td>{row.active}</td>
                      <td>{row.inactive}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                        No campuses yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadcountByBranchReportPage;