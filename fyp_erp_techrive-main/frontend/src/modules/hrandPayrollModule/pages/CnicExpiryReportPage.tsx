import React, { useState } from "react";
import { Link } from "react-router-dom";
import ExportCsvButton, { type CsvColumn } from "../components/ExportCsvButton";
import { useCnicExpiryReport } from "../hooks/useCnicExpiryReport";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useDepartmentsLookup } from "../hooks/useDepartmentsLookup";
import type { CnicExpiryRow } from "../services/report.types";
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

const IconIdCard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <circle cx="8" cy="10" r="2" />
    <line x1="6" y1="16" x2="10" y2="16" />
    <line x1="14" y1="9" x2="19" y2="9" />
    <line x1="14" y1="13" x2="19" y2="13" />
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

const csvColumns: CsvColumn<CnicExpiryRow>[] = [
  { header: "Employee ID", accessor: (r) => r.reg_no ?? "" },
  { header: "Name", accessor: (r) => r.full_name },
  { header: "CNIC", accessor: (r) => r.cnic },
  { header: "Department", accessor: (r) => r.department_name },
  { header: "Campus", accessor: (r) => r.branch_name },
  { header: "CNIC Expiry Date", accessor: (r) => formatDate(r.cnic_expiry_date_value) },
  { header: "Days Remaining", accessor: (r) => r.days_remaining },
];

// ─── CnicExpiryReportPage ─────────────────────────────────────────────────────
// HR/Employee Reports — every active employee whose CNIC expires inside the
// chosen window. staff.cnic_expiry_date is a real DATE column (see
// report.service.ts's getCnicExpiryReport), so this is a clean range query
// with no free-text parsing involved, unlike Contract & Probation Expiry.
const CnicExpiryReportPage: React.FC = () => {
  const { rows, total, filters, setFilters, loading, error, refetch } = useCnicExpiryReport({
    from: defaultFrom(),
    to: defaultTo(),
  });
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

  const expiredCount = rows.filter((r) => r.days_remaining < 0).length;

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
              <span className="breadcrumb-item breadcrumb-current">CNIC Expiry</span>
            </nav>
            <h1 className="hr-page-title">CNIC Expiry Report</h1>
          </div>

          <ExportCsvButton rows={rows} columns={csvColumns} filename="cnic-expiry-report" />
        </div>

        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="cnic-from">From</label>
            <input
              id="cnic-from"
              type="date"
              className="field-input"
              value={filters.from ?? ""}
              onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })}
            />
          </div>
          <div className="hr-report-filter-field">
            <label htmlFor="cnic-to">To</label>
            <input
              id="cnic-to"
              type="date"
              className="field-input"
              value={filters.to ?? ""}
              onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })}
            />
          </div>
          <div className="hr-report-filter-field">
            <label htmlFor="cnic-company">School / University</label>
            <select
              id="cnic-company"
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
            <label htmlFor="cnic-branch">Campus</label>
            <select
              id="cnic-branch"
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
            <label htmlFor="cnic-department">Department</label>
            <select
              id="cnic-department"
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
            <div className="stat-icon stat-icon-gold"><IconIdCard /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{total}</div>
              <div className="hr-report-summary-label">Expiring in range</div>
            </div>
          </div>
          <div className="hr-report-summary-item">
            <div className="stat-icon stat-icon-purple"><IconAlertTriangle /></div>
            <div className="hr-report-summary-item-text">
              <div className="hr-report-summary-value">{expiredCount}</div>
              <div className="hr-report-summary-label">Already expired</div>
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
              <div className="hr-state-icon"><IconIdCard /></div>
              <p className="hr-state-title">No CNICs expiring in this range</p>
              <p className="hr-state-message">Try widening the date range above.</p>
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
                    <th>CNIC</th>
                    <th>Department</th>
                    <th>Campus</th>
                    <th>Expiry Date</th>
                    <th>Days Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.reg_no ?? "—"}</td>
                      <td className="hr-table-name">{row.full_name}</td>
                      <td>{row.cnic}</td>
                      <td>{row.department_name}</td>
                      <td>{row.branch_name}</td>
                      <td>{formatDate(row.cnic_expiry_date_value)}</td>
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

export default CnicExpiryReportPage;
