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

const IconUserMinus = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
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

// Default range: the last 30 days, up to and including today — a sensible
// starting point the user can widen or narrow.
const defaultFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return toIsoDate(d);
};
const defaultTo = () => toIsoDate(new Date());

const buildCsvColumns = (): CsvColumn<EmployeeDirectoryRow>[] => [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Name", accessor: (r) => r.full_name },
  { header: "Department", accessor: (r) => r.department_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "Designation", accessor: (r) => r.designation ?? "" },
  { header: "Join Date", accessor: (r) => formatDate(r.join_date) },
];

const joinersCsvColumns = buildCsvColumns();
const exitsCsvColumns = buildCsvColumns();

interface MiniTableProps {
  rows: EmployeeDirectoryRow[];
  emptyLabel: string;
}

const MiniTable: React.FC<MiniTableProps> = ({ rows, emptyLabel }) => (
  <div className="hr-table-wrap">
    <table className="hr-table">
      <thead>
        <tr>
          <th>Employee ID</th>
          <th>Name</th>
          <th>Department</th>
          <th>Campus</th>
          <th>Join Date</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.reg_no ?? "—"}</td>
            <td className="hr-table-name">{row.full_name}</td>
            <td>{row.department_name}</td>
            <td>{row.branch_name}</td>
            <td>{formatDate(row.join_date)}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
              {emptyLabel}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// ─── JoinersExitsReportPage ──────────────────────────────────────────────────
// Phase 1, Report 4: employees who joined vs. left within a chosen date
// range. "Left" is derived from staff.deleted_at (see report.service.ts's
// getJoinersAndExitsReport for why that's the most accurate signal
// available today) — this report doubles as a soft explanation of that
// limitation for HR users, since there's no dedicated resignation date yet.
const JoinersExitsReportPage: React.FC = () => {
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

  // Auto-generate once on first mount with the default 30-day range, so the
  // page isn't empty on first load.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { generate(); }, []);

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
              <span className="breadcrumb-item breadcrumb-current">New Joiners &amp; Exits</span>
            </nav>
            <h1 className="hr-page-title">New Joiners &amp; Exits</h1>
          </div>
        </div>


        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="joiners-from">From</label>
            <input
              id="joiners-from"
              type="date"
              className="field-input"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="hr-report-filter-field">
            <label htmlFor="joiners-to">To</label>
            <input
              id="joiners-to"
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
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Generating report…
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="hr-table-wrap">
            <div className="hr-state hr-state-error">
              <div className="hr-state-icon"><IconAlertTriangle /></div>
              <p className="hr-state-title">Couldn't generate the report</p>
              <p className="hr-state-message">{error}</p>
              <button type="button" className="hr-btn hr-btn-primary" onClick={generate}>
                Try again
              </button>
            </div>
          </div>
        )}

        {hasRun && !error && data && (
          <>
            <div className="hr-report-summary-strip">
              <div className="hr-report-summary-item">
                <div className="stat-icon stat-icon-green"><IconUserPlus /></div>
                <div className="hr-report-summary-item-text">
                  <div className="hr-report-summary-value">{data.joiners.length}</div>
                  <div className="hr-report-summary-label">New joiners</div>
                </div>
              </div>
              <div className="hr-report-summary-item">
                <div className="stat-icon stat-icon-gold"><IconUserMinus /></div>
                <div className="hr-report-summary-item-text">
                  <div className="hr-report-summary-value">{data.exits.length}</div>
                  <div className="hr-report-summary-label">Exits</div>
                </div>
              </div>
            </div>

            <div className="hr-report-columns">
              <div>
                <div className="hr-report-column-heading">
                  <span>Joiners ({data.joiners.length})</span>
                  <ExportCsvButton
                    rows={data.joiners}
                    columns={joinersCsvColumns}
                    filename={`joiners-${from}-to-${to}`}
                  />
                </div>
                <MiniTable rows={data.joiners} emptyLabel="No one joined in this date range." />
              </div>

              <div>
                <div className="hr-report-column-heading">
                  <span>Exits ({data.exits.length})</span>
                  <ExportCsvButton
                    rows={data.exits}
                    columns={exitsCsvColumns}
                    filename={`exits-${from}-to-${to}`}
                  />
                </div>
                <MiniTable rows={data.exits} emptyLabel="No exits in this date range." />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinersExitsReportPage;