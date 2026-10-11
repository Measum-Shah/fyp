import React, { useState } from "react";
import FormField from "./FormField";
import {
  isFormValid,
  validateAttendanceStatusForm,
} from "../services/attendanceStatus.validation";
import {
  DISPLAY_CLASS_LABELS,
  DISPLAY_CLASS_OPTIONS,
  ATTENDANCE_STATUS_STATUS,
} from "../services/attendanceStatus.constants";
import { ATTENDANCE_STATUS_ABSENCE_FLAG, EMPTY_ATTENDANCE_STATUS_FORM_VALUES } from "../services/attendanceStatus.types";
import type { AttendanceStatusFormValues } from "../services/attendanceStatus.types";

interface AttendanceStatusFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: AttendanceStatusFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: AttendanceStatusFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AttendanceStatusFormModal: React.FC<AttendanceStatusFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<AttendanceStatusFormValues>(
    initialValues ?? EMPTY_ATTENDANCE_STATUS_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof AttendanceStatusFormValues) => errors[field];

  const handleChange = (
    field: keyof AttendanceStatusFormValues
  ) => (
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

  const handleAbsenceFlagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValues((prev) => ({ ...prev, counts_as_absent: Number(e.target.value) as 0 | 1 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAttendanceStatusForm(values);
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
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="attendance-status-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="attendance-status-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Attendance Status" : "Edit Attendance Status"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Title" htmlFor="attendance-status-title" required error={err("title")}>
            <input
              id="attendance-status-title"
              className={`field-input ${err("title") ? "input-error" : ""}`}
              value={values.title}
              onChange={handleChange("title")}
              placeholder="e.g. Present, Absent, Half Day"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <FormField
            label="Badge Color"
            htmlFor="attendance-status-display-class"
            error={err("display_class")}
            hint="Used to color-code this status wherever it's shown"
          >
            <select
              id="attendance-status-display-class"
              className="field-input hr-select"
              value={values.display_class}
              onChange={handleChange("display_class")}
              disabled={submitting}
            >
              <option value="">No color</option>
              {DISPLAY_CLASS_OPTIONS.map((cls) => (
                <option key={cls} value={cls}>
                  {DISPLAY_CLASS_LABELS[cls]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Counts as Absent"
            htmlFor="attendance-status-counts-as-absent"
            hint="Days recorded with this status are treated as unpaid/deductible on the automated Payroll Run"
          >
            <select
              id="attendance-status-counts-as-absent"
              className="field-input hr-select"
              value={values.counts_as_absent}
              onChange={handleAbsenceFlagChange}
              disabled={submitting}
            >
              <option value={ATTENDANCE_STATUS_ABSENCE_FLAG.DOES_NOT_COUNT}>No</option>
              <option value={ATTENDANCE_STATUS_ABSENCE_FLAG.COUNTS_AS_ABSENT}>Yes — this means "Absent"</option>
            </select>
          </FormField>

          {mode === "edit" && (
            <FormField label="Status" htmlFor="attendance-status-status" error={err("status")}>
              <select
                id="attendance-status-status"
                className="field-input hr-select"
                value={values.status}
                onChange={handleChange("status")}
                disabled={submitting}
              >
                <option value={ATTENDANCE_STATUS_STATUS.ACTIVE}>Active</option>
                <option value={ATTENDANCE_STATUS_STATUS.INACTIVE}>Inactive</option>
              </select>
            </FormField>
          )}

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
                "Create Status"
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

export default AttendanceStatusFormModal;
