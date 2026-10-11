import React, { useEffect, useState } from "react";
import FormField from "./FormField";
import type { User } from "../services/user.types";

interface ResetPasswordModalProps {
  open: boolean;
  user?: User | null;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (password: string) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Deliberately its own small modal rather than a field inside
// UserFormModal — matches the backend split (PUT /users/:id vs. PUT
// /users/:id/reset-password), which is its own permission
// ("user.reset_password") so it can be granted/withheld independently of
// general "user.update" access.
const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  open,
  user,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirmPassword("");
      setClientErrors({});
    }
  }, [open, user?.id]);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors: Record<string, string> = {};
    if (!password) {
      validationErrors.password = "Password is required";
    } else if (password.length < 6) {
      validationErrors.password = "Password must be at least 6 characters";
    }
    if (password !== confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
    }
    setClientErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      onSubmit(password);
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
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close">
          <IconClose />
        </button>

        <h3 id="reset-password-title" className="hr-modal-title hr-modal-title-left">
          Reset Password — {user?.name}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="New Password" htmlFor="reset-password" required error={errors.password}>
            <input
              id="reset-password"
              type="password"
              className={`field-input ${errors.password ? "input-error" : ""}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <FormField label="Confirm Password" htmlFor="reset-password-confirm" required error={errors.confirmPassword}>
            <input
              id="reset-password-confirm"
              type="password"
              className={`field-input ${errors.confirmPassword ? "input-error" : ""}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter the new password"
              disabled={submitting}
            />
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="spinner-wrap">
                  <span className="spinner" />
                  Saving…
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
