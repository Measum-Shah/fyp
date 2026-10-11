import React, { useState } from "react";
import FormField from "./FormField";
import { useLoanRequestLookups } from "../hooks/useLoanRequestLookups";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useLoanTypeLookup } from "../hooks/useLoanTypes";
import {
  isFormValid,
  validateLoanRequestForm,
  calculateMonthlyInstallment,
} from "../services/loanRequest.validation";
import { EMPTY_LOAN_REQUEST_FORM_VALUES } from "../services/loanRequest.types";
import type { LoanRequestFormValues } from "../services/loanRequest.types";
import { loanRequestAPI, resolveLoanRequestAttachmentUrl } from "../services/loanRequest.service";
import { getApiErrorMessage } from "../services/employee.service";

interface LoanRequestFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: LoanRequestFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: LoanRequestFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LoanRequestFormModal: React.FC<LoanRequestFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<LoanRequestFormValues>(
    initialValues ?? EMPTY_LOAN_REQUEST_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // "Monthly Deduction" auto-calculates from Amount ÷ Installments as the
  // user types, same formula loanRequest.service.ts falls back to on the
  // backend if this field is ever omitted — this just makes that
  // calculation visible/live instead of an invisible submit-time default.
  // Once the user directly edits this field it's treated as a manual
  // override and stops auto-updating; clearing it back to empty resumes
  // auto-calculation. In edit mode, an existing saved value is treated as
  // already-deliberate and left alone until the user touches Amount or
  // Installments.
  const [monthlyTouched, setMonthlyTouched] = useState(
    mode === "edit" && (initialValues?.monthly_installment ?? "") !== ""
  );

  // Company → Branch cascade (see the Company→Branch scoping task). The
  // record itself only stores branch_id, so companyId is local UI-only
  // state used purely to narrow the Branch dropdown. In edit mode there's
  // no stored company_id to prefill, so default to the legacy full list
  // (undefined) rather than empty/gated — otherwise an existing branch
  // selection would vanish from the dropdown until the user manually
  // re-picked a company (task: "Don't break existing saved... decide and
  // document a sane fallback").
  const [companyId, setCompanyId] = useState<number | null | undefined>(
    mode === "edit" ? undefined : null
  );
  const { companies } = useCompanyLookup();
  const { employees, branches, loading: lookupsLoading } = useLoanRequestLookups(companyId);
  const { loanTypes, loading: loanTypesLoading } = useLoanTypeLookup();

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanyId(e.target.value ? Number(e.target.value) : null);
    // A branch from the old company is no longer valid/visible — clear it.
    setValues((prev) => ({ ...prev, branch_id: "" }));
  };

  // request_loan_employee.type is a plain free-text column with no FK to
  // erp_loans — the dropdown is a UX convenience, so a value already saved
  // that doesn't match any current Loan Type (e.g. one since deleted/renamed)
  // is kept as a selectable option rather than silently lost.
  const currentTypeInList = values.type === "" || loanTypes.some((t) => t.name === values.type);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof LoanRequestFormValues) => errors[field];

  const handleChange = (
    field: keyof LoanRequestFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const nextValue = e.target.value;

    if (field === "monthly_installment") {
      // Empty = "go back to automatic"; anything else = a deliberate
      // manual override that Amount/Installments changes shouldn't clobber.
      setMonthlyTouched(nextValue.trim() !== "");
      setValues((prev) => ({ ...prev, monthly_installment: nextValue }));
    } else if (field === "amount" || field === "installments") {
      setValues((prev) => {
        const next = { ...prev, [field]: nextValue };
        if (!monthlyTouched) {
          const amount = Number(field === "amount" ? nextValue : prev.amount);
          const installments = Number(field === "installments" ? nextValue : prev.installments);
          next.monthly_installment =
            amount > 0 && installments > 0
              ? String(calculateMonthlyInstallment(amount, installments))
              : "";
        }
        return next;
      });
    } else {
      setValues((prev) => ({ ...prev, [field]: nextValue }));
    }

    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Real click-to-upload for the Attachment field — mirrors
  // ResignationFormModal.tsx's experience-letter upload. The
  // <input type="file"> itself never sends the file to the server on save;
  // it uploads immediately on selection and the resulting public path is
  // what gets stored on the loan request record.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const res = await loanRequestAPI.uploadAttachment(file);
      setValues((prev) => ({ ...prev, attachment_file: res.data.attachment_file }));
      setClientErrors((prev) => {
        if (!("attachment_file" in prev)) return prev;
        const next = { ...prev };
        delete next.attachment_file;
        return next;
      });
    } catch (uploadErr) {
      setUploadError(getApiErrorMessage(uploadErr));
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => setValues((prev) => ({ ...prev, attachment_file: "" }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateLoanRequestForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) {
      onSubmit(values);
    }
  };

  const attachmentUrl = resolveLoanRequestAttachmentUrl(values.attachment_file);
  const attachmentFileName = values.attachment_file ? values.attachment_file.split("/").pop() : null;

  return (
    <div
      className="hr-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div
        className="hr-modal hr-modal-form hr-modal-form-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loan-request-modal-title"
      >
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="loan-request-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "New Loan Request" : "Edit Loan Request"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Employee" htmlFor="lnr-employee" required error={err("staff_id")}>
              <select
                id="lnr-employee"
                className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`}
                value={values.staff_id}
                onChange={handleChange("staff_id")}
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

            <FormField label="School" htmlFor="lnr-company">
              <select
                id="lnr-company"
                className="field-input hr-select"
                value={companyId ?? ""}
                onChange={handleCompanyChange}
                disabled={submitting}
              >
                <option value="">Select school…</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>

            <FormField label="Campus" htmlFor="lnr-branch" required error={err("branch_id")}>
              <select
                id="lnr-branch"
                className={`field-input hr-select ${err("branch_id") ? "input-error" : ""}`}
                value={values.branch_id}
                onChange={handleChange("branch_id")}
                disabled={submitting || lookupsLoading || companyId === null}
              >
                <option value="">{companyId === null ? "Select a school first…" : "Select campus…"}</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="hr-form-grid">
<FormField label="Loan Type" htmlFor="lnr-type" required error={err("type")}>
              <select
                id="lnr-type"
                className={`field-input hr-select ${err("type") ? "input-error" : ""}`}
                value={values.type}
                onChange={handleChange("type")}
                disabled={submitting || loanTypesLoading}
              >
                <option value="">Select loan type…</option>
                {!currentTypeInList && (
                  <option value={values.type}>{values.type} (no longer in Loan Types)</option>
                )}
                {loanTypes.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Effective From" htmlFor="lnr-effective-from" required error={err("effective_from")}>
              <input
                id="lnr-effective-from"
                type="date"
                className={`field-input ${err("effective_from") ? "input-error" : ""}`}
                value={values.effective_from}
                onChange={handleChange("effective_from")}
                disabled={submitting}
              />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Amount" htmlFor="lnr-amount" required error={err("amount")}>
              <input
                id="lnr-amount"
                inputMode="numeric"
                min={1}
                className={`field-input ${err("amount") ? "input-error" : ""}`}
                value={values.amount}
                onChange={handleChange("amount")}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Installments" htmlFor="lnr-installments" required error={err("installments")}>
              <input
                id="lnr-installments"
                inputMode="numeric"
                min={1}
                className={`field-input ${err("installments") ? "input-error" : ""}`}
                value={values.installments}
                onChange={handleChange("installments")}
                disabled={submitting}
              />
            </FormField>
          </div>

          <FormField
            label="Monthly Deduction"
            htmlFor="lnr-monthly-installment"
            hint={
              monthlyTouched
                ? "Manually overridden — clear this field to go back to automatic."
                : "Auto-calculated from Amount ÷ Installments."
            }
            error={err("monthly_installment")}
          >
            <input
              id="lnr-monthly-installment"
              inputMode="numeric"
              min={1}
              className={`field-input ${err("monthly_installment") ? "input-error" : ""}`}
              value={values.monthly_installment}
              onChange={handleChange("monthly_installment")}
              disabled={submitting}
            />
          </FormField>

          <FormField label="Reason" htmlFor="lnr-reason" hint="Employee's reason for the loan" error={err("reason")}>
            <textarea
              id="lnr-reason"
              className="field-input hr-textarea"
              value={values.reason}
              onChange={handleChange("reason")}
              rows={2}
              disabled={submitting}
            />
          </FormField>

          <FormField
            label="Attachment"
            htmlFor="lnr-attachment"
            error={err("attachment_file") ?? (uploadError ?? undefined)}
          >
            <input
              id="lnr-attachment"
              type="file"
              className="field-input"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={submitting || uploading}
            />
            {uploading && <p className="hr-field-hint">Uploading…</p>}
            {!uploading && attachmentFileName && (
              <p className="hr-field-hint">
                Selected:{" "}
                {attachmentUrl ? (
                  <a href={attachmentUrl} target="_blank" rel="noreferrer">
                    {attachmentFileName}
                  </a>
                ) : (
                  attachmentFileName
                )}
                {" — "}
                <button type="button" className="hr-btn-linklike" onClick={removeAttachment} disabled={submitting}>
                  Remove
                </button>
              </p>
            )}
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
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting || uploading}>
              {submitting ? (
                <span className="spinner-wrap">
                  <span className="spinner" />
                  Saving…
                </span>
              ) : mode === "create" ? (
                "Submit Loan Request"
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

export default LoanRequestFormModal;
