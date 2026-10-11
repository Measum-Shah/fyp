import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ExportExcelButton from "../components/ExportExcelButton";
import type { CsvColumn } from "../components/ExportCsvButton";
import { useGrossSalaryReport } from "../hooks/useGrossSalaryReport";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useDepartmentsLookup } from "../hooks/useDepartmentsLookup";
import type { GrossSalaryColumn, GrossSalaryRow } from "../services/payrollReport.types";
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

const IconUsers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const formatMoney = (value: number | null): string =>
  value == null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: 0 });

// Employee info + Gross Salary + every individual Allowance/Deduction/
// Payroll Deduction component + their totals + Arrears + Leaves + Net
// Salary — every column shown on screen, in the same order, and nothing
// else (no Notes/remarks column). Respects whatever Month/Year/Department/
// Branch filters are currently applied since `rows` is the same filtered
// data the table renders.
//
// The individual component columns (one per entry in
// meta.allowanceColumns/deductionColumns/payrollDeductionColumns) are
// built dynamically rather than hard-coded, so a new allowance type added
// in HR Settings appears in both the table and this export automatically —
// see buildCsvColumns below and the matching table header/body further
// down this file.
const buildBreakdownCsvColumns = (
  columns: GrossSalaryColumn[],
  group: "allowances_by_type" | "deductions_by_type" | "payroll_deductions_by_type"
): CsvColumn<GrossSalaryRow>[] =>
  columns.map((col) => ({
    header: col.label,
    accessor: (r) => r[group][col.key] ?? 0,
  }));

const buildCsvColumns = (meta: {
  allowanceColumns: GrossSalaryColumn[];
  deductionColumns: GrossSalaryColumn[];
  payrollDeductionColumns: GrossSalaryColumn[];
}): CsvColumn<GrossSalaryRow>[] => [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Employee", accessor: (r) => r.employee_name },
  { header: "Department", accessor: (r) => r.department_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "Gross Salary", accessor: (r) => r.gross_salary },
  ...buildBreakdownCsvColumns(meta.allowanceColumns, "allowances_by_type"),
  { header: "Allowances (Total)", accessor: (r) => r.allowances },
  ...buildBreakdownCsvColumns(meta.deductionColumns, "deductions_by_type"),
  { header: "Deductions (Total)", accessor: (r) => r.deductions ?? "" },
  ...buildBreakdownCsvColumns(meta.payrollDeductionColumns, "payroll_deductions_by_type"),
  { header: "Payroll Deductions (Total)", accessor: (r) => r.payroll_deductions },
  { header: "Arrears", accessor: (r) => r.arrears },
  { header: "Leaves", accessor: (r) => r.leaves },
  { header: "Net Salary", accessor: (r) => r.net_salary ?? "" },
  { header: "Status", accessor: (r) => r.salary_status },
];

