import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateLeaveTypeForm } from "../services/leaveType.validation";
import { EMPTY_LEAVE_TYPE_FORM_VALUES, LEAVE_TYPE_PAY_TYPE, LEAVE_TYPE_STATUS } from "../services/leaveType.types";
import type { LeaveTypeFormValues } from "../services/leaveType.types";

interface LeaveTypeFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: LeaveTypeFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: LeaveTypeFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Single modal handles both Add and Edit, same pattern as
// DepartmentFormModal.tsx/CompanyFormModal.tsx. `initialValues` is only read
// once via the useState initializer — LeaveTypesPage always has the full
// LeaveType object already in memory (from the list) before opening this
// modal in edit mode.
const LeaveTypeFormModal: React.FC<LeaveTypeFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<LeaveTypeFormValues>(
    initialValues ?? EMPTY_LEAVE_TYPE_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof LeaveTypeFormValues) => errors[field];

  const handleChange = (
    field: keyof LeaveTypeFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const nextValue =
      field === "status" || field === "pay_type" ? Number(e.target.value) : e.target.value;
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
    const validationErrors = validateLeaveTypeForm(values);
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
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="leave-type-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="leave-type-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Leave Type" : "Edit Leave Type"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Leave Type Name" htmlFor="lt-name" required error={err("name")}>
            <input
              id="lt-name"
              className={`field-input ${err("name") ? "input-error" : ""}`}
              value={values.name}
              onChange={handleChange("name")}
              placeholder="e.g. Annual Leave"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <div className="hr-form-grid">
            <FormField label="Permitted Days" htmlFor="lt-permitted-days" error={err("permitted_days")}>
              <input
                id="lt-permitted-days"
                inputMode="numeric"
                min={0}
                className={`field-input ${err("permitted_days") ? "input-error" : ""}`}
                value={values.permitted_days}
                onChange={handleChange("permitted_days")}
                placeholder="e.g. 14"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Year" htmlFor="lt-year" error={err("year")}>
              <input
                id="lt-year"
                inputMode="numeric"
                className={`field-input ${err("year") ? "input-error" : ""}`}
                value={values.year}
                onChange={handleChange("year")}
                placeholder="e.g. 2026"
                disabled={submitting}
              />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Type" htmlFor="lt-type" error={err("type")}>
              <input
                id="lt-type"
                className={`field-input ${err("type") ? "input-error" : ""}`}
                value={values.type}
                onChange={handleChange("type")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Start Date" htmlFor="lt-start-date" error={err("start_date")}>
              <input
                id="lt-start-date"
                type="date"
                className={`field-input ${err("start_date") ? "input-error" : ""}`}
                value={values.start_date}
                onChange={handleChange("start_date")}
                disabled={submitting}
              />
            </FormField>

            <FormField label="End Date" htmlFor="lt-end-date" error={err("end_date")}>
              <input
                id="lt-end-date"
                type="date"
                className={`field-input ${err("end_date") ? "input-error" : ""}`}
                value={values.end_date}
                onChange={handleChange("end_date")}
                disabled={submitting}
              />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Pay Type" htmlFor="lt-pay-type">
              <select
                id="lt-pay-type"
                className="field-input hr-select"
                value={values.pay_type}
                onChange={handleChange("pay_type")}
                disabled={submitting}
              >
                <option value={LEAVE_TYPE_PAY_TYPE.PAID}>Paid (no deduction)</option>
                <option value={LEAVE_TYPE_PAY_TYPE.UNPAID}>Unpaid (deductible)</option>
              </select>
            </FormField>

            <FormField label="Status" htmlFor="lt-status">
              <select
                id="lt-status"
                className="field-input hr-select"
                value={values.status}
                onChange={handleChange("status")}
                disabled={submitting}
              >
                <option value={LEAVE_TYPE_STATUS.ACTIVE}>Active</option>
                <option value={LEAVE_TYPE_STATUS.INACTIVE}>Inactive</option>
              </select>
            </FormField>
          </div>

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
                "Create Leave Type"
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

export default LeaveTypeFormModal;
