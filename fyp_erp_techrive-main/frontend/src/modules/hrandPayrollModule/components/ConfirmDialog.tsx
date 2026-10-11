import React from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Simple, self-contained modal (no portal library available in this project)
// used for destructive confirmations such as Delete Employee. All classes
// (.hr-modal-*) are new, defined in pages/employee-module.css, built on the
// existing --card-bg / --shadow-card / --radius-card design tokens.
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="hr-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="hr-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className={`hr-modal-icon ${danger ? "hr-modal-icon-danger" : ""}`}>
          <IconWarning />
        </div>

        <h3 id="confirm-dialog-title" className="hr-modal-title">
          {title}
        </h3>
        <p className="hr-modal-message">{message}</p>

        <div className="hr-modal-actions">
          <button
            type="button"
            className="hr-btn hr-btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`hr-btn ${danger ? "hr-btn-danger" : "hr-btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-wrap">
                <span className="spinner" />
                Please wait…
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
