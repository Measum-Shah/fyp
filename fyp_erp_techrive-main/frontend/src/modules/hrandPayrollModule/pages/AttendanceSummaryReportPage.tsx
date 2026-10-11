import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useAttendanceSummaryReport } from "../hooks/useAttendanceSummaryReport";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { monthAPI } from "../services/month.service";
import { yearAPI } from "../services/year.service";
import { leaveRequestAPI } from "../services/leaveRequest.service";
import type { Month } from "../services/month.types";
import type { Year } from "../services/year.types";
import type { EmployeeLookupOption } from "../services/leaveRequest.types";
import type { AttendanceSummaryReportRow } from "../services/attendanceReport.types";
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

const csvColumns: CsvColumn<AttendanceSummaryReportRow>[] = [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Employee", accessor: (r) => r.employee_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "Month", accessor: (r) => r.month_title },
  { header: "Year", accessor: (r) => r.year_title },
  { header: "Total Absences", accessor: (r) => r.total_absents ?? "" },
  { header: "Pay Status", accessor: (r) => r.pay_status },
  { header: "Approved Status", accessor: (r) => r.approved_status ?? "" },
];

// ─── AttendanceSummaryReportPage ─────────────────────────────────────────────
// Attendance Reports — the manually-entered monthly rollup (total absences,
// pay status, approval status per employee per month), straight from
// attendance_summary. See attendanceReport.service.ts's
// getAttendanceSummaryReport for why this reports the source table as-is
// rather than re-deriving totals from the daily employee_attendance rows.
const AttendanceSummaryReportPage: React.FC = () => {
  const { rows, meta, filters, setFilters, page, setPage, loading, error, refetch } =
    useAttendanceSummaryReport();

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

  const [months, setMonths] = useState<Month[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [employees, setEmployees] = useState<EmployeeLookupOption[]>([]);

  useEffect(() => {
    monthAPI.lookup().then((res) => setMonths(res.data)).catch(() => undefined);
    yearAPI.lookup().then((res) => setYears(res.data)).catch(() => undefined);
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
              <span className="breadcrumb-item breadcrumb-current">Attendance Summary</span>
            </nav>
            <h1 className="hr-page-title">Attendance Summary Report</h1>
          </div>

          <ExportCsvButton rows={rows} columns={csvColumns} filename="attendance-summary-report" />
        </div>

        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="att-sum-employee">Employee</label>
            <select
              id="att-sum-employee"
              className="field-input hr-select"
              value={filters.staff_id ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, staff_id: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">All employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="att-sum-company">School / University</label>
            <select
              id="att-sum-company"
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
            <label htmlFor="att-sum-branch">Campus</label>
            <select
              id="att-sum-branch"
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
            <label htmlFor="att-sum-month">Month</label>
            <select
              id="att-sum-month"
              className="field-input hr-select"
              value={filters.month_id ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, month_id: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">All months</option>
              {months.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="att-sum-year">Year</label>
            <select
              id="att-sum-year"
              className="field-input hr-select"
              value={filters.year_id ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, year_id: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>{y.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="hr-report-summary-strip">
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-blue"><IconClock /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{meta.total}</div>
              <div className="hr-report-summary-label">Summary records</div>
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
              <p className="hr-state-title">No matching summary records</p>
              <p className="hr-state-message">
                Try adjusting the filters above, or add monthly summaries from the Attendance Summaries page.
              </p>
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
                      <th>Month</th>
                      <th>Year</th>
                      <th>Total Absences</th>
                      <th>Pay Status</th>
                      <th>Approved Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.reg_no ?? "—"}</td>
                        <td className="hr-table-name">{row.employee_name}</td>
                        <td>{row.branch_name}</td>
                        <td>{row.month_title}</td>
                        <td>{row.year_title}</td>
                        <td>{row.total_absents ?? "—"}</td>
                        <td>{row.pay_status}</td>
                        <td>{row.approved_status ?? "—"}</td>
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

export default AttendanceSummaryReportPage;
