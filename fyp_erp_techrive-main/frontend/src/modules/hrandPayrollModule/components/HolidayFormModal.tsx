import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, previewDayCount, validateHolidayForm } from "../services/holiday.validation";
import { EMPTY_HOLIDAY_FORM_VALUES } from "../services/holiday.types";
import type { HolidayFormValues } from "../services/holiday.types";

interface HolidayFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: HolidayFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: HolidayFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Holiday Name | Number of Days | Start Date | End Date. Holiday Name and
// Number of Days are required; Start Date and End Date are optional. When
// both dates are filled in, `days` is still recomputed from them
// server-side (see holiday.service.ts) and the live preview below reflects
// that — otherwise the manually-entered Number of Days is what gets saved.
const HolidayFormModal: React.FC<HolidayFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<HolidayFormValues>(
    initialValues ?? EMPTY_HOLIDAY_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof HolidayFormValues) => errors[field];
  const dayCount = previewDayCount(values.start_date, values.end_date);

  const handleChange = (
    field: keyof HolidayFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement>
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
    const validationErrors = validateHolidayForm(values);
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
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="holiday-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="holiday-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Holiday" : "Edit Holiday"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Holiday Name" htmlFor="holiday-name" required error={err("holiday_name")}>
            <input
              id="holiday-name"
              className={`field-input ${err("holiday_name") ? "input-error" : ""}`}
              value={values.holiday_name}
              onChange={handleChange("holiday_name")}
              placeholder="e.g. Independence Day"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <FormField label="Number of Days" htmlFor="holiday-days" required error={err("days")}>
            <input
              id="holiday-days"
              inputMode="numeric"
              min={1}
              step={1}
              className={`field-input ${err("days") ? "input-error" : ""}`}
              value={values.days}
              onChange={handleChange("days")}
              placeholder="e.g. 1"
              disabled={submitting}
            />
          </FormField>

          <div className="hr-form-grid">
            <FormField label="Start Date" htmlFor="holiday-start-date" error={err("start_date")}>
              <input
                id="holiday-start-date"
                type="date"
                className={`field-input ${err("start_date") ? "input-error" : ""}`}
                value={values.start_date}
                onChange={handleChange("start_date")}
                disabled={submitting}
              />
            </FormField>

            <FormField label="End Date" htmlFor="holiday-end-date" error={err("end_date")}>
              <input
                id="holiday-end-date"
                type="date"
                className={`field-input ${err("end_date") ? "input-error" : ""}`}
                value={values.end_date}
                onChange={handleChange("end_date")}
                disabled={submitting}
              />
            </FormField>
          </div>

          {dayCount !== null && (
            <p className="hr-field-hint">
              This holiday spans <strong>{dayCount}</strong> day{dayCount === 1 ? "" : "s"} — the Number of
              Days field above will be recalculated from these dates when saved.
            </p>
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
                "Create Holiday"
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

export default HolidayFormModal;
