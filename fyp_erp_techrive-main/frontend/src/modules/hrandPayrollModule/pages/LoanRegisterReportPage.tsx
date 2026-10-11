import React, { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useLoanRegisterReport } from "../hooks/useLoanRegisterReport";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { LOAN_REQUEST_STATUS, LOAN_REQUEST_STATUS_LABELS } from "../services/loanRequest.types";
import type { LoanRegisterRow } from "../services/payrollReport.types";
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

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const formatMoney = (value: number | null): string =>
  value == null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: 0 });

const csvColumns: CsvColumn<LoanRegisterRow>[] = [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Employee", accessor: (r) => r.employee_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "Type", accessor: (r) => r.type },
  { header: "Amount", accessor: (r) => r.amount },
  { header: "Installments", accessor: (r) => r.installments },
  { header: "Monthly Installment", accessor: (r) => r.monthly_installment ?? "" },
  { header: "Remaining Balance", accessor: (r) => r.remaining_balance ?? "" },
  { header: "Status", accessor: (r) => LOAN_REQUEST_STATUS_LABELS[r.status] ?? r.status },
  { header: "Effective From", accessor: (r) => formatDate(r.effective_from) },
];

// ─── LoanRegisterReportPage ───────────────────────────────────────────────
// Payroll Reports — active/outstanding employee loans, straight from
// request_loan_employee. No deleted_at on this table (see
// payrollReport.service.ts's getLoanRegisterReport), so every loan record
// ever created shows up here unless filtered by status.
const LoanRegisterReportPage: React.FC = () => {
  const { rows, meta, filters, setFilters, page, setPage, loading, error, refetch } =
    useLoanRegisterReport();

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
              <span className="breadcrumb-item breadcrumb-current">Loan Register</span>
            </nav>
            <h1 className="hr-page-title">Loan Register Report</h1>
          </div>

          <ExportCsvButton rows={rows} columns={csvColumns} filename="loan-register-report" />
        </div>


        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="loan-company">School / University</label>
            <select
              id="loan-company"
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
            <label htmlFor="loan-branch">Campus</label>
            <select
              id="loan-branch"
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
            <label htmlFor="loan-status">Status</label>
            <select
              id="loan-status"
              className="field-input hr-select"
              value={filters.status ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value ? Number(e.target.value) : undefined })
              }
            >
              <option value="">All statuses</option>
              <option value={LOAN_REQUEST_STATUS.PENDING}>Pending</option>
              <option value={LOAN_REQUEST_STATUS.APPROVED}>Approved</option>
              <option value={LOAN_REQUEST_STATUS.REJECTED}>Rejected</option>
            </select>
          </div>
        </div>

        <div className="hr-report-summary-strip">
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-gold"><IconWallet /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{meta.total}</div>
              <div className="hr-report-summary-label">Loan records</div>
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
              <p className="hr-state-title">No loan records found</p>
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
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Installments</th>
                      <th>Monthly</th>
                      <th>Remaining Balance</th>
                      <th>Status</th>
                      <th>Effective From</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.reg_no ?? "—"}</td>
                        <td className="hr-table-name">{row.employee_name}</td>
                        <td>{row.branch_name}</td>
                        <td>{row.type}</td>
                        <td>{formatMoney(row.amount)}</td>
                        <td>{row.installments}</td>
                        <td>{formatMoney(row.monthly_installment)}</td>
                        <td>{formatMoney(row.remaining_balance)}</td>
                        <td>{LOAN_REQUEST_STATUS_LABELS[row.status] ?? row.status}</td>
                        <td>{formatDate(row.effective_from)}</td>
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

export default LoanRegisterReportPage;
