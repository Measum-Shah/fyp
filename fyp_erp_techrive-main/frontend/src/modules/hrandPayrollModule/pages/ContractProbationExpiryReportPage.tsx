import React, { useState } from "react";
import { Link } from "react-router-dom";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useContractProbationExpiryReport } from "../hooks/useContractProbationExpiryReport";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useDepartmentsLookup } from "../hooks/useDepartmentsLookup";
import type { ContractProbationExpiryRow } from "../services/report.types";
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

const IconFileText = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);
const defaultFrom = () => toIsoDate(new Date());
const defaultTo = () => {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return toIsoDate(d);
};

const daysRemainingLabel = (days: number): string => {
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days}d left`;
};

const csvColumns: CsvColumn<ContractProbationExpiryRow>[] = [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Name", accessor: (r) => r.full_name },
  { header: "Type", accessor: (r) => r.expiry_type },
  { header: "Department", accessor: (r) => r.department_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "Expiry Date", accessor: (r) => formatDate(r.expiry_date_value) },
  { header: "Days Remaining", accessor: (r) => r.days_remaining },
];

// ─── ContractProbationExpiryReportPage ───────────────────────────────────────
// HR/Employee Reports — employees whose contract end date (end_day_contract)
// or probation end date (probation) falls inside the chosen window. Both
// source fields are free text (see report.service.ts's
// getContractProbationExpiryReport), so a row only appears here if its raw
// value happened to parse as a real calendar date — that's expected, not a
// data-quality bug this page needs to flag.
const ContractProbationExpiryReportPage: React.FC = () => {
  const { rows, total, filters, setFilters, loading, error, refetch } =
    useContractProbationExpiryReport({ from: defaultFrom(), to: defaultTo() });
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

  const showBigLoadingState = loading && rows.length === 0 && !error;
  const showErrorState = !loading && error && rows.length === 0;
  const showEmptyState = !loading && !error && rows.length === 0;
  const showTable = !showBigLoadingState && !showErrorState && !showEmptyState;

  const contractCount = rows.filter((r) => r.expiry_type === "Contract").length;
  const probationCount = rows.filter((r) => r.expiry_type === "Probation").length;

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
              <span className="breadcrumb-item breadcrumb-current">Contract &amp; Probation Expiry</span>
            </nav>
            <h1 className="hr-page-title">Contract &amp; Probation Expiry Report</h1>
          </div>

          <ExportCsvButton rows={rows} columns={csvColumns} filename="contract-probation-expiry-report" />
        </div>

        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="cpe-from">From</label>
            <input
              id="cpe-from"
              type="date"
              className="field-input"
              value={filters.from ?? ""}
              onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })}
            />
          </div>
          <div className="hr-report-filter-field">
            <label htmlFor="cpe-to">To</label>
            <input
              id="cpe-to"
              type="date"
              className="field-input"
              value={filters.to ?? ""}
              onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })}
            />
          </div>
          <div className="hr-report-filter-field">
            <label htmlFor="cpe-type">Type</label>
            <select
              id="cpe-type"
              className="field-input hr-select"
              value={filters.type ?? ""}
              onChange={(e) =>
                setFilters({ ...filters, type: (e.target.value || undefined) as "contract" | "probation" | undefined })
              }
            >
              <option value="">Contract &amp; Probation</option>
              <option value="contract">Contract only</option>
              <option value="probation">Probation only</option>
            </select>
          </div>
          <div className="hr-report-filter-field">
            <label htmlFor="cpe-company">School / University</label>
            <select
              id="cpe-company"
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
            <label htmlFor="cpe-branch">Campus</label>
            <select
              id="cpe-branch"
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
            <label htmlFor="cpe-department">Department</label>
            <select
              id="cpe-department"
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
            <div className="stat-icon stat-icon-blue"><IconFileText /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{total}</div>
              <div className="hr-report-summary-label">Total expiring</div>
            </div>
          </div>
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-gold"><IconFileText /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{contractCount}</div>
              <div className="hr-report-summary-label">Contracts</div>
            </div>
          </div>
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-purple"><IconFileText /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{probationCount}</div>
              <div className="hr-report-summary-label">Probations</div>
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
              <div className="hr-state-icon"><IconFileText /></div>
              <p className="hr-state-title">Nothing expiring in this range</p>
              <p className="hr-state-message">
                Only employees with a parseable contract end date or probation end date show up
                here. Try widening the date range above.
              </p>
            </div>
          </div>
        )}

        {showTable && (
          <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
            <div className="hr-table-wrap">
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Department</th>
                    <th>Campus</th>
                    <th>Expiry Date</th>
                    <th>Days Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.id}-${row.expiry_type}`}>
                      <td>{row.reg_no ?? "—"}</td>
                      <td className="hr-table-name">{row.full_name}</td>
                      <td>
                        <span className={`hr-badge ${row.expiry_type === "Contract" ? "hr-badge-info" : "hr-badge-neutral"}`}>
                          {row.expiry_type}
                        </span>
                      </td>
                      <td>{row.department_name}</td>
                      <td>{row.branch_name}</td>
                      <td>{formatDate(row.expiry_date_value)}</td>
                      <td>
                        <span className={`hr-badge ${row.days_remaining < 0 ? "hr-badge-danger" : row.days_remaining <= 30 ? "hr-badge-warning" : ""}`}>
                          {daysRemainingLabel(row.days_remaining)}
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

export default ContractProbationExpiryReportPage;
