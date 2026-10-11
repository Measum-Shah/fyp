import React from "react";

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
};

export const FeeField: React.FC<FieldProps> = ({
  label,
  required,
  error,
  children,
  hint,
}) => (
  <div className="fee-field">
    <label className="fee-label">
      {label}
      {required && <span className="fee-required">*</span>}
    </label>
    {children}
    {hint && !error && <p className="fee-hint">{hint}</p>}
    {error && <p className="fee-field-error">{error}</p>}
  </div>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const FeeInput: React.FC<InputProps> = ({ hasError, className, ...props }) => (
  <input
    className={`fee-input ${hasError ? "fee-input-error" : ""} ${className || ""}`}
    {...props}
  />
);

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
};

export const FeeSelect: React.FC<SelectProps> = ({
  hasError,
  options,
  placeholder = "Select…",
  className,
  ...props
}) => (
  <select
    className={`fee-input fee-select ${hasError ? "fee-input-error" : ""} ${className || ""}`}
    {...props}
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={String(opt.value)} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export const FeeTextarea: React.FC<TextAreaProps> = ({
  hasError,
  className,
  ...props
}) => (
  <textarea
    className={`fee-input fee-textarea ${hasError ? "fee-input-error" : ""} ${className || ""}`}
    {...props}
  />
);

export const FeeStatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`fee-badge ${active ? "fee-badge-active" : "fee-badge-inactive"}`}>
    {active ? "Active" : "Inactive"}
  </span>
);

export const FeeAlert: React.FC<{
  type?: "error" | "success" | "info";
  message: string;
  onClose?: () => void;
}> = ({ type = "info", message, onClose }) => (
  <div className={`fee-alert fee-alert-${type}`}>
    <span>{message}</span>
    {onClose && (
      <button type="button" className="fee-alert-close" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    )}
  </div>
);

export const FeeLoading: React.FC<{ label?: string }> = ({ label = "Loading…" }) => (
  <div className="fee-loading">
    <div className="fee-spinner" />
    <p>{label}</p>
  </div>
);

export const FeeEmptyState: React.FC<{
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div className="fee-empty">
    <div className="fee-empty-icon">◎</div>
    <h4>{title}</h4>
    {description && <p>{description}</p>}
    {actionLabel && onAction && (
      <button type="button" className="fee-btn fee-btn-primary" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
};

export const FeeModal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}) => {
  if (!open) return null;
  return (
    <div className="fee-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`fee-modal ${wide ? "fee-modal-wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="fee-modal-header">
          <h3>{title}</h3>
          <button type="button" className="fee-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="fee-modal-body">{children}</div>
        {footer && <div className="fee-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

type ConfirmProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const FeeConfirmDialog: React.FC<ConfirmProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  loading,
  onConfirm,
  onCancel,
}) => (
  <FeeModal
    open={open}
    title={title}
    onClose={onCancel}
    footer={
      <>
        <button type="button" className="fee-btn fee-btn-ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          className={`fee-btn ${danger ? "fee-btn-danger" : "fee-btn-primary"}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Please wait…" : confirmLabel}
        </button>
      </>
    }
  >
    <p className="fee-confirm-text">{message}</p>
  </FeeModal>
);

type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type TableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function FeeTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = "No records found",
  emptyDescription,
}: TableProps<T>) {
  if (loading) return <FeeLoading />;
  if (!rows.length) {
    return <FeeEmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="fee-table-wrap">
      <table className="fee-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
