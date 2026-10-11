import React, { useEffect } from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  const styleMap = {
    success: {
      bg: "var(--card-bg, #ffffff)",
      border: "1px solid var(--success, #10b981)",
      iconBg: "rgba(16, 185, 129, 0.1)",
      iconColor: "var(--success, #10b981)",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: "var(--card-bg, #ffffff)",
      border: "1px solid var(--error, #ef4444)",
      iconBg: "rgba(239, 68, 68, 0.1)",
      iconColor: "var(--error, #ef4444)",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bg: "var(--card-bg, #ffffff)",
      border: "1px solid #f59e0b",
      iconBg: "rgba(245, 158, 11, 0.1)",
      iconColor: "#f59e0b",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: "var(--card-bg, #ffffff)",
      border: "1px solid var(--accent, #1d6fbf)",
      iconBg: "rgba(29, 111, 191, 0.1)",
      iconColor: "var(--accent, #1d6fbf)",
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "400px",
        width: "100%",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => {
        const conf = styleMap[toast.type] || styleMap.info;
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: "auto",
              background: conf.bg,
              border: conf.border,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              animation: "toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <style>
              {`
                @keyframes toast-slide-in {
                  0% { opacity: 0; transform: translateY(20px) scale(0.95); }
                  100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .toast-close-btn {
                  color: var(--text-dark-sub, #64748b);
                  transition: color 0.2s ease;
                }
                .toast-close-btn:hover {
                  color: var(--text-dark, #0f172a);
                }
              `}
            </style>
            <div
              style={{
                flexShrink: 0,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: conf.iconBg,
                color: conf.iconColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "2px",
              }}
            >
              {conf.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-dark, #0f172a)", lineHeight: 1.4 }}>
                {toast.title}
              </h4>
              {toast.message && (
                <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-dark-sub, #64748b)", lineHeight: 1.5 }}>
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="toast-close-btn"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                margin: "-4px -4px 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Close notification"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
