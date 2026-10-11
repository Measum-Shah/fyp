import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateLoanTypeForm } from "../services/loanType.validation";
import { EMPTY_LOAN_TYPE_FORM_VALUES } from "../services/loanType.types";
import type { LoanTypeFormValues } from "../services/loanType.types";

interface LoanTypeFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: LoanTypeFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: LoanTypeFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LoanTypeFormModal: React.FC<LoanTypeFormModalProps> = ({
  open, mode, initialValues, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<LoanTypeFormValues>(initialValues ?? EMPTY_LOAN_TYPE_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof LoanTypeFormValues) => errors[field];

  const handleChange = (field: keyof LoanTypeFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const nextValue = e.target.value;
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
    const validationErrors = validateLoanTypeForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="loan-type-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="loan-type-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Loan Type" : "Edit Loan Type"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Loan Type Name" htmlFor="lt-name" required error={err("loan_type")}>
            <input id="lt-name" className={`field-input ${err("loan_type") ? "input-error" : ""}`} value={values.loan_type} onChange={handleChange("loan_type")} placeholder="e.g. Advance Salary" disabled={submitting} autoFocus />
          </FormField>

          <FormField label="Description" htmlFor="lt-description" required error={err("description")}>
            <textarea id="lt-description" className={`field-input hr-textarea ${err("description") ? "input-error" : ""}`} value={values.description} onChange={handleChange("description")} rows={3} disabled={submitting} />
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Create Loan Type" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanTypeFormModal;
