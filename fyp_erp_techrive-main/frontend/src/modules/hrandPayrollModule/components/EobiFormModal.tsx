import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateEobiForm } from "../services/eobi.validation";
import { EMPTY_EOBI_FORM_VALUES, EOBI_STATUS } from "../services/eobi.types";
import type { EobiFormValues } from "../services/eobi.types";
import type { LookupOption } from "../services/employee.types";
import { useBranchesLookup } from "../hooks/useBranchesLookup";

interface EobiFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: EobiFormValues;
  staff: LookupOption[];
  schools: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: EobiFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EobiFormModal: React.FC<EobiFormModalProps> = ({
  open, mode, initialValues, staff, schools, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<EobiFormValues>(initialValues ?? EMPTY_EOBI_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // Company ("School") → Branch ("Campus") cascade (see the Company→Branch
  // scoping task). Both fields are independently optional on this record,
  // so when no school is selected we fall back to the full system-wide
  // campus list (hook called with no arg) rather than hiding Campus
  // entirely — that preserves the existing "campus only" and "school only"
  // use cases this form supports.
  const selectedCompanyId = values.company_id ? Number(values.company_id) : undefined;
  const { branches: campuses } = useBranchesLookup(selectedCompanyId);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof EobiFormValues) => errors[field];

  const handleChange = (field: keyof EobiFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const nextValue = e.target.value;
    setValues((prev) => ({
      ...prev,
      [field]: nextValue,
      // A campus from the old school is no longer valid/visible — clear it.
      ...(field === "company_id" ? { branch_id: "" } : {}),
    }));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateEobiForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="eobi-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="eobi-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "New EOBI/EPF Entry" : "Edit EOBI/EPF Entry"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Employee" htmlFor="eobi-staff" required error={err("staff_id")}>
              <select id="eobi-staff" className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`} value={values.staff_id} onChange={handleChange("staff_id")} disabled={submitting || mode === "edit"}>
                <option value="">Select employee…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>

            <FormField label="School" htmlFor="eobi-company" error={err("company_id")}>
              <select id="eobi-company" className="field-input hr-select" value={values.company_id} onChange={handleChange("company_id")} disabled={submitting}>
                <option value="">Optional…</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>

            <FormField label="Campus" htmlFor="eobi-branch" error={err("branch_id")}>
              <select id="eobi-branch" className="field-input hr-select" value={values.branch_id} onChange={handleChange("branch_id")} disabled={submitting}>
                <option value="">Optional…</option>
                {campuses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>

            <FormField label="EOBI Amount" htmlFor="eobi-eobi-amount" required error={err("eobi_amount")}>
              <input id="eobi-eobi-amount" inputMode="numeric" className={`field-input ${err("eobi_amount") ? "input-error" : ""}`} value={values.eobi_amount} onChange={handleChange("eobi_amount")} placeholder="0" disabled={submitting} autoFocus />
            </FormField>

            <FormField label="EPF Amount" htmlFor="eobi-epf-amount" required error={err("epf_amount")}>
              <input id="eobi-epf-amount" inputMode="numeric" className={`field-input ${err("epf_amount") ? "input-error" : ""}`} value={values.epf_amount} onChange={handleChange("epf_amount")} placeholder="0" disabled={submitting} />
            </FormField>

            <FormField label="Status" htmlFor="eobi-status" error={err("status")}>
              <select id="eobi-status" className="field-input hr-select" value={values.status} onChange={handleChange("status")} disabled={submitting}>
                <option value={EOBI_STATUS.PENDING}>Pending</option>
                <option value={EOBI_STATUS.PAID}>Paid</option>
                <option value={EOBI_STATUS.OVERDUE}>Overdue</option>
              </select>
            </FormField>
          </div>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Add Entry" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EobiFormModal;
