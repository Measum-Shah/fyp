import React, { useState } from "react";
import { Link } from "react-router-dom";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { usePayrollRunSummaryReport } from "../hooks/usePayrollRunSummaryReport";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import type { PayrollRunSummaryRow } from "../services/payrollReport.types";
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

const formatMoney = (value: number): string => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

const csvColumns: CsvColumn<PayrollRunSummaryRow>[] = [
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "Month", accessor: (r) => r.month_year },
  { header: "Employees", accessor: (r) => r.employee_count },
  { header: "Total Gross", accessor: (r) => r.total_gross },
  { header: "Total Deductions", accessor: (r) => r.total_deductions },
  { header: "Total Net", accessor: (r) => r.total_net },
];

// ─── PayrollRunSummaryReportPage ─────────────────────────────────────────────
// Payroll Reports — one row per (branch, month) payroll run, with employee
// count and gross/net/deductions totals pulled from the salary sheets each
// run generated. See payrollReport.service.ts's getPayrollRunSummaryReport
// for why this is aggregated in JS rather than a SQL join — payroll_employees
// and erp_staff_salaries aren't linked by a real FK.
const PayrollRunSummaryReportPage: React.FC = () => {
  const { rows, totalRuns, filters, setFilters, loading, error, refetch } = usePayrollRunSummaryReport();

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
              <span className="breadcrumb-item breadcrumb-current">Payroll Run Summary</span>
            </nav>
            <h1 className="hr-page-title">Payroll Run Summary</h1>
          </div>

          <ExportCsvButton rows={rows} columns={csvColumns} filename="payroll-run-summary-report" />
        </div>


        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="run-company">School / University</label>
            <select
              id="run-company"
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
            <label htmlFor="run-branch">Campus</label>
            <select
              id="run-branch"
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
            <label htmlFor="run-month">Month (YYYY-MM)</label>
            <input
              id="run-month"
              type="month"
              className="field-input"
              value={filters.month_year ?? ""}
              onChange={(e) => setFilters({ ...filters, month_year: e.target.value || undefined })}
            />
          </div>
        </div>

        <div className="hr-report-summary-strip">
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-gold"><IconWallet /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{totalRuns}</div>
              <div className="hr-report-summary-label">Payroll runs</div>
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
              <p className="hr-state-title">No payroll runs found</p>
              <p className="hr-state-message">Try adjusting the filters above, or run payroll from the Payroll Runs page first.</p>
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
                    <th>Month</th>
                    <th>Employees</th>
                    <th>Total Gross</th>
                    <th>Total Deductions</th>
                    <th>Total Net</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.branch_id}-${row.month_year}`}>
                      <td className="hr-table-name">{row.branch_name}</td>
                      <td>{row.month_year}</td>
                      <td>{row.employee_count}</td>
                      <td>{formatMoney(row.total_gross)}</td>
                      <td>{formatMoney(row.total_deductions)}</td>
                      <td>{formatMoney(row.total_net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollRunSummaryReportPage;
