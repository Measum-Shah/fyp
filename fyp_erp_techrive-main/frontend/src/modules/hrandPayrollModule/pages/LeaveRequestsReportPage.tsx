import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useLeaveRequestsReport } from "../hooks/useLeaveRequestsReport";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { leaveTypeAPI } from "../services/leaveType.service";
import { leaveStatusAPI } from "../services/leaveStatus.service";
import { leaveRequestAPI } from "../services/leaveRequest.service";
import type { LookupOption } from "../services/employee.types";
import type { EmployeeLookupOption } from "../services/leaveRequest.types";
import type { LeaveRequestReportRow } from "../services/leaveReport.types";
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

const IconCalendarOff = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const csvColumns: CsvColumn<LeaveRequestReportRow>[] = [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Employee", accessor: (r) => r.employee_name },
  { header: "Leave Type", accessor: (r) => r.leave_type_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "Status", accessor: (r) => r.leave_status_name },
  { header: "Start Date", accessor: (r) => formatDate(r.start_date) },
  { header: "End Date", accessor: (r) => formatDate(r.end_date) },
  { header: "Total Days", accessor: (r) => r.total_days },
  { header: "Applied Date", accessor: (r) => formatDate(r.applied_date) },
];

// ─── LeaveRequestsReportPage ─────────────────────────────────────────────────
// Leave Reports — every leave request, filterable by employee, type, status,
// branch and a start-date range. Built entirely on erp_hrm_leave_requests
// (see leaveReport.service.ts's getLeaveRequestsReport), the same table
// Leave Management's own request-review workflow uses.
const LeaveRequestsReportPage: React.FC = () => {
  const { rows, meta, filters, setFilters, page, setPage, loading, error, refetch } =
    useLeaveRequestsReport();

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

  const [leaveTypes, setLeaveTypes] = useState<LookupOption[]>([]);
  const [leaveStatuses, setLeaveStatuses] = useState<LookupOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeLookupOption[]>([]);

  useEffect(() => {
    leaveTypeAPI.lookup().then((res) => setLeaveTypes(res.data)).catch(() => undefined);
    leaveStatusAPI.lookup().then((res) => setLeaveStatuses(res.data)).catch(() => undefined);
    leaveRequestAPI.lookups.employees().then((res) => setEmployees(res.data)).catch(() => undefined);
  }, []);

  const search = filters.search ?? "";
  const changeSearch = (value: string) => setFilters({ ...filters, search: value || undefined });

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
              <span className="breadcrumb-item breadcrumb-current">Leave Requests</span>
            </nav>
            <h1 className="hr-page-title">Leave Requests Report</h1>
          </div>

          <ExportCsvButton rows={rows} columns={csvColumns} filename="leave-requests-report" />
        </div>


        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field" style={{ minWidth: 220 }}>
            <label htmlFor="leave-req-search">Search</label>
            <SearchBar value={search} onChange={changeSearch} placeholder="Search by name, ID or remarks…" />
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="leave-req-employee">Employee</label>
            <select
              id="leave-req-employee"
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
            <label htmlFor="leave-req-type">Leave Type</label>
            <select
              id="leave-req-type"
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

          <div className="hr-report-filter-field">
            <label htmlFor="leave-req-status">Status</label>
            <select
              id="leave-req-status"
              className="field-input hr-select"
              value={filters.leave_status ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, leave_status: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">All statuses</option>
              {leaveStatuses.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="leave-req-company">School / University</label>
            <select
              id="leave-req-company"
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
            <label htmlFor="leave-req-branch">Campus</label>
            <select
              id="leave-req-branch"
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
            <label htmlFor="leave-req-from">From</label>
            <input
              id="leave-req-from"
              type="date"
              className="field-input"
              value={filters.from ?? ""}
              onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })}
            />
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="leave-req-to">To</label>
            <input
              id="leave-req-to"
              type="date"
              className="field-input"
              value={filters.to ?? ""}
              onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })}
            />
          </div>
        </div>

        <div className="hr-report-summary-strip">
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-green"><IconCalendarOff /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{meta.total}</div>
              <div className="hr-report-summary-label">Matching requests</div>
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
              <div className="hr-state-icon"><IconCalendarOff /></div>
              <p className="hr-state-title">No matching leave requests</p>
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
                      <th>Campus</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Total Days</th>
                      <th>Applied Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.reg_no ?? "—"}</td>
                        <td className="hr-table-name">{row.employee_name}</td>
                        <td>{row.leave_type_name}</td>
                        <td>{row.branch_name}</td>
                        <td>{row.leave_status_name}</td>
                        <td>{formatDate(row.start_date)}</td>
                        <td>{formatDate(row.end_date)}</td>
                        <td>{row.total_days}</td>
                        <td>{formatDate(row.applied_date)}</td>
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

export default LeaveRequestsReportPage;