// ─── GrossSalaryReportPage ─────────────────────────────────────────────────
// Payroll Reports — "how much salary did we pay this month". month_id/
// year_id default to the current calendar month on first paint (see
// useGrossSalaryReport / payrollReport.service.ts's currentMonthYear), so
// the total is already correct before the user touches a filter.
const GrossSalaryReportPage: React.FC = () => {
  const { rows, meta, filters, setFilters, loading, error, refetch } = useGrossSalaryReport();

  // Rebuilt whenever the column sets change (i.e. whenever a fresh report
  // response comes back) so a newly-added allowance/deduction type is
  // reflected in the exported file without any code change here.
  const csvColumns = useMemo(
    () =>
      buildCsvColumns({
        allowanceColumns: meta.allowanceColumns,
        deductionColumns: meta.deductionColumns,
        payrollDeductionColumns: meta.payrollDeductionColumns,
      }),
    [meta.allowanceColumns, meta.deductionColumns, meta.payrollDeductionColumns]
  );

  // School → Campus → Department cascade (see the Company→Branch→Department
  // scoping task). Department now genuinely depends on which Campus is
  // selected (via branch_departments — see useDepartmentsLookup), rather
  // than being a flat, unscoped system-wide list.
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
              <span className="breadcrumb-item breadcrumb-current">Gross Salary</span>
            </nav>
            <h1 className="hr-page-title">Gross Salary Report</h1>
          </div>

          <ExportExcelButton rows={rows} columns={csvColumns} filename="gross-salary-report" sheetName="Gross Salary" />
        </div>

        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="gs-month">Month (01-12)</label>
            <input
              id="gs-month"
              type="text"
              maxLength={2}
              placeholder="e.g. 06"
              className="field-input"
              value={filters.month_id ?? ""}
              onChange={(e) => setFilters({ ...filters, month_id: e.target.value || undefined })}
            />
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="gs-year">Year</label>
            <input
              id="gs-year"
              type="number"
              placeholder="e.g. 2026"
              className="field-input"
              value={filters.year_id ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, year_id: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>

          <div className="hr-report-filter-field">
            <label htmlFor="gs-company">School / University</label>
            <select
              id="gs-company"
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
            <label htmlFor="gs-branch">Campus</label>
            <select
              id="gs-branch"
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
            <label htmlFor="gs-department">Department</label>
            <select
              id="gs-department"
              className="field-input hr-select"
              value={filters.department_id ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, department_id: e.target.value ? Number(e.target.value) : undefined })
              }
              disabled={!filters.branch_id}
            >
              <option value="">{!filters.branch_id ? "Select a campus first…" : "All departments"}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="hr-report-summary-strip">
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-gold"><IconWallet /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{formatMoney(meta.totalGross)}</div>
              <div className="hr-report-summary-label">
                Total gross salary {meta.month_id && meta.year_id ? `(${meta.month_id}/${meta.year_id})` : ""}
              </div>
            </div>
          </div>
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-blue"><IconWallet /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{formatMoney(meta.totalNet)}</div>
              <div className="hr-report-summary-label">Total net salary</div>
            </div>
          </div>
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-purple"><IconUsers /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{meta.employeeCount}</div>
              <div className="hr-report-summary-label">Employees paid</div>
            </div>
          </div>
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-blue"><IconWallet /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{formatMoney(meta.totalAllowances)}</div>
              <div className="hr-report-summary-label">Total allowances</div>
            </div>
          </div>
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-gold"><IconWallet /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{formatMoney(meta.totalDeductions)}</div>
              <div className="hr-report-summary-label">Total deductions</div>
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
              <p className="hr-state-title">No salary sheets for this month yet</p>
              <p className="hr-state-message">Try a different month/year, or run payroll first.</p>
            </div>
          </div>
        )}

        {showTable && (
          <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
            <div className="hr-table-wrap">
              <table className="hr-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Employee ID</th>
                    <th rowSpan={2}>Employee</th>
                    <th rowSpan={2}>Department</th>
                    <th rowSpan={2}>Campus</th>
                    <th rowSpan={2}>Gross Salary</th>
                    {meta.allowanceColumns.length > 0 && (
                      <th colSpan={meta.allowanceColumns.length} className="hr-table-group-header">
                        Allowances
                      </th>
                    )}
                    <th rowSpan={2}>Allowances (Total)</th>
                    {meta.deductionColumns.length > 0 && (
                      <th colSpan={meta.deductionColumns.length} className="hr-table-group-header">
                        Deductions
                      </th>
                    )}
                    <th rowSpan={2}>Deductions (Total)</th>
                    {meta.payrollDeductionColumns.length > 0 && (
                      <th colSpan={meta.payrollDeductionColumns.length} className="hr-table-group-header">
                        Payroll Deductions
                      </th>
                    )}
                    <th rowSpan={2}>Payroll Deductions (Total)</th>
                    <th rowSpan={2}>Arrears</th>
                    <th rowSpan={2}>Leaves</th>
                    <th rowSpan={2}>Net Salary</th>
                    <th rowSpan={2}>Status</th>
                  </tr>
                  <tr>
                    {meta.allowanceColumns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    {meta.deductionColumns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    {meta.payrollDeductionColumns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.reg_no ?? "—"}</td>
                      <td className="hr-table-name">{row.employee_name}</td>
                      <td>{row.department_name}</td>
                      <td>{row.branch_name}</td>
                      <td>{formatMoney(row.gross_salary)}</td>
                      {meta.allowanceColumns.map((col) => (
                        <td key={col.key}>{formatMoney(row.allowances_by_type[col.key] ?? 0)}</td>
                      ))}
                      <td>{formatMoney(row.allowances)}</td>
                      {meta.deductionColumns.map((col) => (
                        <td key={col.key}>{formatMoney(row.deductions_by_type[col.key] ?? 0)}</td>
                      ))}
                      <td>{formatMoney(row.deductions)}</td>
                      {meta.payrollDeductionColumns.map((col) => (
                        <td key={col.key}>{formatMoney(row.payroll_deductions_by_type[col.key] ?? 0)}</td>
                      ))}
                      <td>{formatMoney(row.payroll_deductions)}</td>
                      <td>{formatMoney(row.arrears)}</td>
                      <td>{row.leaves}</td>
                      <td>{formatMoney(row.net_salary)}</td>
                      <td>
                        <span
                          className={`hr-badge ${
                            row.salary_status === "Paid"
                              ? "hr-badge-success"
                              : row.salary_status === "Rejected"
                              ? "hr-badge-danger"
                              : "hr-badge-neutral"
                          }`}
                        >
                          {row.salary_status}
                        </span>
                      </td>
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

export default GrossSalaryReportPage;