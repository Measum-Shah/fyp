import React, { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useSalaryRegisterReport } from "../hooks/useSalaryRegisterReport";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import type { SalaryRegisterRow } from "../services/payrollReport.types";
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

const IconWallet = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const formatMoney = (value: number | null): string =>
  value == null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: 0 });

const csvColumns: CsvColumn<SalaryRegisterRow>[] = [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Employee", accessor: (r) => r.employee_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "Month", accessor: (r) => r.month_id ?? "" },
  { header: "Year", accessor: (r) => r.year_id ?? "" },
  { header: "Gross Salary", accessor: (r) => r.gross_salary },
  { header: "Basic Salary", accessor: (r) => r.basic_salary ?? "" },
  { header: "EOBI", accessor: (r) => r.eobi_amount ?? "" },
  { header: "EPF", accessor: (r) => r.epf_amount ?? "" },
  { header: "Tax", accessor: (r) => r.tax_amount ?? "" },
  { header: "Loan Deduction", accessor: (r) => r.loan_amount ?? "" },
  { header: "Net Salary", accessor: (r) => r.net_salary ?? "" },
  { header: "Status", accessor: (r) => r.salary_status },
];

// ─── SalaryRegisterReportPage ────────────────────────────────────────────────
// Payroll Reports — per-employee salary breakdown, straight from
// erp_staff_salaries (the Salary Sheet table). Real pagination, same as the
// Employee Directory report — this table grows one row per employee per
// month, so it's the other report in this module that genuinely needs it.
const SalaryRegisterReportPage: React.FC = () => {
  const { rows, meta, filters, setFilters, page, setPage, loading, error, refetch } =
    useSalaryRegisterReport();

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
              <span className="breadcrumb-item breadcrumb-current">Salary Register</span>
            </nav>
            <h1 className="hr-page-title">Salary Register Report</h1>
          </div>

          <ExportCsvButton rows={rows} columns={csvColumns} filename="salary-register-report" />
        </div>


        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="salary-company">School / University</label>
            <select
              id="salary-company"
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
            <label htmlFor="salary-branch">Campus</label>
            <select
              id="salary-branch"
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
            <label htmlFor="salary-status">Status</label>
            <select
              id="salary-status"
              className="field-input hr-select"
              value={filters.salary_status ?? ""}
              onChange={(e) => setFilters({ ...filters, salary_status: e.target.value || undefined })}
            >
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Paid">Paid</option>
            </select>
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="salary-month">Month (01-12)</label>
            <input
              id="salary-month"
              type="text"
              maxLength={2}
              placeholder="e.g. 06"
              className="field-input"
              value={filters.month_id ?? ""}
              onChange={(e) => setFilters({ ...filters, month_id: e.target.value || undefined })}
            />
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="salary-year">Year</label>
            <input
              id="salary-year"
              type="number"
              placeholder="e.g. 2026"
              className="field-input"
              value={filters.year_id ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, year_id: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
        </div>

        <div className="hr-report-summary-strip">
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-gold"><IconWallet /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{meta.total}</div>
              <div className="hr-report-summary-label">Salary sheets</div>
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
              <div className="hr-state-icon"><IconWallet /></div>
              <p className="hr-state-title">No salary sheets found</p>
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
                      <th>Month/Year</th>
                      <th>Gross</th>
                      <th>EOBI</th>
                      <th>EPF</th>
                      <th>Tax</th>
                      <th>Loan Deduction</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.reg_no ?? "—"}</td>
                        <td className="hr-table-name">{row.employee_name}</td>
                        <td>{row.branch_name}</td>
                        <td>{row.month_id ?? "—"}/{row.year_id ?? "—"}</td>
                        <td>{formatMoney(row.gross_salary)}</td>
                        <td>{formatMoney(row.eobi_amount)}</td>
                        <td>{formatMoney(row.epf_amount)}</td>
                        <td>{formatMoney(row.tax_amount)}</td>
                        <td>{formatMoney(row.loan_amount)}</td>
                        <td>{formatMoney(row.net_salary)}</td>
                        <td>{row.salary_status}</td>
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

export default SalaryRegisterReportPage;
