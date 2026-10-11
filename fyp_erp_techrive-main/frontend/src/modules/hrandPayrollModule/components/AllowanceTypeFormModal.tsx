import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateAllowanceTypeForm } from "../services/allowanceType.validation";
import { ALLOWANCE_CALCULATION_TYPE, ALLOWANCE_TYPE_STATUS, EMPTY_ALLOWANCE_TYPE_FORM_VALUES } from "../services/allowanceType.types";
import type { AllowanceTypeFormValues } from "../services/allowanceType.types";

interface AllowanceTypeFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: AllowanceTypeFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: AllowanceTypeFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AllowanceTypeFormModal: React.FC<AllowanceTypeFormModalProps> = ({
  open, mode, initialValues, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<AllowanceTypeFormValues>(initialValues ?? EMPTY_ALLOWANCE_TYPE_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof AllowanceTypeFormValues) => errors[field];

  const handleChange = (field: keyof AllowanceTypeFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    let nextValue: string | number = e.target.value;
    if (field === "status" || field === "is_taxable") nextValue = Number(e.target.value);
    setValues((prev) => ({ ...prev, [field]: nextValue } as AllowanceTypeFormValues));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAllowanceTypeForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="allowance-type-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="allowance-type-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Allowance Type" : "Edit Allowance Type"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Name" htmlFor="at-name" required error={err("name")}>
              <input id="at-name" className={`field-input ${err("name") ? "input-error" : ""}`} value={values.name} onChange={handleChange("name")} placeholder="e.g. Medical Allowance" disabled={submitting} autoFocus />
            </FormField>

            <FormField label="Code" htmlFor="at-code">
              <input id="at-code" className="field-input" value={values.code} onChange={handleChange("code")} placeholder="e.g. MED" disabled={submitting} />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Calculation Type" htmlFor="at-calc-type" required>
              <select id="at-calc-type" className="field-input hr-select" value={values.calculation_type} onChange={handleChange("calculation_type")} disabled={submitting}>
                <option value={ALLOWANCE_CALCULATION_TYPE.FIXED}>Fixed Amount</option>
                <option value={ALLOWANCE_CALCULATION_TYPE.PERCENTAGE}>% of Basic Salary</option>
              </select>
            </FormField>

            <FormField
              label={values.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE ? "Default Value (%)" : "Default Value (Rs.)"}
              htmlFor="at-default-value"
              required
              error={err("default_value")}
              hint="Used when a salary sheet applies this allowance without a manual override"
            >
              <input id="at-default-value" inputMode="numeric" min={0} step="0.01" className={`field-input ${err("default_value") ? "input-error" : ""}`} value={values.default_value} onChange={handleChange("default_value")} placeholder="0" disabled={submitting} />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Taxable" htmlFor="at-taxable" hint="Included in the taxable base when tax is auto-calculated">
              <select id="at-taxable" className="field-input hr-select" value={values.is_taxable} onChange={handleChange("is_taxable")} disabled={submitting}>
                <option value={1}>Taxable</option>
                <option value={0}>Non-Taxable</option>
              </select>
            </FormField>

            <FormField label="Status" htmlFor="at-status">
              <select id="at-status" className="field-input hr-select" value={values.status} onChange={handleChange("status")} disabled={submitting}>
                <option value={ALLOWANCE_TYPE_STATUS.ACTIVE}>Active</option>
                <option value={ALLOWANCE_TYPE_STATUS.INACTIVE}>Inactive</option>
              </select>
            </FormField>
          </div>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Create Allowance Type" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllowanceTypeFormModal;
