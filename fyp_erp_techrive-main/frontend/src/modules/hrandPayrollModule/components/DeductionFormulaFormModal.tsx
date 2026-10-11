import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateDeductionFormulaForm } from "../services/payrollDeductionFormula.validation";
import {
  DEDUCTION_FORMULA_BASE_TYPE,
  DEDUCTION_FORMULA_DIVISOR_TYPE,
  DEDUCTION_FORMULA_STATUS,
  EMPTY_DEDUCTION_FORMULA_FORM_VALUES,
} from "../services/payrollDeductionFormula.types";
import type { DeductionFormulaFormValues } from "../services/payrollDeductionFormula.types";

interface DeductionFormulaFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: DeductionFormulaFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: DeductionFormulaFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const DeductionFormulaFormModal: React.FC<DeductionFormulaFormModalProps> = ({
  open, mode, initialValues, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<DeductionFormulaFormValues>(initialValues ?? EMPTY_DEDUCTION_FORMULA_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof DeductionFormulaFormValues) => errors[field];

  const handleChange = (field: keyof DeductionFormulaFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    let nextValue: string | number = e.target.value;
    if (field !== "name") nextValue = Number(e.target.value);
    setValues((prev) => ({ ...prev, [field]: nextValue } as DeductionFormulaFormValues));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateDeductionFormulaForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="deduction-formula-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="deduction-formula-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Deduction Formula" : "Edit Deduction Formula"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField
              label="Name"
              htmlFor="df-name"
              required
              error={err("name")}
              hint="e.g. Standard (Basic ÷ Calendar Days)"
            >
              <input
                id="df-name"
                className={`field-input ${err("name") ? "input-error" : ""}`}
                value={values.name}
                onChange={handleChange("name")}
                placeholder="e.g. Standard (Basic ÷ Calendar Days)"
                disabled={submitting}
                autoFocus
              />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField
              label="Base Salary"
              htmlFor="df-base-type"
              hint="Which figure the per-day rate is derived from"
            >
              <select id="df-base-type" className="field-input hr-select" value={values.base_type} onChange={handleChange("base_type")} disabled={submitting}>
                <option value={DEDUCTION_FORMULA_BASE_TYPE.BASIC_SALARY}>Basic Salary</option>
                <option value={DEDUCTION_FORMULA_BASE_TYPE.GROSS_SALARY}>Gross Salary</option>
              </select>
            </FormField>

            <FormField
              label="Divide By"
              htmlFor="df-divisor-type"
              hint="How the per-day rate is calculated"
            >
              <select id="df-divisor-type" className="field-input hr-select" value={values.divisor_type} onChange={handleChange("divisor_type")} disabled={submitting}>
                <option value={DEDUCTION_FORMULA_DIVISOR_TYPE.CALENDAR_DAYS_IN_MONTH}>Calendar Days in Month</option>
                <option value={DEDUCTION_FORMULA_DIVISOR_TYPE.FIXED_30}>Fixed 30 Days</option>
              </select>
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField
              label="Default Formula"
              htmlFor="df-is-default"
              hint="Payroll always uses whichever formula is marked default"
            >
              <select id="df-is-default" className="field-input hr-select" value={values.is_default} onChange={handleChange("is_default")} disabled={submitting}>
                <option value={0}>Not the default</option>
                <option value={1}>Make this the default</option>
              </select>
            </FormField>

            <FormField label="Status" htmlFor="df-status">
              <select id="df-status" className="field-input hr-select" value={values.status} onChange={handleChange("status")} disabled={submitting}>
                <option value={DEDUCTION_FORMULA_STATUS.ACTIVE}>Active</option>
                <option value={DEDUCTION_FORMULA_STATUS.INACTIVE}>Inactive</option>
              </select>
            </FormField>
          </div>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Create Formula" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeductionFormulaFormModal;
