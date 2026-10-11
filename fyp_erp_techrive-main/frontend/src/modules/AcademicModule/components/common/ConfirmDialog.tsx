import React from "react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger",
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="submit-btn"
            style={{ background: "var(--input-disabled-bg)", color: "var(--text-dark)", width: "auto", margin: 0, padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="submit-btn"
            style={{
              background: type === "danger" ? "linear-gradient(135deg, var(--error) 0%, #b91c1c 100%)" : "var(--accent)",
              width: "auto",
              margin: 0,
              padding: "0.5rem 1rem",
              fontSize: "0.85rem",
              boxShadow: "none",
            }}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ padding: "0.75rem", borderRadius: "10px", background: "var(--error-bg)", color: "var(--error)", flexShrink: 0 }}>
          <svg style={{ width: "24px", height: "24px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-dark)", lineHeight: 1.5 }}>
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
};
