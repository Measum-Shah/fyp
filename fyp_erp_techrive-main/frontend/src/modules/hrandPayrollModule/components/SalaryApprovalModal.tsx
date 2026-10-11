import React, { useState } from "react";
import FormField from "./FormField";
import { APPROVAL_STATUS } from "../services/salary.types";
import type { SalarySheet, UpdateSalaryApprovalPayload } from "../services/salary.types";

interface SalaryApprovalModalProps {
  open: boolean;
  record: SalarySheet | null;
  submitting: boolean;
  onSubmit: (payload: UpdateSalaryApprovalPayload) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// A sheet's core figures lock once CEO approval moves past Pending.
// Newly created sheets start as Inactive; approving here activates the sheet (Active)
// so it can proceed to payment/disbursement.
const SalaryApprovalModal: React.FC<SalaryApprovalModalProps> = ({
  open,
  record,
  submitting,
  onSubmit,
  onCancel,
}) => {
  const [draft, setDraft] = useState<UpdateSalaryApprovalPayload>({});

  if (!open || !record) return null;

  const currentStatus =
    draft.ceo_status ??
    draft.hr_status ??
    (record.ceo_salary_status && record.ceo_salary_status !== "Pending" ? record.ceo_salary_status : undefined) ??
    (record.accountant_salary_status && record.accountant_salary_status !== "Pending" ? record.accountant_salary_status : undefined) ??
    APPROVAL_STATUS.PENDING;

  const currentName =
    draft.ceo_approved_by ??
    draft.hr_approved_by ??
    (record.ceo_name_salary_approve && record.ceo_name_salary_approve !== "Pending" ? record.ceo_name_salary_approve : "") ??
    (record.accountant_name_salary_approve && record.accountant_name_salary_approve !== "Pending" ? record.accountant_name_salary_approve : "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ceo_status: (draft.ceo_status ?? currentStatus) as UpdateSalaryApprovalPayload["ceo_status"],
      ceo_approved_by: draft.ceo_approved_by ?? currentName,
      hr_status: (draft.hr_status ?? currentStatus) as UpdateSalaryApprovalPayload["hr_status"],
      hr_approved_by: draft.hr_approved_by ?? currentName,
    });
  };

  return (
    <div
      className="hr-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="salary-approval-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close">
          <IconClose />
        </button>

        <h3 id="salary-approval-title" className="hr-modal-title hr-modal-title-left">
          CEO Approval — {record.sheet_code}
        </h3>
        <p className="hr-field-hint" style={{ marginTop: "0.25rem" }}>
          Employee: <strong>{record.name}</strong> | Gross Salary: <strong>₨ {(record.gross_salary || 0).toLocaleString()}</strong> | Net Salary: <strong>₨ {(record.net_salary ?? 0).toLocaleString()}</strong>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="CEO Approval Status" htmlFor="appr-ceo-status">
              <select
                id="appr-ceo-status"
                className="field-input hr-select"
                value={currentStatus}
                onChange={(e) => {
                  const val = e.target.value as UpdateSalaryApprovalPayload["ceo_status"];
                  setDraft((prev) => ({ ...prev, ceo_status: val, hr_status: val }));
                }}
                disabled={submitting}
              >
                <option value={APPROVAL_STATUS.PENDING}>Pending</option>
                <option value={APPROVAL_STATUS.APPROVED}>Approved</option>
                <option value={APPROVAL_STATUS.REJECTED}>Rejected</option>
              </select>
            </FormField>

            <FormField label="Approved By (CEO / Approver)" htmlFor="appr-ceo-name">
              <input
                id="appr-ceo-name"
                className="field-input"
                value={currentName}
                onChange={(e) => {
                  const val = e.target.value;
                  setDraft((prev) => ({ ...prev, ceo_approved_by: val, hr_approved_by: val }));
                }}
                placeholder="CEO Name"
                disabled={submitting}
              />
            </FormField>
          </div>

          {currentStatus === APPROVAL_STATUS.APPROVED && (
            <p className="hr-field-hint" style={{ color: "var(--color-success, #10b981)" }}>
              ✅ Approving will transition this salary sheet from <strong>Inactive</strong> to <strong>Active</strong>.
            </p>
          )}
          {currentStatus === APPROVAL_STATUS.REJECTED && (
            <p className="hr-field-hint" style={{ color: "var(--color-danger, #ef4444)" }}>
              ❌ Rejecting will mark this salary sheet as <strong>Rejected</strong> and keep it Inactive.
            </p>
          )}
          {currentStatus === APPROVAL_STATUS.PENDING && (
            <p className="hr-field-hint">
              ⏳ Pending salary sheets remain <strong>Inactive</strong> until CEO approval.
            </p>
          )}

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="spinner-wrap"><span className="spinner" />Saving…</span>
              ) : "Save CEO Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryApprovalModal;
