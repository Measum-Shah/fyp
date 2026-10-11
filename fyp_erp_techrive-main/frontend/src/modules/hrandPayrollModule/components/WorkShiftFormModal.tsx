import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateWorkShiftForm } from "../services/workShift.validation";
import { EMPTY_WORK_SHIFT_FORM_VALUES, WORK_SHIFT_STATUS } from "../services/workShift.types";
import { WORK_WEEK_DAYS_ORDERED } from "../services/workShift.constants";
import type { WorkShiftFormValues } from "../services/workShift.types";
import type { LookupOption } from "../services/employee.types";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";

interface WorkShiftFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: WorkShiftFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: WorkShiftFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// erp_hrm_work_shifts + its 7-row erp_hrm_work_weeks schedule are edited
// together in one form — a shift is meaningless without its weekly
// schedule, and the schedule always belongs to exactly one shift, so there's
// no reason to split them across two screens (see workShift.service.ts,
// which already creates/updates both inside a single transaction).
const WorkShiftFormModal: React.FC<WorkShiftFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<WorkShiftFormValues>(
    initialValues ?? EMPTY_WORK_SHIFT_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // Company → Branch cascade (see the Company→Branch scoping task). Branch
  // here is optional (org-wide shift when left unselected) and edit mode
  // has no stored company_id to prefill, so default to the legacy full
  // list (undefined) rather than empty/gated.
  const [companyId, setCompanyId] = useState<number | null | undefined>(
    mode === "edit" ? undefined : null
  );
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof WorkShiftFormValues) => errors[field as string];
  const weekErr = (day: number, field: "start_time" | "end_time") =>
    errors[`week.${day}.${field}`];

  const handleChange = (
    field: keyof WorkShiftFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const nextValue = e.target.value;
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  };

  const updateWeekDay = (
    day: number,
    patch: Partial<WorkShiftFormValues["week"][number]>
  ) => {
    setValues((prev) => ({
      ...prev,
      week: prev.week.map((d) => (d.day === day ? { ...d, ...patch } : d)),
    }));
    setClientErrors((prev) => {
      const next = { ...prev };
      delete next[`week.${day}.start_time`];
      delete next[`week.${day}.end_time`];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateWorkShiftForm(values);
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
      <div className="hr-modal hr-modal-form hr-modal-form-wide" role="dialog" aria-modal="true" aria-labelledby="work-shift-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="work-shift-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Work Shift" : "Edit Work Shift"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Shift Name" htmlFor="shift-name" required error={err("name")}>
              <input
                id="shift-name"
                className={`field-input ${err("name") ? "input-error" : ""}`}
                value={values.name}
                onChange={handleChange("name")}
                placeholder="e.g. Morning Shift"
                disabled={submitting}
                autoFocus
              />
            </FormField>

            <FormField label="School / University" htmlFor="shift-company">
              <select
                id="shift-company"
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
              htmlFor="shift-branch"
              error={err("branch_id")}
              hint="Leave unselected for a shift shared across all campuses"
            >
              <select
                id="shift-branch"
                className="field-input hr-select"
                value={values.branch_id}
                onChange={handleChange("branch_id")}
                disabled={submitting}
              >
                <option value="">All campuses</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FormField>

            {mode === "edit" && (
              <FormField label="Status" htmlFor="shift-status" error={err("status")}>
                <select
                  id="shift-status"
                  className="field-input hr-select"
                  value={values.status}
                  onChange={handleChange("status")}
                  disabled={submitting}
                >
                  <option value={WORK_SHIFT_STATUS.ACTIVE}>Active</option>
                  <option value={WORK_SHIFT_STATUS.INACTIVE}>Inactive</option>
                </select>
              </FormField>
            )}

            <FormField
              label="Grace-in (minutes)"
              htmlFor="shift-grace-in"
              error={err("grace_in")}
              hint="Minutes an employee may clock in late without being marked late"
            >
              <input
                id="shift-grace-in"
                inputMode="numeric"
                className={`field-input ${err("grace_in") ? "input-error" : ""}`}
                value={values.grace_in}
                onChange={handleChange("grace_in")}
                placeholder="Optional, e.g. 15"
                disabled={submitting}
              />
            </FormField>

            <FormField
              label="Grace-out (minutes)"
              htmlFor="shift-grace-out"
              error={err("grace_out")}
              hint="Minutes an employee may clock out early without being flagged"
            >
              <input
                id="shift-grace-out"
                inputMode="numeric"
                className={`field-input ${err("grace_out") ? "input-error" : ""}`}
                value={values.grace_out}
                onChange={handleChange("grace_out")}
                placeholder="Optional, e.g. 10"
                disabled={submitting}
              />
            </FormField>
          </div>

          {/* ── Weekly Schedule ──────────────────────────────────────────── */}
          <h4 className="hr-form-section-title">Weekly Schedule</h4>
          <p className="hr-field-hint">
            Toggle each day on or off and set its working hours. Off days don't need times.
          </p>

          <div className="hr-table-wrap hr-week-table-wrap">
            <table className="hr-table hr-week-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Working?</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                </tr>
              </thead>
              <tbody>
                {WORK_WEEK_DAYS_ORDERED.map(({ day, label }) => {
                  const row = values.week.find((d) => d.day === day)!;
                  return (
                    <tr key={day} className={!row.on_off ? "hr-week-off-row" : ""}>
                      <td className="hr-table-name">{label}</td>
                      <td>
                        <label className="hr-week-toggle">
                          <input
                            type="checkbox"
                            checked={row.on_off}
                            onChange={(e) => updateWeekDay(day, { on_off: e.target.checked })}
                            disabled={submitting}
                          />
                          <span>{row.on_off ? "Working" : "Off"}</span>
                        </label>
                      </td>
                      <td>
                        <input
                          type="time"
                          className={`field-input ${weekErr(day, "start_time") ? "input-error" : ""}`}
                          value={row.start_time}
                          onChange={(e) => updateWeekDay(day, { start_time: e.target.value })}
                          disabled={submitting || !row.on_off}
                        />
                        {weekErr(day, "start_time") && (
                          <p className="hr-field-error" role="alert">
                            {weekErr(day, "start_time")}
                          </p>
                        )}
                      </td>
                      <td>
                        <input
                          type="time"
                          className={`field-input ${weekErr(day, "end_time") ? "input-error" : ""}`}
                          value={row.end_time}
                          onChange={(e) => updateWeekDay(day, { end_time: e.target.value })}
                          disabled={submitting || !row.on_off}
                        />
                        {weekErr(day, "end_time") && (
                          <p className="hr-field-error" role="alert">
                            {weekErr(day, "end_time")}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                "Create Shift"
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

export default WorkShiftFormModal;
