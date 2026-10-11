import React, { useEffect, useState } from "react";
import FormField from "./FormField";
import { computeNewGrossSalary, isFormValid, validateIncrementForm } from "../services/increment.validation";
import { EMPTY_INCREMENT_FORM_VALUES } from "../services/increment.types";
import type { IncrementFormValues } from "../services/increment.types";
import type { LookupOption } from "../services/employee.types";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { incrementAPI } from "../services/increment.service";

interface IncrementFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: IncrementFormValues;
  staff: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: IncrementFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// status is managed separately (see IncrementsPage.tsx's status action), not
// from this form.
const IncrementFormModal: React.FC<IncrementFormModalProps> = ({
  open, mode, initialValues, staff, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<IncrementFormValues>(initialValues ?? EMPTY_INCREMENT_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // School → Campus cascade (Company/Branch under the hood — see the
  // Company→Branch scoping task). Edit mode has no stored company_id to
  // prefill, so default to the legacy full list (undefined) rather than
  // empty/gated — otherwise the existing Campus selection would vanish
  // from the dropdown.
  const [companyId, setCompanyId] = useState<number | null | undefined>(
    mode === "edit" ? undefined : null
  );
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);

  // New Gross Salary = Previous Gross Salary + Increment Amount — always
  // kept in sync as a computed, read-only figure (see
  // increment.validation.ts#computeNewGrossSalary). The server independently
  // recomputes the same formula on save, so the two can never drift.
  useEffect(() => {
    const computed = String(computeNewGrossSalary(values.previous_gross_salary, values.amount));
    setValues((prev) => (prev.new_salary_increment === computed ? prev : { ...prev, new_salary_increment: computed }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.previous_gross_salary, values.amount]);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof IncrementFormValues) => errors[field];

  const clearError = (field: keyof IncrementFormValues) => {
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Employee's live salary snapshot (School, Campus, Current Basic Salary,
  // Previous Gross Salary) — never hardcoded, always fetched fresh so the
  // form reflects that employee's (and, once picked, that Campus's)
  // existing salary data.
  const applySnapshot = async (staffId: number, branchId?: number) => {
    setSnapshotLoading(true);
    try {
      const res = await incrementAPI.getStaffSalarySnapshot(staffId, branchId);
      const snapshot = res.data;
      setCompanyId(snapshot.company_id ?? null);
      setValues((prev) => ({
        ...prev,
        branch_id: snapshot.branch_id != null ? String(snapshot.branch_id) : prev.branch_id,
        basic_salary: String(snapshot.basic_salary ?? 0),
        previous_gross_salary: String(snapshot.previous_gross_salary ?? 0),
      }));
    } catch {
      // Snapshot is a convenience auto-fill — if it fails, leave the salary
      // fields as-is so the request can still be filled in manually.
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleChange = (field: keyof IncrementFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const nextValue = e.target.value;
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    clearError(field);
  };

  const handleStaffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const staffId = e.target.value;
    setValues((prev) => ({ ...prev, staff_id: staffId, branch_id: "", basic_salary: "", previous_gross_salary: "" }));
    clearError("staff_id");
    if (staffId) {
      applySnapshot(Number(staffId));
    } else {
      setCompanyId(null);
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanyId(e.target.value ? Number(e.target.value) : null);
    // A campus from the old school is no longer valid/visible — clear it.
    setValues((prev) => ({ ...prev, branch_id: "" }));
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value;
    setValues((prev) => ({ ...prev, branch_id: branchId }));
    clearError("branch_id");
    // The employee changed which campus this increment is against — refresh
    // the salary figures for that specific campus (erp_staff_salaries is
    // keyed per employee *and* branch).
    if (values.staff_id && branchId) {
      applySnapshot(Number(values.staff_id), Number(branchId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateIncrementForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  const numberField = (field: keyof IncrementFormValues, label: string, id: string, required = false, readOnly = false, hint?: string) => (
    <FormField label={label} htmlFor={id} required={required} error={err(field)} hint={hint}>
      <input
        id={id}
        inputMode="numeric"
        className={`field-input ${err(field) ? "input-error" : ""}`}
        value={values[field]}
        onChange={handleChange(field)}
        placeholder="0"
        disabled={submitting || (readOnly ? false : snapshotLoading && (field === "basic_salary" || field === "previous_gross_salary"))}
        readOnly={readOnly}
      />
    </FormField>
  );

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="increment-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="increment-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "New Increment Request" : "Edit Increment Request"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Employee" htmlFor="inc-staff" required error={err("staff_id")}>
              <select id="inc-staff" className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`} value={values.staff_id} onChange={handleStaffChange} disabled={submitting || mode === "edit"}>
                <option value="">Select employee…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>

            <FormField label="School" htmlFor="inc-company">
              <select id="inc-company" className="field-input hr-select" value={companyId ?? ""} onChange={handleCompanyChange} disabled={submitting}>
                <option value="">Select school…</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>

            <FormField label="Campus" htmlFor="inc-branch" required error={err("branch_id")}>
              <select id="inc-branch" className={`field-input hr-select ${err("branch_id") ? "input-error" : ""}`} value={values.branch_id} onChange={handleBranchChange} disabled={submitting || companyId === null}>
                <option value="">{companyId === null ? "Select a school first…" : "Select campus…"}</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FormField>

            <FormField label="Increment Date" htmlFor="inc-date" required error={err("increment_date")}>
              <input id="inc-date" type="date" className={`field-input ${err("increment_date") ? "input-error" : ""}`} value={values.increment_date} onChange={handleChange("increment_date")} disabled={submitting} />
            </FormField>

            {numberField("basic_salary", "Current Basic Salary", "inc-basic", true, false, snapshotLoading ? "Fetching from employee records…" : "Auto-filled from the employee's salary records")}
            {numberField("previous_gross_salary", "Previous Gross Salary", "inc-prev-gross", true, false, snapshotLoading ? "Fetching from employee records…" : "Auto-filled from the employee's salary records")}
            {numberField("amount", "Increment Amount", "inc-amount", true)}
            {numberField("new_salary_increment", "New Gross Salary", "inc-new-gross", true, true, "Previous Gross Salary + Increment Amount")}
          </div>

          <FormField label="Reason" htmlFor="inc-reason" required error={err("reason")}>
            <textarea id="inc-reason" className="field-input hr-textarea" value={values.reason} onChange={handleChange("reason")} placeholder="Why is this increment being requested?" rows={2} disabled={submitting} />
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Submit Request" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncrementFormModal;
