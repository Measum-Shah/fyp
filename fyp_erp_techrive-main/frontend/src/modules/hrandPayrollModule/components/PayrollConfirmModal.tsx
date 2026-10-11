import React from "react";

interface PayrollConfirmModalProps {
  open: boolean;
  employeeCount: number;
  // How many of the selected employees have no ACTIVE bank account on
  // file (see payrollRun.service.ts's listEligibleStaff/runPayrollBatch —
  // an inactive or missing account doesn't block generation, it just
  // leaves that sheet's bank_account field blank on an otherwise "Paid"
  // record). Surfaced here so the person confirming knows before they
  // commit, since the wording below already promises money will be
  // credited to "their bank accounts."
  withoutActiveBankAccountCount?: number;
  branchName?: string;
  monthLabel?: string;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const IconAlertTriangle = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Shown BEFORE the actual generate call fires, not after — generating a
// Payroll Run now represents the real disbursement of salaries for that
// branch/month (see payrollRun.service.ts: every sheet it creates is
// saved with salary_status: Paid immediately, not the usual Pending
// draft), so this is a precaution asking the person to confirm they mean
// to do that, not a reminder telling them it already happened. Cancelling
// returns to the Generate Payroll form with everything the person already
// filled in still intact (see PayrollRunsPage.tsx — the form modal stays
// mounted underneath, it's just hidden while this is open).
const PayrollConfirmModal: React.FC<PayrollConfirmModalProps> = ({
  open,
  employeeCount,
  withoutActiveBankAccountCount = 0,
  branchName,
  monthLabel,
  submitting,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="hr-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="hr-modal" role="alertdialog" aria-modal="true" aria-labelledby="payroll-confirm-title">
        <div className="hr-modal-icon hr-modal-icon-warning">
          <IconAlertTriangle />
        </div>

        <h3 id="payroll-confirm-title" className="hr-modal-title">
          Confirm Payroll Generation
        </h3>
        <p className="hr-modal-message">
          By this action, salary for {employeeCount} employee{employeeCount === 1 ? "" : "s"}
          {branchName ? ` in ${branchName}` : ""}{monthLabel ? ` for ${monthLabel}` : ""} will be
          credited to their bank accounts. This cannot be undone. Do you want to continue?
        </p>

        {withoutActiveBankAccountCount > 0 && (
          <p className="hr-modal-message hr-modal-message-warning">
            ⚠ {withoutActiveBankAccountCount} of these employee{withoutActiveBankAccountCount === 1 ? "" : "s"} {withoutActiveBankAccountCount === 1 ? "has" : "have"} no
            active bank account on file — {withoutActiveBankAccountCount === 1 ? "their" : "their"} salary sheet will still be generated and marked Paid, but with no
            account to actually credit. You can still proceed and fix the bank account details afterward.
          </p>
        )}

        <div className="hr-modal-actions">
          <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="hr-btn hr-btn-primary" onClick={onConfirm} disabled={submitting}>
            {submitting ? (
              <span className="spinner-wrap"><span className="spinner" />Generating…</span>
            ) : "Yes, Generate & Credit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollConfirmModal;
