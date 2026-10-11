import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateStaffTypeForm } from "../services/staffType.validation";
import { EMPTY_STAFF_TYPE_FORM_VALUES } from "../services/staffType.types";
import type { StaffTypeFormValues } from "../services/staffType.types";

interface StaffTypeFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: StaffTypeFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: StaffTypeFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Mirrors DepartmentFormModal.tsx exactly — a single modal for both Add and
// Edit. `initialValues` is only read once via the useState initializer,
// same "StaffTypesPage always has the full record in memory already"
// reasoning as Department.
const StaffTypeFormModal: React.FC<StaffTypeFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<StaffTypeFormValues>(
    initialValues ?? EMPTY_STAFF_TYPE_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof StaffTypeFormValues) => errors[field];

  const handleChange = (
    field: keyof StaffTypeFormValues
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
    const validationErrors = validateStaffTypeForm(values);
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
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="staff-type-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="staff-type-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Staff Type" : "Edit Staff Type"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Staff Type Name" htmlFor="st-name" required error={err("name")}>
            <input
              id="st-name"
              className={`field-input ${err("name") ? "input-error" : ""}`}
              value={values.name}
              onChange={handleChange("name")}
              placeholder="e.g. Permanent"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <FormField
            label="Staff Type Code"
            htmlFor="st-code"
            required
            error={err("staff_type_code")}
          >
            <input
              id="st-code"
              className={`field-input ${err("staff_type_code") ? "input-error" : ""}`}
              value={values.staff_type_code}
              onChange={handleChange("staff_type_code")}
              placeholder="e.g. PERM"
              disabled={submitting}
            />
          </FormField>

          <FormField label="Description" htmlFor="st-description" error={err("description")}>
            <textarea
              id="st-description"
              className="field-input hr-textarea"
              value={values.description}
              onChange={handleChange("description")}
              placeholder="Optional short description"
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
                "Create Staff Type"
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

export default StaffTypeFormModal;
