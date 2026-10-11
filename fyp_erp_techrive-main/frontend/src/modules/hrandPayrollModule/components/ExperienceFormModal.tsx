import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateExperienceForm } from "../services/experience.validation";
import { EMPTY_EXPERIENCE_FORM_VALUES } from "../services/experience.types";
import type { ExperienceFormValues } from "../services/experience.types";
import type { LookupOption } from "../services/employee.types";

interface ExperienceFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: ExperienceFormValues;
  staff: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: ExperienceFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ExperienceFormModal: React.FC<ExperienceFormModalProps> = ({
  open, mode, initialValues, staff, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<ExperienceFormValues>(initialValues ?? EMPTY_EXPERIENCE_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof ExperienceFormValues) => errors[field];

  const handleChange = (field: keyof ExperienceFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
    const validationErrors = validateExperienceForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="exp-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="exp-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Experience" : "Edit Experience"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Employee" htmlFor="exp-staff" required error={err("staff_id")}>
            <select id="exp-staff" className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`} value={values.staff_id} onChange={handleChange("staff_id")} disabled={submitting || mode === "edit"}>
              <option value="">Select employee…</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>

          <div className="hr-form-grid">
            <FormField label="Company / Employer" htmlFor="exp-name" required error={err("name")}>
              <input id="exp-name" className={`field-input ${err("name") ? "input-error" : ""}`} value={values.name} onChange={handleChange("name")} disabled={submitting} autoFocus />
            </FormField>

            <FormField label="Designation" htmlFor="exp-designation" required error={err("designation")}>
              <input id="exp-designation" className={`field-input ${err("designation") ? "input-error" : ""}`} value={values.designation} onChange={handleChange("designation")} disabled={submitting} />
            </FormField>

            <FormField label="From Date" htmlFor="exp-from" required error={err("from_date")}>
              <input id="exp-from" type="date" className={`field-input ${err("from_date") ? "input-error" : ""}`} value={values.from_date} onChange={handleChange("from_date")} disabled={submitting} />
            </FormField>

            <FormField label="To Date" htmlFor="exp-to" required error={err("to_date")}>
              <input id="exp-to" type="date" className={`field-input ${err("to_date") ? "input-error" : ""}`} value={values.to_date} onChange={handleChange("to_date")} disabled={submitting} />
            </FormField>
          </div>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Add Experience" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExperienceFormModal;
