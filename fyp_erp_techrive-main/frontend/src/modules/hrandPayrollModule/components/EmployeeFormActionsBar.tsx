import React from "react";

interface EmployeeFormActionsBarProps {
  // Native HTML form binding — this button doesn't need to be a DOM
  // descendant of the <form> it submits, which is what lets it stay
  // visible/reachable on every tab (including non-form tabs like
  // Qualifications/Assets) while EmployeeForm's <form> itself only ever
  // renders the fields for the currently active section.
  formId: string;
  submitting: boolean;
  submitLabel: string;
  onCancel: () => void;
  // ── Optional wizard-navigation props ─────────────────────────────────
  // Left undefined, this component behaves exactly as before (Cancel +
  // submit button) — used as-is by EmployeeProfilePage's Edit mode.
  // AddEmployeePage passes these to turn the same bar into a
  // Cancel / Previous / Next‑or‑Create-Employee row instead.
  //
  // Present only when a "Previous" step exists (i.e. not on the first step).
  onPrevious?: () => void;
  previousLabel?: string;
  // When false, the primary button becomes a plain "Next" button (type
  // "button", no form submission) instead of the submit button — so moving
  // between steps never triggers validation or the onSubmit handler.
  isFinalStep?: boolean;
  onNext?: () => void;
  nextLabel?: string;
}

// Shared by AddEmployeePage and EmployeeProfilePage (Edit mode) so the
// Cancel / Save row looks and behaves identically everywhere it appears.
const EmployeeFormActionsBar: React.FC<EmployeeFormActionsBarProps> = ({
  formId,
  submitting,
  submitLabel,
  onCancel,
  onPrevious,
  previousLabel = "Previous",
  isFinalStep = true,
  onNext,
  nextLabel = "Next",
}) => (
  <div className="hr-form-actions">
    <button
      type="button"
      className="hr-btn hr-btn-secondary"
      onClick={onCancel}
      disabled={submitting}
    >
      Cancel
    </button>

    {onPrevious && (
      <button
        type="button"
        className="hr-btn hr-btn-secondary"
        onClick={onPrevious}
        disabled={submitting}
      >
        {previousLabel}
      </button>
    )}

    {isFinalStep ? (
      <button type="submit" form={formId} className="hr-btn hr-btn-primary" disabled={submitting}>
        {submitting ? (
          <span className="spinner-wrap">
            <span className="spinner" />
            Saving…
          </span>
        ) : (
          submitLabel
        )}
      </button>
    ) : (
      <button
        type="button"
        className="hr-btn hr-btn-primary"
        onClick={onNext}
        disabled={submitting}
      >
        {nextLabel}
      </button>
    )}
  </div>
);

export default EmployeeFormActionsBar;
