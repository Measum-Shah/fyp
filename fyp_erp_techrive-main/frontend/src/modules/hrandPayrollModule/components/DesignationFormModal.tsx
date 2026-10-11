import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateDesignationForm } from "../services/designation.validation";
import { EMPTY_DESIGNATION_FORM_VALUES } from "../services/designation.types";
import type { DesignationFormValues } from "../services/designation.types";

interface DesignationFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  editingId?: number;
  initialValues?: DesignationFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: DesignationFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Mirrors StaffTypeFormModal.tsx. Designation Name (required) and an
// optional free-text Description — Parent Designation has been removed
// (see designation.types.ts) since nothing in the codebase relied on the
// hierarchy it provided.
const DesignationFormModal: React.FC<DesignationFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<DesignationFormValues>(
    initialValues ?? EMPTY_DESIGNATION_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof DesignationFormValues) => errors[field];

  const handleChange = (
    field: keyof DesignationFormValues
  ) => (
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
    const validationErrors = validateDesignationForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) {
      onSubmit(values);
    }
  };

  return (
    <div
      className="hr-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="designation-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="designation-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Designation" : "Edit Designation"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Designation Name" htmlFor="desig-name" required error={err("name")}>
            <input
              id="desig-name"
              className={`field-input ${err("name") ? "input-error" : ""}`}
              value={values.name}
              onChange={handleChange("name")}
              placeholder="e.g. Senior Software Engineer"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <FormField
            label="Description"
            htmlFor="desig-description"
            hint="Optional"
            error={err("description")}
          >
            <textarea
              id="desig-description"
              className={`field-input ${err("description") ? "input-error" : ""}`}
              value={values.description}
              onChange={handleChange("description")}
              placeholder="What this designation involves…"
              rows={3}
              disabled={submitting}
            />
          </FormField>

          <div className="hr-modal-actions">
            <button
              type="button"
              className="hr-btn hr-btn-secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="spinner-wrap">
                  <span className="spinner" />
                  Saving…
                </span>
              ) : mode === "create" ? (
                "Create Designation"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DesignationFormModal;
