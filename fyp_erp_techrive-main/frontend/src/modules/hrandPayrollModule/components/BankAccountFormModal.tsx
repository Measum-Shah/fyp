import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateBankAccountForm } from "../services/bankAccount.validation";
import { EMPTY_BANK_ACCOUNT_FORM_VALUES, BANK_ACCOUNT_STATUS } from "../services/bankAccount.types";
import type { BankAccountFormValues } from "../services/bankAccount.types";
import type { LookupOption } from "../services/employee.types";

interface BankAccountFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: BankAccountFormValues;
  staff: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: BankAccountFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Rebuilt from scratch — this file used to be an exact byte-for-byte copy of
// BranchFormModal.tsx (wrong types, wrong fields, even titled "Add Campus"),
// left over from however the file was originally scaffolded. The Bank
// Accounts page was rendering a Campus form instead of a bank account form.
// This is the real thing: one employee (via a plain LookupOption dropdown,
// not a School→Campus cascade — an employee's branch/campus is already
// fixed on their own record, unrelated to which bank account they use),
// account title, account number, bank branch name, and status.
const BankAccountFormModal: React.FC<BankAccountFormModalProps> = ({
  open,
  mode,
  initialValues,
  staff,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<BankAccountFormValues>(
    initialValues ?? EMPTY_BANK_ACCOUNT_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof BankAccountFormValues) => errors[field];

  const handleChange = (
    field: keyof BankAccountFormValues
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateBankAccountForm(values);
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
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="bank-account-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="bank-account-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Bank Account" : "Edit Bank Account"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Employee" htmlFor="ba-staff" required error={err("staff_id")}>
              <select
                id="ba-staff"
                className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`}
                value={values.staff_id}
                onChange={handleChange("staff_id")}
                disabled={submitting || mode === "edit"}
              >
                <option value="">Select employee…</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>

            {mode === "edit" && (
              <FormField label="Status" htmlFor="ba-status" error={err("status")}>
                <select
                  id="ba-status"
                  className="field-input hr-select"
                  value={values.status}
                  onChange={handleChange("status")}
                  disabled={submitting}
                >
                  <option value={BANK_ACCOUNT_STATUS.ACTIVE}>Active</option>
                  <option value={BANK_ACCOUNT_STATUS.INACTIVE}>Inactive</option>
                </select>
              </FormField>
            )}

            <FormField label="Account Title" htmlFor="ba-title" required error={err("account_title")}>
              <input
                id="ba-title"
                className={`field-input ${err("account_title") ? "input-error" : ""}`}
                value={values.account_title}
                onChange={handleChange("account_title")}
                placeholder="Name on the account"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Account Number" htmlFor="ba-number" required error={err("account_number")}>
              <input
                id="ba-number"
                className={`field-input ${err("account_number") ? "input-error" : ""}`}
                value={values.account_number}
                onChange={handleChange("account_number")}
                placeholder="e.g. IBAN or account no."
                disabled={submitting}
              />
            </FormField>

            <FormField label="Bank / Branch" htmlFor="ba-branch" required error={err("bank_branch")}>
              <input
                id="ba-branch"
                className={`field-input ${err("bank_branch") ? "input-error" : ""}`}
                value={values.bank_branch}
                onChange={handleChange("bank_branch")}
                placeholder="e.g. HBL — Gulberg Branch"
                disabled={submitting}
              />
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
                "Add Bank Account"
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

export default BankAccountFormModal;
