import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validatePerformanceForm } from "../services/performance.validation";
import { EMPTY_PERFORMANCE_FORM_VALUES, MONTH_OPTIONS, PERFORMANCE_RATING } from "../services/performance.types";
import type { PerformanceFormValues } from "../services/performance.types";
import type { LookupOption } from "../services/employee.types";

interface PerformanceFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: PerformanceFormValues;
  staff: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: PerformanceFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const RATING_OPTIONS = [
  PERFORMANCE_RATING.EXCELLENT,
  PERFORMANCE_RATING.GOOD,
  PERFORMANCE_RATING.AVERAGE,
  PERFORMANCE_RATING.POOR,
];

// Simplified Add/Edit Performance Review form: Employee | Month | Date |
// Performance. All four fields are required. Performance is a dropdown
// constrained to Excellent/Good/Average/Poor.
const PerformanceFormModal: React.FC<PerformanceFormModalProps> = ({
  open, mode, initialValues, staff, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<PerformanceFormValues>(initialValues ?? EMPTY_PERFORMANCE_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof PerformanceFormValues) => errors[field];

  const handleChange = (field: keyof PerformanceFormValues) => (
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
    const validationErrors = validatePerformanceForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="perf-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="perf-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Performance Review" : "Edit Performance Review"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Employee" htmlFor="perf-staff" required error={err("staff_id")}>
              <select id="perf-staff" className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`} value={values.staff_id} onChange={handleChange("staff_id")} disabled={submitting || mode === "edit"}>
                <option value="">Select employee…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>

            <FormField label="Month" htmlFor="perf-month" required error={err("month")}>
              <select id="perf-month" className={`field-input hr-select ${err("month") ? "input-error" : ""}`} value={values.month} onChange={handleChange("month")} disabled={submitting}>
                {MONTH_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </FormField>

            <FormField label="Date" htmlFor="perf-date" required error={err("date")}>
              <input id="perf-date" type="date" className={`field-input ${err("date") ? "input-error" : ""}`} value={values.date} onChange={handleChange("date")} disabled={submitting} />
            </FormField>

            <FormField label="Performance" htmlFor="perf-performance" required error={err("performance")}>
              <select id="perf-performance" className={`field-input hr-select ${err("performance") ? "input-error" : ""}`} value={values.performance} onChange={handleChange("performance")} disabled={submitting}>
                {RATING_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </FormField>
          </div>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Add Review" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PerformanceFormModal;
