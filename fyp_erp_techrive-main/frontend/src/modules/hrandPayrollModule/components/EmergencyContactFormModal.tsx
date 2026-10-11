import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateEmergencyContactForm } from "../services/emergencyContact.validation";
import { EMPTY_EMERGENCY_CONTACT_FORM_VALUES } from "../services/emergencyContact.types";
import type { EmergencyContactFormValues } from "../services/emergencyContact.types";
import type { LookupOption } from "../services/employee.types";

interface EmergencyContactFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: EmergencyContactFormValues;
  staff: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: EmergencyContactFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EmergencyContactFormModal: React.FC<EmergencyContactFormModalProps> = ({
  open, mode, initialValues, staff, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<EmergencyContactFormValues>(initialValues ?? EMPTY_EMERGENCY_CONTACT_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof EmergencyContactFormValues) => errors[field];

  const handleChange = (field: keyof EmergencyContactFormValues) => (
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
    const validationErrors = validateEmergencyContactForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="ec-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="ec-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Emergency Contact" : "Edit Emergency Contact"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Employee" htmlFor="ec-staff" required error={err("staff_id")}>
            <select id="ec-staff" className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`} value={values.staff_id} onChange={handleChange("staff_id")} disabled={submitting || mode === "edit"}>
              <option value="">Select employee…</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>

          <div className="hr-form-grid">
            <FormField label="Name" htmlFor="ec-name" required error={err("name")}>
              <input id="ec-name" className={`field-input ${err("name") ? "input-error" : ""}`} value={values.name} onChange={handleChange("name")} disabled={submitting} autoFocus />
            </FormField>

            <FormField label="Relation" htmlFor="ec-relation" required error={err("relation")}>
              <input id="ec-relation" className={`field-input ${err("relation") ? "input-error" : ""}`} value={values.relation} onChange={handleChange("relation")} placeholder="e.g. Father, Sibling" disabled={submitting} />
            </FormField>

            <FormField label="Phone" htmlFor="ec-phone" required error={err("phone")}>
              <input id="ec-phone" className={`field-input ${err("phone") ? "input-error" : ""}`} value={values.phone} onChange={handleChange("phone")} disabled={submitting} />
            </FormField>

            <FormField label="Email" htmlFor="ec-email" required error={err("email")}>
              <input id="ec-email" type="email" className={`field-input ${err("email") ? "input-error" : ""}`} value={values.email} onChange={handleChange("email")} disabled={submitting} />
            </FormField>
          </div>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Add Contact" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyContactFormModal;
