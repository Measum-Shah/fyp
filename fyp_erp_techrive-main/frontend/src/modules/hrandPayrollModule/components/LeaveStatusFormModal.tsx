import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateLeaveStatusForm } from "../services/leaveStatus.validation";
import {
  EMPTY_LEAVE_STATUS_FORM_VALUES,
  LEAVE_STATUS_APPROVAL_FLAG,
  LEAVE_STATUS_STATUS,
} from "../services/leaveStatus.types";
import type { LeaveStatusFormValues } from "../services/leaveStatus.types";

interface LeaveStatusFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: LeaveStatusFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: LeaveStatusFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Same single-modal-for-Add/Edit pattern as DepartmentFormModal.tsx — Leave
// Status only has 2 editable fields.
const LeaveStatusFormModal: React.FC<LeaveStatusFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<LeaveStatusFormValues>(
    initialValues ?? EMPTY_LEAVE_STATUS_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof LeaveStatusFormValues) => errors[field];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setValues((prev) => ({ ...prev, name: nextValue }));
    setClientErrors((prev) => {
      if (!("name" in prev)) return prev;
      const next = { ...prev };
      delete next.name;
      return next;
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValues((prev) => ({ ...prev, status: Number(e.target.value) }));
  };

  const handleApprovalFlagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValues((prev) => ({ ...prev, counts_as_approved: Number(e.target.value) as 0 | 1 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateLeaveStatusForm(values);
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
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="leave-status-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="leave-status-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Leave Status" : "Edit Leave Status"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Status Name" htmlFor="ls-name" required error={err("name")} hint="e.g. Pending, Approved, Rejected, Cancelled">
            <input
              id="ls-name"
              className={`field-input ${err("name") ? "input-error" : ""}`}
              value={values.name}
              onChange={handleNameChange}
              placeholder="e.g. Approved"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <FormField
            label="Counts as Approved"
            htmlFor="ls-counts-as-approved"
            hint="Leave requests in this status are eligible for the automated Payroll Run's leave deduction (only applies to Unpaid leave types)"
          >
            <select
              id="ls-counts-as-approved"
              className="field-input hr-select"
              value={values.counts_as_approved}
              onChange={handleApprovalFlagChange}
              disabled={submitting}
            >
              <option value={LEAVE_STATUS_APPROVAL_FLAG.DOES_NOT_COUNT}>No</option>
              <option value={LEAVE_STATUS_APPROVAL_FLAG.COUNTS_AS_APPROVED}>Yes — this means "Approved"</option>
            </select>
          </FormField>

          <FormField label="Status" htmlFor="ls-status">
            <select
              id="ls-status"
              className="field-input hr-select"
              value={values.status}
              onChange={handleStatusChange}
              disabled={submitting}
            >
              <option value={LEAVE_STATUS_STATUS.ACTIVE}>Active</option>
              <option value={LEAVE_STATUS_STATUS.INACTIVE}>Inactive</option>
            </select>
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
                "Create Leave Status"
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

export default LeaveStatusFormModal;
