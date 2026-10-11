import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useAttendanceRecordsReport } from "../hooks/useAttendanceRecordsReport";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { attendanceStatusAPI } from "../services/attendanceStatus.service";
import { leaveRequestAPI } from "../services/leaveRequest.service";
import type { AttendanceStatus } from "../services/attendanceStatus.types";
import type { EmployeeLookupOption } from "../services/leaveRequest.types";
import type { AttendanceRecordReportRow } from "../services/attendanceReport.types";
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

const csvColumns: CsvColumn<AttendanceRecordReportRow>[] = [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Employee", accessor: (r) => r.employee_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "Date", accessor: (r) => formatDate(r.attendance_date) },
  { header: "Status", accessor: (r) => r.status_title },
  { header: "Time In", accessor: (r) => r.time_in ?? "" },
  { header: "Time Out", accessor: (r) => r.time_out ?? "" },
  { header: "Remarks", accessor: (r) => r.remarks ?? "" },
];

// ─── AttendanceRecordsReportPage ────────────────────────────────────────────
// Attendance Reports — every daily attendance record, filterable by
// employee, branch, status, and a date range. Straight from
// employee_attendance (see attendanceReport.service.ts's
// getAttendanceRecordsReport), the same table the Attendance page's own
// marking workflow uses.
const AttendanceRecordsReportPage: React.FC = () => {
  const { rows, meta, filters, setFilters, page, setPage, loading, error, refetch } =
    useAttendanceRecordsReport();

  // Company → Branch cascade (see the Company→Branch scoping task).
  const [companyId, setCompanyId] = useState<number | null>(null);
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value ? Number(e.target.value) : null;
    setCompanyId(next);
    // A branch from the old company is no longer valid/visible — clear it.
    setFilters({ ...filters, branch_id: undefined, company_id: next ?? undefined });
  };

  const [statuses, setStatuses] = useState<AttendanceStatus[]>([]);
  const [employees, setEmployees] = useState<EmployeeLookupOption[]>([]);

  useEffect(() => {
    attendanceStatusAPI.lookup().then((res) => setStatuses(res.data)).catch(() => undefined);
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
              <span className="breadcrumb-item breadcrumb-current">Attendance Records</span>
            </nav>
            <h1 className="hr-page-title">Attendance Records Report</h1>
          </div>

          <ExportCsvButton rows={rows} columns={csvColumns} filename="attendance-records-report" />
        </div>

        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="att-rec-employee">Employee</label>
            <select
              id="att-rec-employee"
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
            <label htmlFor="att-rec-company">School / University</label>
            <select
              id="att-rec-company"
              className="field-input hr-select"
              value={companyId ?? ""}
              onChange={handleCompanyChange}
            >
              <option value="">All school / university</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="att-rec-branch">Campus</label>
            <select
              id="att-rec-branch"
              className="field-input hr-select"
              value={filters.branch_id ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, branch_id: e.target.value ? Number(e.target.value) : undefined })
              }
              disabled={companyId == null}
            >
              <option value="">{companyId == null ? "Select a school / university first…" : "All campuses"}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="att-rec-status">Status</label>
            <select
              id="att-rec-status"
              className="field-input hr-select"
              value={filters.status ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="att-rec-from">From</label>
            <input
              id="att-rec-from"
              type="date"
              className="field-input"
              value={filters.from ?? ""}
              onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })}
            />
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="att-rec-to">To</label>
            <input
              id="att-rec-to"
              type="date"
              className="field-input"
              value={filters.to ?? ""}
              onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })}
            />
          </div>
        </div>

        <div className="hr-report-summary-strip">
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-blue"><IconClock /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{meta.total}</div>
              <div className="hr-report-summary-label">Matching records</div>
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
              <p className="hr-state-title">No matching attendance records</p>
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
                      <th>Campus</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.reg_no ?? "—"}</td>
                        <td className="hr-table-name">{row.employee_name}</td>
                        <td>{row.branch_name}</td>
                        <td>{formatDate(row.attendance_date)}</td>
                        <td>{row.status_title}</td>
                        <td>{row.time_in ?? "—"}</td>
                        <td>{row.time_out ?? "—"}</td>
                        <td>{row.remarks ?? "—"}</td>
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

export default AttendanceRecordsReportPage;
