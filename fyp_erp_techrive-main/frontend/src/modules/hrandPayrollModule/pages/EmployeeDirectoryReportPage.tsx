import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useEmployeeDirectoryReport } from "../hooks/useEmployeeDirectoryReport";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useDepartmentsLookup } from "../hooks/useDepartmentsLookup";
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

const IconUsers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const csvColumns: CsvColumn<EmployeeDirectoryRow>[] = [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Name", accessor: (r) => r.full_name },
  { header: "Email", accessor: (r) => r.email },
  { header: "Mobile", accessor: (r) => r.mobile_1 ?? "" },
  { header: "CNIC", accessor: (r) => r.cnic },
  { header: "Designation", accessor: (r) => r.designation ?? "" },
  { header: "Staff Type", accessor: (r) => r.staff_type },
  { header: "Department", accessor: (r) => r.department_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "School / University", accessor: (r) => r.company_name },
  { header: "Status", accessor: (r) => r.status ?? "" },
  { header: "Join Date", accessor: (r) => formatDate(r.join_date) },
];

// ─── EmployeeDirectoryReportPage ─────────────────────────────────────────────
// Employee Reports — a filterable, paginated, exportable master list of
// every employee, joined with department/branch/company names. Real
// page/limit pagination now (not a flat capped dump) — CSV export still
// exports only the current page, since that's the only data the browser
// has; exporting the full filtered set would need a separate "export all"
// backend call, which isn't built here to avoid re-adding the unbounded
// query this pagination pass was meant to remove.
const EmployeeDirectoryReportPage: React.FC = () => {
  const { rows, meta, filters, setFilters, page, setPage, loading, error, refetch } =
    useEmployeeDirectoryReport();
    // Company → Branch cascade (see the Company→Branch scoping task).
  const [companyId, setCompanyId] = useState<number | null>(null);
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);
  const { departments } = useDepartmentsLookup(filters.branch_id);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value ? Number(e.target.value) : null;
    setCompanyId(next);
    // A campus from the old school is no longer valid/visible — clear it,
    // and a department from the old campus is no longer valid either.
    setFilters({ ...filters, branch_id: undefined, department_id: undefined, company_id: next ?? undefined });
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value ? Number(e.target.value) : undefined;
    // A department from the old campus is no longer valid/visible — clear it.
    setFilters({ ...filters, branch_id: next, department_id: undefined });
  };

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
              <span className="breadcrumb-item breadcrumb-current">Employee Directory</span>
            </nav>
            <h1 className="hr-page-title">Employee Directory Report</h1>
          </div>

          <ExportCsvButton
            rows={rows}
            columns={csvColumns}
            filename="employee-directory-report"
          />
        </div>


        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field" style={{ minWidth: 240 }}>
            <label htmlFor="directory-search">Search</label>
            <SearchBar
              value={search}
              onChange={changeSearch}
              placeholder="Search by name, email, ID or designation…"
            />
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="directory-company">School / University</label>
            <select
              id="directory-company"
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
            <label htmlFor="directory-branch">Campus</label>
            <select
              id="directory-branch"
              className="field-input hr-select"
              value={filters.branch_id ?? ""}
              onChange={handleBranchChange}
              disabled={companyId == null}
            >
              <option value="">{companyId == null ? "Select a school / university first…" : "All campuses"}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="directory-department">Department</label>
            <select
              id="directory-department"
              className="field-input hr-select"
              value={filters.department_id ?? ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  department_id: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              disabled={!filters.branch_id}
            >
              <option value="">{!filters.branch_id ? "Select a campus first…" : "All departments"}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="directory-status">Status</label>
            <select
              id="directory-status"
              className="field-input hr-select"
              value={filters.status ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value || undefined })
              }
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="hr-report-summary-strip">
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-blue"><IconUsers /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{meta.total}</div>
              <div className="hr-report-summary-label">Matching employees</div>
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

        {showEmptyState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <div className="hr-state-icon"><IconUsers /></div>
              <p className="hr-state-title">No matching employees</p>
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
                      <th>Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th>Campus</th>
                      <th>School / University</th>
                      <th>Status</th>
                      <th>Join Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.reg_no ?? "—"}</td>
                        <td className="hr-table-name">{row.full_name}</td>
                        <td>{row.email}</td>
                        <td>{row.mobile_1 ?? "—"}</td>
                        <td>{row.designation ?? "—"}</td>
                        <td>{row.department_name}</td>
                        <td>{row.branch_name}</td>
                        <td>{row.company_name}</td>
                        <td>{row.status ?? "—"}</td>
                        <td>{formatDate(row.join_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeDirectoryReportPage;
