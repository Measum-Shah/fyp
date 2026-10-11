import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSalarySlips } from "../hooks/useSalarySlips";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useDepartmentsLookup } from "../hooks/useDepartmentsLookup";
import type { SalarySlipRow } from "../services/payrollReport.types";
import SalarySlip from "../components/SalarySlip";
import "./employee-module.css";
import "./salary-slip.css";

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

const IconPrinter = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const formatMoney = (value: number | string | null): string => {
  if (value == null) return "0";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

// ─── BulkSalarySlipPage ─────────────────────────────────────────────────────
// Payroll Reports — generate every employee's salary slip for a chosen
// month/year (optionally scoped to a branch/department), pick which ones to
// print, then hand off to the browser's native print dialog. No PDF library
// is added for this — @media print in salary-slip.css hides everything on
// the page except .salary-slip-print-area and forces one slip per printed
// page, which is what "bulk print" actually needs.
const BulkSalarySlipPage: React.FC = () => {
  const { rows, loading, error, hasRun, run } = useSalarySlips();
  // School → Campus → Department cascade (see the Company→Branch→Department
  // scoping task).
  const [companyId, setCompanyId] = useState<number | null>(null);
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(now.getFullYear());
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const { departments } = useDepartmentsLookup(branchId);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanyId(e.target.value ? Number(e.target.value) : null);
    // A campus from the old school is no longer valid/visible — clear it,
    // and a department from the old campus is no longer valid either.
    setBranchId(undefined);
    setDepartmentId(undefined);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBranchId(e.target.value ? Number(e.target.value) : undefined);
    // A department from the old campus is no longer valid/visible — clear it.
    setDepartmentId(undefined);
  };

  const generate = async () => {
    if (!month || !year) {
      setFormError("Both month and year are required.");
      return;
    }
    setFormError(null);
    await run({
      month_id: month,
      year_id: year,
      branch_id: branchId,
      company_id: companyId ?? undefined,
      department_id: departmentId,
    });
  };

  // Select everything by default whenever a fresh batch comes back.
  const rowsKey = rows.map((r) => r.sheet_id).join(",");
  const [lastRowsKey, setLastRowsKey] = useState("");
  if (rowsKey !== lastRowsKey) {
    setLastRowsKey(rowsKey);
    setSelectedIds(new Set(rows.map((r) => r.sheet_id)));
  }

  const selectedSlips = useMemo(
    () => rows.filter((r) => selectedIds.has(r.sheet_id)),
    [rows, selectedIds]
  );

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.sheet_id))));
  };

  const handlePrint = () => {
    window.print();
  };

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
              <span className="breadcrumb-item breadcrumb-current">Bulk Salary Slips</span>
            </nav>
            <h1 className="hr-page-title">Bulk Salary Slip Print</h1>
          </div>

          {selectedSlips.length > 0 && (
            <button type="button" className="hr-btn hr-btn-primary" onClick={handlePrint}>
              <IconPrinter /> Print {selectedSlips.length} slip{selectedSlips.length === 1 ? "" : "s"}
            </button>
          )}
        </div>

        <div className="hr-report-filter-bar">
          <div className="hr-report-filter-field">
            <label htmlFor="bs-month">Month (01-12)</label>
            <input
              id="bs-month"
              type="text"
              maxLength={2}
              className="field-input"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="hr-report-filter-field">
            <label htmlFor="bs-year">Year</label>
            <input
              id="bs-year"
              type="number"
              className="field-input"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
          <div className="hr-report-filter-field">
            <label htmlFor="bs-company">School / University</label>
            <select
              id="bs-company"
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
            <label htmlFor="bs-branch">Campus</label>
            <select
              id="bs-branch"
              className="field-input hr-select"
              value={branchId ?? ""}
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
            <label htmlFor="bs-department">Department</label>
            <select
              id="bs-department"
              className="field-input hr-select"
              value={departmentId ?? ""}
              onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : undefined)}
              disabled={!branchId}
            >
              <option value="">{!branchId ? "Select a campus first…" : "All departments"}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="hr-report-filter-actions">
            <button type="button" className="hr-btn hr-btn-primary" onClick={generate} disabled={loading}>
              {loading ? "Generating…" : "Generate slips"}
            </button>
          </div>
        </div>

        {formError && (
          <p className="hr-field-error" role="alert" style={{ marginTop: "-0.75rem", marginBottom: "1rem" }}>
            {formError}
          </p>
        )}

        {loading && !hasRun && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap"><span className="spinner" /></span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Generating slips…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="hr-table-wrap">
            <div className="hr-state hr-state-error">
              <div className="hr-state-icon"><IconAlertTriangle /></div>
              <p className="hr-state-title">Couldn't generate slips</p>
              <p className="hr-state-message">{error}</p>
              <button type="button" className="hr-btn hr-btn-primary" onClick={generate}>Try again</button>
            </div>
          </div>
        )}

        {hasRun && !error && rows.length === 0 && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <div className="hr-state-icon"><IconPrinter /></div>
              <p className="hr-state-title">No salary sheets for this month</p>
              <p className="hr-state-message">Try a different month/year, or run payroll first.</p>
            </div>
          </div>
        )}

        {hasRun && !error && rows.length > 0 && (
          <>
            {/* Selection list — hidden from print via @media print's blanket visibility rule */}
            <div className="hr-table-wrap">
              <div className="salary-slip-select-row">
                <input
                  type="checkbox"
                  checked={selectedIds.size === rows.length}
                  onChange={toggleAll}
                  id="bs-select-all"
                />
                <label htmlFor="bs-select-all" style={{ fontWeight: 600 }}>
                  {selectedIds.size} of {rows.length} selected
                </label>
              </div>
              {rows.map((r) => (
                <div className="salary-slip-select-row" key={r.sheet_id}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.sheet_id)}
                    onChange={() => toggleOne(r.sheet_id)}
                    id={`bs-row-${r.sheet_id}`}
                  />
                  <label htmlFor={`bs-row-${r.sheet_id}`} style={{ flex: 1 }}>
                    {r.employee_name} <span style={{ color: "var(--text-secondary, #666)" }}>({r.reg_no ?? "—"} · {r.department_name})</span>
                  </label>
                  <span>{formatMoney(r.net_salary)}</span>
                </div>
              ))}
            </div>

            {/* Print preview — this is the only part that survives @media print */}
            <div className="salary-slip-print-area" style={{ marginTop: "1.5rem" }}>
              {selectedSlips.map((slip) => (
                <SalarySlip key={slip.sheet_id} slip={slip} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BulkSalarySlipPage;
