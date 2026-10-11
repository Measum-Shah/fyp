import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "lg",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthMap: Record<string, string> = {
    sm: "400px",
    md: "500px",
    lg: "600px",
    xl: "720px",
    "2xl": "850px",
    "4xl": "1100px",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        backgroundColor: "rgba(5, 13, 26, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: widthMap[maxWidth] || "600px",
          backgroundColor: "var(--card-bg)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--card-border)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--card-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--input-bg)",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-dark)", letterSpacing: "-0.01em" }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: "0.78rem", color: "var(--text-dark-sub)", marginTop: "2px" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-dark-sub)",
              cursor: "pointer",
              padding: "0.35rem",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close dialog"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto", color: "var(--text-dark)", flex: 1 }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "1rem 1.5rem",
              borderTop: "1px solid var(--card-border)",
              background: "var(--input-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.75rem",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
