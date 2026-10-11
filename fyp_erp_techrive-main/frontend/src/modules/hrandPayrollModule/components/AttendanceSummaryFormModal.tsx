import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateAttendanceSummaryForm } from "../services/attendanceSummary.validation";
import { PAY_STATUS_OPTIONS } from "../services/attendanceSummary.constants";
import { EMPTY_ATTENDANCE_SUMMARY_FORM_VALUES } from "../services/attendanceSummary.types";
import { useEmployeeSearchLookup } from "../hooks/useEmployeeSearchLookup";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useMonthsLookup } from "../hooks/useMonthsLookup";
import { useYearsLookup } from "../hooks/useYearsLookup";
import type { AttendanceSummaryFormValues } from "../services/attendanceSummary.types";

interface AttendanceSummaryFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: AttendanceSummaryFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: AttendanceSummaryFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// The employee/branch/month/year identify WHICH period this summary is
// for — none of them are editable after creation (see
// attendanceSummary.validation.ts's toUpdatePayload, which only ever sends
// total_absents/remarks/pay_status). Changing the period is a
// delete-and-recreate, same reasoning as AttendanceFormModal's employee
// picker.
const AttendanceSummaryFormModal: React.FC<AttendanceSummaryFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<AttendanceSummaryFormValues>(
    initialValues ?? EMPTY_ATTENDANCE_SUMMARY_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { results: employeeResults, loading: employeeSearchLoading } = useEmployeeSearchLookup(
    values.employee_label
  );
  // Company → Branch cascade (see the Company→Branch scoping task).
  // Defaults to the legacy full list (undefined) rather than empty/gated —
  // Branch here auto-fills from the selected employee, so narrowing must
  // stay opt-in or it would fight that auto-fill.
  const [companyId, setCompanyId] = useState<number | null | undefined>(undefined);
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);
  const { months } = useMonthsLookup();
  const { years } = useYearsLookup();

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof AttendanceSummaryFormValues) => errors[field];

  const clearFieldError = (field: keyof AttendanceSummaryFormValues) => {
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChange = (
    field: keyof AttendanceSummaryFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const nextValue = e.target.value;
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    clearFieldError(field);
  };

  const handleEmployeeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, employee_label: e.target.value, staff_id: "" }));
    setShowSuggestions(true);
    clearFieldError("staff_id");
  };

  const selectEmployee = (id: number, label: string, branch_id: number) => {
    setValues((prev) => ({
      ...prev,
      staff_id: String(id),
      employee_label: label,
      branch_id: prev.branch_id || String(branch_id),
    }));
    setShowSuggestions(false);
    clearFieldError("staff_id");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateAttendanceSummaryForm(values, mode);
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
      <div className="hr-modal hr-modal-form hr-modal-form-wide" role="dialog" aria-modal="true" aria-labelledby="summary-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close">
          <IconClose />
        </button>

        <h3 id="summary-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Attendance Summary" : "Edit Attendance Summary"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Employee" htmlFor="summary-employee" required error={err("staff_id")}>
            {mode === "edit" ? (
              <input id="summary-employee" className="field-input" value={values.employee_label} disabled readOnly />
            ) : (
              <div className="hr-combobox">
                <input
                  id="summary-employee"
                  className={`field-input ${err("staff_id") ? "input-error" : ""}`}
                  value={values.employee_label}
                  onChange={handleEmployeeInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="Search by name or reg. no…"
                  disabled={submitting}
                  autoComplete="off"
                  autoFocus
                />
                {showSuggestions && values.employee_label.trim() !== "" && !values.staff_id && (
                  <ul className="hr-combobox-list">
                    {employeeSearchLoading && <li className="hr-combobox-empty">Searching…</li>}
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
                                `${option.name}${option.reg_no ? ` (${option.reg_no})` : ""}`,
                                option.branch_id
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
            <FormField label="School / University" htmlFor="summary-company">
              <select
                id="summary-company"
                className="field-input hr-select"
                value={companyId ?? ""}
                onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : null)}
                disabled={submitting || mode === "edit"}
              >
                <option value="">All school / university</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Campus" htmlFor="summary-branch" required error={err("branch_id")}>
              <select
                id="summary-branch"
                className={`field-input hr-select ${err("branch_id") ? "input-error" : ""}`}
                value={values.branch_id}
                onChange={handleChange("branch_id")}
                disabled={submitting || mode === "edit"}
              >
                <option value="">Select campus…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Month" htmlFor="summary-month" required error={err("month_id")}>
              <select
                id="summary-month"
                className={`field-input hr-select ${err("month_id") ? "input-error" : ""}`}
                value={values.month_id}
                onChange={handleChange("month_id")}
                disabled={submitting || mode === "edit"}
              >
                <option value="">Select month…</option>
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Year" htmlFor="summary-year" required error={err("year_id")}>
              <select
                id="summary-year"
                className={`field-input hr-select ${err("year_id") ? "input-error" : ""}`}
                value={values.year_id}
                onChange={handleChange("year_id")}
                disabled={submitting || mode === "edit"}
              >
                <option value="">Select year…</option>
                {years.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.title}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Pay Status" htmlFor="summary-pay-status" required error={err("pay_status")}>
              <select
                id="summary-pay-status"
                className={`field-input hr-select ${err("pay_status") ? "input-error" : ""}`}
                value={values.pay_status}
                onChange={handleChange("pay_status")}
                disabled={submitting}
              >
                <option value="">Select pay status…</option>
                {PAY_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Total Absents" htmlFor="summary-total-absents" error={err("total_absents")}>
              <input
                id="summary-total-absents"
                inputMode="numeric"
                className={`field-input ${err("total_absents") ? "input-error" : ""}`}
                value={values.total_absents}
                onChange={handleChange("total_absents")}
                disabled={submitting}
              />
            </FormField>
          </div>

          <FormField label="Remarks" htmlFor="summary-remarks" error={err("remarks")}>
            <textarea
              id="summary-remarks"
              className={`field-input ${err("remarks") ? "input-error" : ""}`}
              value={values.remarks}
              onChange={handleChange("remarks")}
              placeholder="Optional"
              rows={2}
              disabled={submitting}
            />
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="spinner-wrap">
                  <span className="spinner" />
                  Saving…
                </span>
              ) : mode === "create" ? (
                "Create Summary"
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

export default AttendanceSummaryFormModal;
