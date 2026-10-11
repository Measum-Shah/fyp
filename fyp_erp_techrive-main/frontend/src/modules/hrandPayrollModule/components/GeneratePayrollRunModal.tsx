import React, { useState } from "react";
import FormField from "./FormField";
import { payrollRunAPI } from "../services/payrollRun.service";
import { getApiErrorMessage } from "../services/employee.service";
import { EMPTY_GENERATE_RUN_FORM_VALUES } from "../services/payrollRun.types";
import type { EligibleStaffMember, GenerateRunFormValues } from "../services/payrollRun.types";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";

interface GeneratePayrollRunModalProps {
  open: boolean;
  submitting: boolean;
  onSubmit: (values: GenerateRunFormValues, staffIds: number[], staffIdsWithoutActiveBankAccount: number[]) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// This modal deliberately does NOT ask for per-employee salary figures — it
// pulls gross/basic/allowances/EPF/EOBI/tax straight from each employee's own
// stored payroll fields on the staff record (see payrollRun.service.ts). The
// only thing the user picks here is *who* is included in this run.
const GeneratePayrollRunModal: React.FC<GeneratePayrollRunModalProps> = ({
  open,
  submitting,
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<GenerateRunFormValues>(EMPTY_GENERATE_RUN_FORM_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [eligible, setEligible] = useState<EligibleStaffMember[] | null>(null);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Company → Branch cascade — the Branch dropdown only shows branches
  // belonging to the selected Company (see the Company→Branch scoping task).
  const [companyId, setCompanyId] = useState<number | null>(null);
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);

  if (!open) return null;

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value ? Number(e.target.value) : null;
    setCompanyId(next);
    // A branch from the old company is no longer valid/visible — clear it.
    setValues((prev) => ({ ...prev, branch_id: "" }));
    setEligible(null);
    setSelectedIds(new Set());
  };

  const handleChange = (field: keyof GenerateRunFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    // Changing the scope invalidates whatever eligible list was loaded before.
    setEligible(null);
    setSelectedIds(new Set());
  };

  const handleLoadEligible = async () => {
    const nextErrors: Record<string, string> = {};
    if (!values.branch_id) nextErrors.branch_id = "Campus is required";
    if (!values.month_year) nextErrors.month_year = "Month is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoadingEligible(true);
    setLoadError(null);
    try {
      const res = await payrollRunAPI.eligibleStaff(Number(values.branch_id), values.month_year);
      setEligible(res.data);
      setSelectedIds(new Set(res.data.map((s) => s.id)));
    } catch (err) {
      setLoadError(getApiErrorMessage(err));
      setEligible([]);
    } finally {
      setLoadingEligible(false);
    }
  };

  const toggleStaff = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!eligible) return;
    setSelectedIds((prev) => (prev.size === eligible.length ? new Set() : new Set(eligible.map((s) => s.id))));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!values.branch_id) nextErrors.branch_id = "Campus is required";
    if (!values.month_year) nextErrors.month_year = "Month is required";
    if (!values.ledger_id) nextErrors.ledger_id = "Ledger id is required";
    if (!values.financial_year) nextErrors.financial_year = "Financial year is required";
    if (selectedIds.size === 0) nextErrors.staff_ids = "Select at least one employee";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const selected = Array.from(selectedIds);
    const withoutActiveBankAccount = (eligible ?? [])
      .filter((s) => selectedIds.has(s.id) && !s.has_active_bank_account)
      .map((s) => s.id);
    onSubmit(values, selected, withoutActiveBankAccount);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form hr-modal-form-wide" role="dialog" aria-modal="true" aria-labelledby="run-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="run-modal-title" className="hr-modal-title hr-modal-title-left">Generate Payroll Run</h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="School / University" htmlFor="run-company" required>
              <select id="run-company" className="field-input hr-select" value={companyId ?? ""} onChange={handleCompanyChange} disabled={submitting}>
                <option value="">Select school / university…</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>

            <FormField label="Campus" htmlFor="run-branch" required error={errors.branch_id}>
              <select id="run-branch" className={`field-input hr-select ${errors.branch_id ? "input-error" : ""}`} value={values.branch_id} onChange={handleChange("branch_id")} disabled={submitting || companyId == null}>
                <option value="">{companyId == null ? "Select a school / university first…" : "Select campus…"}</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FormField>

            <FormField label="Month" htmlFor="run-month" required error={errors.month_year}>
              <input id="run-month" type="month" className={`field-input ${errors.month_year ? "input-error" : ""}`} value={values.month_year} onChange={handleChange("month_year")} disabled={submitting} />
            </FormField>

            <FormField label="Ledger ID" htmlFor="run-ledger" required error={errors.ledger_id} hint="Applied to every sheet generated in this run.">
              <input id="run-ledger" inputMode="numeric" className={`field-input ${errors.ledger_id ? "input-error" : ""}`} value={values.ledger_id} onChange={handleChange("ledger_id")} disabled={submitting} />
            </FormField>

            <FormField label="Financial Year" htmlFor="run-fy" required error={errors.financial_year}>
              <input id="run-fy" inputMode="numeric" className={`field-input ${errors.financial_year ? "input-error" : ""}`} value={values.financial_year} onChange={handleChange("financial_year")} disabled={submitting} />
            </FormField>
          </div>

          <button type="button" className="hr-btn hr-btn-secondary" onClick={handleLoadEligible} disabled={submitting || loadingEligible}>
            {loadingEligible ? (
              <span className="spinner-wrap"><span className="spinner" />Loading…</span>
            ) : eligible ? "Reload Eligible Employees" : "Load Eligible Employees"}
          </button>

          {loadError && <p className="hr-field-error" role="alert">{loadError}</p>}

          {eligible !== null && (
            <div style={{ marginTop: "1rem" }}>
              {eligible.length === 0 ? (
                <p className="hr-field-hint">
                  No eligible employees found — everyone active in this branch already has a sheet or is already in this run for {values.month_year}.
                </p>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <p className="hr-field-hint" style={{ margin: 0 }}>
                      {selectedIds.size} of {eligible.length} selected
                    </p>
                    <button type="button" className="hr-btn hr-btn-ghost" onClick={toggleAll} disabled={submitting}>
                      {selectedIds.size === eligible.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="hr-table-wrap" style={{ maxHeight: "260px", overflowY: "auto" }}>
                    <table className="hr-table">
                      <tbody>
                        {eligible.map((s) => (
                          <tr key={s.id}>
                            <td style={{ width: "2.5rem" }}>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(s.id)}
                                onChange={() => toggleStaff(s.id)}
                                disabled={submitting}
                              />
                            </td>
                            <td className="hr-table-name">{s.name}</td>
                            <td>{s.reg_no ?? "—"}</td>
                            <td>
                              {!s.has_active_bank_account && (
                                <span className="hr-badge hr-badge-warning" title="No active bank account on file — salary cannot actually be credited for this employee">
                                  No active bank account
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {errors.staff_ids && <p className="hr-field-error">{errors.staff_ids}</p>}
            </div>
          )}

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting || !eligible || selectedIds.size === 0}>
              {submitting ? (
                <span className="spinner-wrap"><span className="spinner" />Generating…</span>
              ) : `Generate ${selectedIds.size || ""} Sheet${selectedIds.size === 1 ? "" : "s"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GeneratePayrollRunModal;
