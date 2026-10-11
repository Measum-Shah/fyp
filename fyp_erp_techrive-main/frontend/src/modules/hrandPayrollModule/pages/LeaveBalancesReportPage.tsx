import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useLeaveBalancesReport } from "../hooks/useLeaveBalancesReport";
import { leaveTypeAPI } from "../services/leaveType.service";
import { leaveRequestAPI } from "../services/leaveRequest.service";
import type { LookupOption } from "../services/employee.types";
import type { EmployeeLookupOption } from "../services/leaveRequest.types";
import type { LeaveBalanceReportRow } from "../services/leaveReport.types";
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

const IconClock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const csvColumns: CsvColumn<LeaveBalanceReportRow>[] = [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Employee", accessor: (r) => r.employee_name },
  { header: "Leave Type", accessor: (r) => r.leave_type_name },
  { header: "Entitled Days", accessor: (r) => r.no_of_days },
  { header: "Used Days", accessor: (r) => r.days_used },
  { header: "Remaining Days", accessor: (r) => r.remaining_days },
  { header: "Period Start", accessor: (r) => formatDate(r.start_date) },
  { header: "Period End", accessor: (r) => formatDate(r.end_date) },
];

// ─── LeaveBalancesReportPage ─────────────────────────────────────────────────
// Leave Reports — entitled vs. used vs. remaining days, one row per
// (employee, leave type) entitlement record. Straight from
// erp_hrm_leave_entitlements — no_of_days and days_used are tracked there
// directly, so "remaining" here is just no_of_days - days_used, not derived
// from leave request history (see leaveReport.service.ts for why).
const LeaveBalancesReportPage: React.FC = () => {
  const { rows, meta, filters, setFilters, page, setPage, loading, error, refetch } =
    useLeaveBalancesReport();
  const [leaveTypes, setLeaveTypes] = useState<LookupOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeLookupOption[]>([]);

  useEffect(() => {
    leaveTypeAPI.lookup().then((res) => setLeaveTypes(res.data)).catch(() => undefined);
    leaveRequestAPI.lookups.employees().then((res) => setEmployees(res.data)).catch(() => undefined);
  }, []);

  const showBigLoadingState = loading && rows.length === 0 && !error;
  const showErrorState = !loading && error && rows.length === 0;
  const showEmptyState = !loading && !error && rows.length === 0;
  const showTable = !showBigLoadingState && !showErrorState && !showEmptyState;

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
              <span className="breadcrumb-item breadcrumb-current">Leave Balances</span>
            </nav>
            <h1 className="hr-page-title">Leave Balances Report</h1>
          </div>

          <ExportCsvButton rows={rows} columns={csvColumns} filename="leave-balances-report" />
        </div>


        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="leave-bal-employee">Employee</label>
            <select
              id="leave-bal-employee"
              className="field-input hr-select"
              value={filters.employee_id ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, employee_id: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">All employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="leave-bal-type">Leave Type</label>
            <select
              id="leave-bal-type"
              className="field-input hr-select"
              value={filters.leave_type_id ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, leave_type_id: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">All types</option>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="hr-report-summary-strip">
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-green"><IconClock /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{meta.total}</div>
              <div className="hr-report-summary-label">Entitlement records</div>
            </div>
          </div>
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap"><span className="spinner" /></span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Generating report…</p>
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

        {showEmptyState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <div className="hr-state-icon"><IconClock /></div>
              <p className="hr-state-title">No entitlement records</p>
              <p className="hr-state-message">Try adjusting the filters above.</p>
            </div>
          </div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Entitled</th>
                      <th>Used</th>
                      <th>Remaining</th>
                      <th>Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.reg_no ?? "—"}</td>
                        <td className="hr-table-name">{row.employee_name}</td>
                        <td>{row.leave_type_name}</td>
                        <td>{row.no_of_days}</td>
                        <td>{row.days_used}</td>
                        <td>{row.remaining_days}</td>
                        <td>{formatDate(row.start_date)} – {formatDate(row.end_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
};

export default LeaveBalancesReportPage;
