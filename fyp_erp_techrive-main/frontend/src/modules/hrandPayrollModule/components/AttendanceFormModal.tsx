import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateAttendanceForm } from "../services/attendance.validation";
import { EMPTY_ATTENDANCE_FORM_VALUES } from "../services/attendance.types";
import { useEmployeeSearchLookup } from "../hooks/useEmployeeSearchLookup";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useAttendanceStatusesLookup } from "../hooks/useAttendanceStatusesLookup";
import type { AttendanceFormValues } from "../services/attendance.types";

interface AttendanceFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: AttendanceFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: AttendanceFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// The employee on an attendance record can't be changed after creation
// (see attendance.validation.ts's toUpdatePayload, which drops employee_id
// entirely) — re-pointing an existing attendance row at a different
// employee is a delete-and-recreate, not an edit, so the picker is
// read-only once a record exists.
const AttendanceFormModal: React.FC<AttendanceFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<AttendanceFormValues>(
    initialValues ?? EMPTY_ATTENDANCE_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { results: employeeResults, loading: employeeSearchLoading } = useEmployeeSearchLookup(
    values.employee_label
  );
  // Company → Branch cascade (see the Company→Branch scoping task). The
  // record only stores branch_id (optional, defaults to the employee's own
  // campus), so companyId is local UI-only state. Defaults to the legacy
  // full list (undefined) rather than empty/gated, since Branch itself is
  // optional here — narrowing only once the user actively picks a company.
  const [companyId, setCompanyId] = useState<number | null | undefined>(undefined);
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);
  const { statuses } = useAttendanceStatusesLookup();

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof AttendanceFormValues) => errors[field];

  const clearFieldError = (field: keyof AttendanceFormValues) => {
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleTextChange = (
    field: keyof AttendanceFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const nextValue = e.target.value;
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    clearFieldError(field);
  };

  const handleEmployeeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, employee_label: e.target.value, employee_id: "" }));
    setShowSuggestions(true);
    clearFieldError("employee_id");
  };

  const selectEmployee = (id: number, label: string) => {
    setValues((prev) => ({ ...prev, employee_id: String(id), employee_label: label }));
    setShowSuggestions(false);
    clearFieldError("employee_id");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAttendanceForm(values);
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
      <div className="hr-modal hr-modal-form hr-modal-form-wide" role="dialog" aria-modal="true" aria-labelledby="attendance-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="attendance-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Mark Attendance" : "Edit Attendance"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Employee" htmlFor="attendance-employee" required error={err("employee_id")}>
            {mode === "edit" ? (
              <input
                id="attendance-employee"
                className="field-input"
                value={values.employee_label}
                disabled
                readOnly
              />
            ) : (
              <div className="hr-combobox">
                <input
                  id="attendance-employee"
                  className={`field-input ${err("employee_id") ? "input-error" : ""}`}
                  value={values.employee_label}
                  onChange={handleEmployeeInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Search by name or reg. no…"
                  disabled={submitting}
                  autoComplete="off"
                  autoFocus
                />
                {showSuggestions && values.employee_label.trim() !== "" && !values.employee_id && (
                  <ul className="hr-combobox-list">
                    {employeeSearchLoading && (
                      <li className="hr-combobox-empty">Searching…</li>
                    )}
                    {!employeeSearchLoading && employeeResults.length === 0 && (
                      <li className="hr-combobox-empty">No matching employees</li>
                    )}
                    {!employeeSearchLoading &&
                      employeeResults.map((option) => (
                        <li key={option.id}>
                          <button
                            type="button"
                            className="hr-combobox-option"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              selectEmployee(
                                option.id,
                                `${option.name}${option.reg_no ? ` (${option.reg_no})` : ""}`
                              )
                            }
                          >
                            {option.name}
                            {option.reg_no ? ` (${option.reg_no})` : ""}
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </FormField>

          <div className="hr-form-grid">
            <FormField
              label="Attendance Date"
              htmlFor="attendance-date"
              required
              error={err("attendance_date")}
            >
              <input
                id="attendance-date"
                type="date"
                className={`field-input ${err("attendance_date") ? "input-error" : ""}`}
                value={values.attendance_date}
                onChange={handleTextChange("attendance_date")}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Status" htmlFor="attendance-status" required error={err("status")}>
              <select
                id="attendance-status"
                className={`field-input hr-select ${err("status") ? "input-error" : ""}`}
                value={values.status}
                onChange={handleTextChange("status")}
                disabled={submitting}
              >
                <option value="">Select status…</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="School / University" htmlFor="attendance-company">
              <select
                id="attendance-company"
                className="field-input hr-select"
                value={companyId ?? ""}
                onChange={(e) => {
                  setCompanyId(e.target.value ? Number(e.target.value) : null);
                  // A branch from the old company is no longer valid/visible — clear it.
                  setValues((prev) => ({ ...prev, branch_id: "" }));
                }}
                disabled={submitting}
              >
                <option value="">All school / university</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Campus"
              htmlFor="attendance-branch"
              error={err("branch_id")}
              hint="Defaults to the employee's own campus if left unselected"
            >
              <select
                id="attendance-branch"
                className="field-input hr-select"
                value={values.branch_id}
                onChange={handleTextChange("branch_id")}
                disabled={submitting}
              >
                <option value="">Employee's campus</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Time In" htmlFor="attendance-time-in" error={err("timeIn")}>
              <input
                id="attendance-time-in"
                type="time"
                className={`field-input ${err("timeIn") ? "input-error" : ""}`}
                value={values.timeIn}
                onChange={handleTextChange("timeIn")}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Time Out" htmlFor="attendance-time-out" error={err("timeOut")}>
              <input
                id="attendance-time-out"
                type="time"
                className={`field-input ${err("timeOut") ? "input-error" : ""}`}
                value={values.timeOut}
                onChange={handleTextChange("timeOut")}
                disabled={submitting}
              />
            </FormField>
          </div>

          <FormField label="Remarks" htmlFor="attendance-remarks" error={err("remarks")}>
            <textarea
              id="attendance-remarks"
              className={`field-input ${err("remarks") ? "input-error" : ""}`}
              value={values.remarks}
              onChange={handleTextChange("remarks")}
              placeholder="Optional"
              rows={2}
              disabled={submitting}
            />
          </FormField>

          <FormField label="Comment" htmlFor="attendance-comment" error={err("comment")}>
            <textarea
              id="attendance-comment"
              className={`field-input ${err("comment") ? "input-error" : ""}`}
              value={values.comment}
              onChange={handleTextChange("comment")}
              placeholder="Optional"
              rows={2}
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
                "Mark Attendance"
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

export default AttendanceFormModal;
