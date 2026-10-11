import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateFamilyForm } from "../services/family.validation";
import { EMPTY_FAMILY_FORM_VALUES } from "../services/family.types";
import type { FamilyFormValues } from "../services/family.types";
import type { LookupOption } from "../services/employee.types";

interface FamilyFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: FamilyFormValues;
  staff: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: FamilyFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FamilyFormModal: React.FC<FamilyFormModalProps> = ({
  open, mode, initialValues, staff, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<FamilyFormValues>(initialValues ?? EMPTY_FAMILY_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof FamilyFormValues) => errors[field];

  const handleChange = (field: keyof FamilyFormValues) => (
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
    const validationErrors = validateFamilyForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="family-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="family-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Family Member" : "Edit Family Member"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Employee" htmlFor="fam-staff" required error={err("staff_id")}>
            <select id="fam-staff" className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`} value={values.staff_id} onChange={handleChange("staff_id")} disabled={submitting || mode === "edit"}>
              <option value="">Select employee…</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>

          <div className="hr-form-grid">
            <FormField label="Name" htmlFor="fam-name" required error={err("name")}>
              <input id="fam-name" className={`field-input ${err("name") ? "input-error" : ""}`} value={values.name} onChange={handleChange("name")} disabled={submitting} autoFocus />
            </FormField>

            <FormField label="Relation" htmlFor="fam-relation" required error={err("relation")}>
              <input id="fam-relation" className={`field-input ${err("relation") ? "input-error" : ""}`} value={values.relation} onChange={handleChange("relation")} placeholder="e.g. Spouse, Child" disabled={submitting} />
            </FormField>

            <FormField label="Phone" htmlFor="fam-phone" required error={err("phone")}>
              <input id="fam-phone" className={`field-input ${err("phone") ? "input-error" : ""}`} value={values.phone} onChange={handleChange("phone")} disabled={submitting} />
            </FormField>

            <FormField label="Gender" htmlFor="fam-gender" error={err("gender")}>
              <input id="fam-gender" className={`field-input ${err("gender") ? "input-error" : ""}`} value={values.gender} onChange={handleChange("gender")} disabled={submitting} />
            </FormField>

            <FormField label="CNIC" htmlFor="fam-cnic" error={err("cnic")}>
              <input id="fam-cnic" className={`field-input ${err("cnic") ? "input-error" : ""}`} value={values.cnic} onChange={handleChange("cnic")} disabled={submitting} />
            </FormField>

            <FormField label="Workplace" htmlFor="fam-workplace" error={err("workplace")}>
              <input id="fam-workplace" className={`field-input ${err("workplace") ? "input-error" : ""}`} value={values.workplace} onChange={handleChange("workplace")} placeholder="e.g. Student, Homemaker" disabled={submitting} />
            </FormField>
          </div>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Add Family Member" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyFormModal;
