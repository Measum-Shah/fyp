import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useJoinersExitsReport } from "../hooks/useJoinersExitsReport";
import type { EmployeeDirectoryRow } from "../services/report.types";
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

const IconUserPlus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="17" y1="11" x2="23" y2="11" />
  </svg>
);

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

// New Joining Report defaults to a wider 90-day window than the combined
// Joiners & Exits report's 30 days — HR typically reviews "who joined this
// quarter", not just the last month.
const defaultFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return toIsoDate(d);
};
const defaultTo = () => toIsoDate(new Date());

const csvColumns: CsvColumn<EmployeeDirectoryRow>[] = [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Name", accessor: (r) => r.full_name },
  { header: "Department", accessor: (r) => r.department_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "Designation", accessor: (r) => r.designation ?? "" },
  { header: "Join Date", accessor: (r) => formatDate(r.join_date) },
];

// ─── NewJoiningReportPage ─────────────────────────────────────────────────
// HR Reports — a dedicated, single-table view of new hires within a date
// range. This is the same data as the "Joiners" half of the combined
// Joiners & Exits report (GET /reports/joiners-exits — see
// report.service.ts's getJoinersAndExitsReport) with the exits column
// dropped, so onboarding-focused pages don't need attrition context mixed
// in.
const NewJoiningReportPage: React.FC = () => {
  const { data, loading, error, hasRun, run } = useJoinersExitsReport();
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [rangeError, setRangeError] = useState<string | null>(null);

  const generate = () => {
    if (!from || !to) {
      setRangeError("Both a start and end date are required.");
      return;
    }
    if (new Date(from).getTime() > new Date(to).getTime()) {
      setRangeError("The start date must be on or before the end date.");
      return;
    }
    setRangeError(null);
    run({ from, to });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { generate(); }, []);

  const joiners = data?.joiners ?? [];

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
              <span className="breadcrumb-item breadcrumb-current">New Joining Report</span>
            </nav>
            <h1 className="hr-page-title">New Joining Report</h1>
          </div>

          <ExportCsvButton rows={joiners} columns={csvColumns} filename={`new-joiners-${from}-to-${to}`} />
        </div>

        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="nj-from">From</label>
            <input
              id="nj-from"
              type="date"
              className="field-input"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="hr-report-filter-field">
            <label htmlFor="nj-to">To</label>
            <input
              id="nj-to"
              type="date"
              className="field-input"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="hr-report-filter-actions">
            <button type="button" className="hr-btn hr-btn-primary" onClick={generate} disabled={loading}>
              {loading ? "Generating…" : "Generate report"}
            </button>
          </div>
        </div>

        {rangeError && (
          <p className="hr-field-error" role="alert" style={{ marginTop: "-0.75rem", marginBottom: "1rem" }}>
            {rangeError}
          </p>
        )}

        {loading && !hasRun && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap"><span className="spinner" /></span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Generating report…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="hr-table-wrap">
            <div className="hr-state hr-state-error">
              <div className="hr-state-icon"><IconAlertTriangle /></div>
              <p className="hr-state-title">Couldn't generate the report</p>
              <p className="hr-state-message">{error}</p>
              <button type="button" className="hr-btn hr-btn-primary" onClick={generate}>Try again</button>
            </div>
          </div>
        )}

        {hasRun && !error && (
          <>
            <div className="hr-report-summary-strip">
              <div className="hr-report-summary-item">
                <div className="stat-icon stat-icon-green"><IconUserPlus /></div>
                <div className="hr-report-summary-item-text">
                  <div className="hr-report-summary-value">{joiners.length}</div>
                  <div className="hr-report-summary-label">New joiners</div>
                </div>
              </div>
            </div>

            <div className="hr-table-wrap">
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Campus</th>
                    <th>Designation</th>
                    <th>Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {joiners.map((row) => (
                    <tr key={row.id}>
                      <td>{row.reg_no ?? "—"}</td>
                      <td className="hr-table-name">{row.full_name}</td>
                      <td>{row.department_name}</td>
                      <td>{row.branch_name}</td>
                      <td>{row.designation ?? "—"}</td>
                      <td>{formatDate(row.join_date)}</td>
                    </tr>
                  ))}
                  {joiners.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                        No one joined in this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewJoiningReportPage;
