import React from "react";

interface FormFieldProps {
  label: React.ReactNode;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

// Thin wrapper reusing the existing global .field-group / .field-label
// classes (from index.css) so form fields look identical to LoginPage's.
// Only the error-message and required-asterisk styling (.hr-field-*) is new.
const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}) => (
  <div className="field-group">
    <label htmlFor={htmlFor} className="field-label">
      {label}
      {required && <span className="hr-field-required"> *</span>}
    </label>
    {children}
    {error ? (
      <p className="hr-field-error" role="alert">
        {error}
      </p>
    ) : (
      hint && <p className="hr-field-hint">{hint}</p>
    )}
  </div>
);

export default FormField;
