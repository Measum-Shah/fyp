import React, { useState } from "react";
import FormField from "./FormField";
import { useLeaveEntitlementLookups } from "../hooks/useLeaveEntitlementLookups";
import {
  isFormValid,
  validateLeaveEntitlementForm,
} from "../services/leaveEntitlement.validation";
import {
  EMPTY_LEAVE_ENTITLEMENT_FORM_VALUES,
  LEAVE_ENTITLEMENT_STATUS,
} from "../services/leaveEntitlement.types";
import type { LeaveEntitlementFormValues } from "../services/leaveEntitlement.types";

interface LeaveEntitlementFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: LeaveEntitlementFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: LeaveEntitlementFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LeaveEntitlementFormModal: React.FC<LeaveEntitlementFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<LeaveEntitlementFormValues>(
    initialValues ?? EMPTY_LEAVE_ENTITLEMENT_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const { employees, leaveTypes, loading: lookupsLoading } = useLeaveEntitlementLookups();

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof LeaveEntitlementFormValues) => errors[field];

  const handleChange = (
    field: keyof LeaveEntitlementFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const nextValue = field === "status" ? Number(e.target.value) : e.target.value;
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
    const validationErrors = validateLeaveEntitlementForm(values);
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
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="leave-entitlement-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="leave-entitlement-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Grant Leave Entitlement" : "Edit Leave Entitlement"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Employee" htmlFor="le-employee" required error={err("employee_id")}>
              <select
                id="le-employee"
                className={`field-input hr-select ${err("employee_id") ? "input-error" : ""}`}
                value={values.employee_id}
                onChange={handleChange("employee_id")}
                disabled={submitting || lookupsLoading}
              >
                <option value="">Select employee…</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                    {employee.reg_no ? ` (${employee.reg_no})` : ""}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Leave Type" htmlFor="le-leave-type" required error={err("leave_type_id")}>
              <select
                id="le-leave-type"
                className={`field-input hr-select ${err("leave_type_id") ? "input-error" : ""}`}
                value={values.leave_type_id}
                onChange={handleChange("leave_type_id")}
                disabled={submitting || lookupsLoading}
              >
                <option value="">Select leave type…</option>
                {leaveTypes.map((leaveType) => (
                  <option key={leaveType.id} value={leaveType.id}>
                    {leaveType.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Number of Days" htmlFor="le-no-of-days" required error={err("no_of_days")}>
              <input
                id="le-no-of-days"
                inputMode="numeric"
                min={0}
                step="0.5"
                className={`field-input ${err("no_of_days") ? "input-error" : ""}`}
                value={values.no_of_days}
                onChange={handleChange("no_of_days")}
                placeholder="e.g. 14"
                disabled={submitting}
              />
            </FormField>

            <FormField
              label="Days Used"
              htmlFor="le-days-used"
              hint="Adjust manually as approved leave is taken"
              error={err("days_used")}
            >
              <input
                id="le-days-used"
                inputMode="numeric"
                min={0}
                step="0.5"
                className={`field-input ${err("days_used") ? "input-error" : ""}`}
                value={values.days_used}
                onChange={handleChange("days_used")}
                disabled={submitting}
              />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Start Date" htmlFor="le-start-date" error={err("start_date")}>
              <input
                id="le-start-date"
                type="date"
                className={`field-input ${err("start_date") ? "input-error" : ""}`}
                value={values.start_date}
                onChange={handleChange("start_date")}
                disabled={submitting}
              />
            </FormField>

            <FormField label="End Date" htmlFor="le-end-date" error={err("end_date")}>
              <input
                id="le-end-date"
                type="date"
                className={`field-input ${err("end_date") ? "input-error" : ""}`}
                value={values.end_date}
                onChange={handleChange("end_date")}
                disabled={submitting}
              />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Credited Date" htmlFor="le-credited-date" error={err("credited_date")}>
              <input
                id="le-credited-date"
                type="date"
                className={`field-input ${err("credited_date") ? "input-error" : ""}`}
                value={values.credited_date}
                onChange={handleChange("credited_date")}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Status" htmlFor="le-status">
              <select
                id="le-status"
                className="field-input hr-select"
                value={values.status}
                onChange={handleChange("status")}
                disabled={submitting}
              >
                <option value={LEAVE_ENTITLEMENT_STATUS.ACTIVE}>Active</option>
                <option value={LEAVE_ENTITLEMENT_STATUS.INACTIVE}>Inactive</option>
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
                "Grant Entitlement"
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

export default LeaveEntitlementFormModal;
