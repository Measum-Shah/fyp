import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateTaxSlabForm } from "../services/taxSlab.validation";
import { EMPTY_TAX_SLAB_FORM_VALUES, TAX_SLAB_STATUS } from "../services/taxSlab.types";
import type { TaxSlabFormValues } from "../services/taxSlab.types";
import type { FiscalYearLookupOption } from "../services/fiscalYear.types";

interface TaxSlabFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  fiscalYears: FiscalYearLookupOption[];
  lockFiscalYear?: boolean; // true when opened from the ladder for a specific fiscal year
  initialValues?: TaxSlabFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: TaxSlabFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const TaxSlabFormModal: React.FC<TaxSlabFormModalProps> = ({
  open, mode, fiscalYears, lockFiscalYear, initialValues, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<TaxSlabFormValues>(initialValues ?? EMPTY_TAX_SLAB_FORM_VALUES());
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof TaxSlabFormValues) => errors[field];

  const handleChange = (field: keyof TaxSlabFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    let nextValue: string | number = e.target.value;
    if (field === "fiscal_year_id" || field === "status") nextValue = e.target.value === "" ? "" : Number(e.target.value);
    setValues((prev) => ({ ...prev, [field]: nextValue } as TaxSlabFormValues));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateTaxSlabForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="tax-slab-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="tax-slab-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Tax Slab" : "Edit Tax Slab"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Fiscal Year" htmlFor="ts-fiscal-year" required error={err("fiscal_year_id")}>
            <select
              id="ts-fiscal-year"
              className={`field-input hr-select ${err("fiscal_year_id") ? "input-error" : ""}`}
              value={values.fiscal_year_id}
              onChange={handleChange("fiscal_year_id")}
              disabled={submitting || lockFiscalYear}
            >
              <option value="">Select fiscal year…</option>
              {fiscalYears.map((fy) => <option key={fy.id} value={fy.id}>{fy.name}</option>)}
            </select>
          </FormField>

          <div className="hr-form-grid">
            <FormField label="Minimum Amount (Rs.)" htmlFor="ts-min" required error={err("min_amount")}>
              <input id="ts-min" inputMode="numeric" min={0} step="0.01" className={`field-input ${err("min_amount") ? "input-error" : ""}`} value={values.min_amount} onChange={handleChange("min_amount")} placeholder="0" disabled={submitting} autoFocus />
            </FormField>

            <FormField label="Maximum Amount (Rs.)" htmlFor="ts-max" error={err("max_amount")}>
              <input id="ts-max" inputMode="numeric" min={0} step="0.01" className={`field-input ${err("max_amount") ? "input-error" : ""}`} value={values.max_amount} onChange={handleChange("max_amount")} placeholder="No upper bound" disabled={submitting} />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Fixed Amount (Rs.)" htmlFor="ts-fixed" required error={err("fixed_amount")} hint="Cumulative tax from lower slabs">
              <input id="ts-fixed" inputMode="numeric" min={0} step="0.01" className={`field-input ${err("fixed_amount") ? "input-error" : ""}`} value={values.fixed_amount} onChange={handleChange("fixed_amount")} placeholder="0" disabled={submitting} />
            </FormField>

            <FormField label="Tax Percent (%)" htmlFor="ts-percent" required error={err("tax_percent")} hint="Applied only to the amount above Minimum">
              <input id="ts-percent" inputMode="numeric" min={0} max={100} step="0.01" className={`field-input ${err("tax_percent") ? "input-error" : ""}`} value={values.tax_percent} onChange={handleChange("tax_percent")} placeholder="0" disabled={submitting} />
            </FormField>
          </div>

          <FormField label="Status" htmlFor="ts-status">
            <select id="ts-status" className="field-input hr-select" value={values.status} onChange={handleChange("status")} disabled={submitting}>
              <option value={TAX_SLAB_STATUS.ACTIVE}>Active</option>
              <option value={TAX_SLAB_STATUS.INACTIVE}>Inactive</option>
            </select>
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Create Tax Slab" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaxSlabFormModal;
