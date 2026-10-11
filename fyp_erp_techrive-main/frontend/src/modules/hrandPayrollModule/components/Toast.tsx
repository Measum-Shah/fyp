import React from "react";
import type { Notification } from "../hooks/useNotification";

interface ToastProps {
  notifications: Notification[];
  onDismiss: (id: number) => void;
}

/* ── Icons (same feather-style set already used in LoginPage.tsx) ───────── */
const IconAlert = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconClose = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Fixed-position stack in the corner of the viewport. Colors/borders reuse
// the existing global .alert-success / .alert-error / .alert-warning /
// .alert-info classes from index.css; only the stacking/positioning
// (.hr-toast-stack, .hr-toast, .hr-toast-*) classes are new, defined in
// pages/employee-module.css.
const Toast: React.FC<ToastProps> = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  const alertClassFor = (type: Notification["type"]) => {
    if (type === "success") return "alert-success";
    if (type === "warning") return "alert-warning";
    if (type === "info") return "alert-info";
    return "alert-error";
  };

  return (
    <div className="hr-toast-stack" role="status" aria-live="polite">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`alert hr-toast ${alertClassFor(n.type)}`}
        >
          {n.type === "success" ? <IconCheck /> : n.type === "warning" ? <IconAlertTriangle /> : <IconAlert />}
          <span className="hr-toast-message">{n.message}</span>
          <button
            type="button"
            className="hr-toast-close"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(n.id)}
          >
            <IconClose />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
