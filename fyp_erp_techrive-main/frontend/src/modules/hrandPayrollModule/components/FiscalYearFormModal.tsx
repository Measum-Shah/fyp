import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateFiscalYearForm } from "../services/fiscalYear.validation";
import { EMPTY_FISCAL_YEAR_FORM_VALUES, FISCAL_YEAR_STATUS } from "../services/fiscalYear.types";
import type { FiscalYearFormValues } from "../services/fiscalYear.types";

interface FiscalYearFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: FiscalYearFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: FiscalYearFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FiscalYearFormModal: React.FC<FiscalYearFormModalProps> = ({
  open, mode, initialValues, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<FiscalYearFormValues>(initialValues ?? EMPTY_FISCAL_YEAR_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof FiscalYearFormValues) => errors[field];

  const handleChange = (field: keyof FiscalYearFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const nextValue = field === "status" ? Number(e.target.value) : e.target.value;
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateFiscalYearForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="fiscal-year-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="fiscal-year-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Fiscal Year" : "Edit Fiscal Year"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Name" htmlFor="fy-name" required error={err("name")}>
            <input id="fy-name" className={`field-input ${err("name") ? "input-error" : ""}`} value={values.name} onChange={handleChange("name")} placeholder="e.g. FY 2026-27" disabled={submitting} autoFocus />
          </FormField>

          <div className="hr-form-grid">
            <FormField label="Start Date" htmlFor="fy-start" required error={err("start_date")}>
              <input id="fy-start" type="date" className={`field-input ${err("start_date") ? "input-error" : ""}`} value={values.start_date} onChange={handleChange("start_date")} disabled={submitting} />
            </FormField>

            <FormField label="End Date" htmlFor="fy-end" required error={err("end_date")}>
              <input id="fy-end" type="date" className={`field-input ${err("end_date") ? "input-error" : ""}`} value={values.end_date} onChange={handleChange("end_date")} disabled={submitting} />
            </FormField>
          </div>

          <FormField label="Status" htmlFor="fy-status" error={err("status")}>
            <select id="fy-status" className="field-input hr-select" value={values.status} onChange={handleChange("status")} disabled={submitting}>
              <option value={FISCAL_YEAR_STATUS.ACTIVE}>Active</option>
              <option value={FISCAL_YEAR_STATUS.INACTIVE}>Inactive</option>
            </select>
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Create Fiscal Year" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FiscalYearFormModal;
