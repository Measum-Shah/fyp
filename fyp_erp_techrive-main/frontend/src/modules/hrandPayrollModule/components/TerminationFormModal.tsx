import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateTerminationForm } from "../services/termination.validation";
import { ACKNOWLEDGE_STATUS, EMPTY_TERMINATION_FORM_VALUES } from "../services/termination.types";
import type { TerminationFormValues } from "../services/termination.types";
import type { LookupOption } from "../services/employee.types";

interface TerminationFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: TerminationFormValues;
  staff: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: TerminationFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Submitting this form immediately flips the employee to Inactive on the
// backend (see termination.service.ts) — there's no draft/approval stage.
const TerminationFormModal: React.FC<TerminationFormModalProps> = ({
  open, mode, initialValues, staff, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<TerminationFormValues>(initialValues ?? EMPTY_TERMINATION_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof TerminationFormValues) => errors[field];

  const handleChange = (field: keyof TerminationFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
    const validationErrors = validateTerminationForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="term-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="term-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Record Termination" : "Edit Termination"}
        </h3>

        {mode === "create" && (
          <p className="hr-field-hint">Submitting this immediately marks the employee Inactive.</p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Employee" htmlFor="term-staff" required error={err("staff_id")}>
            <select id="term-staff" className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`} value={values.staff_id} onChange={handleChange("staff_id")} disabled={submitting || mode === "edit"}>
              <option value="">Select employee…</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>

          <FormField label="Reason" htmlFor="term-reason" required error={err("reason")}>
            <textarea id="term-reason" className={`field-input hr-textarea ${err("reason") ? "input-error" : ""}`} value={values.reason} onChange={handleChange("reason")} rows={2} disabled={submitting} />
          </FormField>

          <FormField label="Prior Warnings" htmlFor="term-warnings" required error={err("warnings")}>
            <textarea id="term-warnings" className={`field-input hr-textarea ${err("warnings") ? "input-error" : ""}`} value={values.warnings} onChange={handleChange("warnings")} rows={2} disabled={submitting} />
          </FormField>

          <FormField label="Acknowledged by Employee" htmlFor="term-ack" error={err("acknowledge")}>
            <select id="term-ack" className="field-input hr-select" value={values.acknowledge} onChange={handleChange("acknowledge")} disabled={submitting}>
              <option value={ACKNOWLEDGE_STATUS.NO}>No</option>
              <option value={ACKNOWLEDGE_STATUS.YES}>Yes</option>
            </select>
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Record Termination" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TerminationFormModal;
