import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateCompanyForm } from "../services/company.validation";
import { EMPTY_COMPANY_FORM_VALUES, COMPANY_STATUS } from "../services/company.types";
import type { CompanyFormValues } from "../services/company.types";

interface CompanyFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: CompanyFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: CompanyFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Same modal-handles-both-modes pattern as BranchFormModal/DepartmentFormModal
// (.hr-modal-form-wide + the existing .hr-form-grid 2-column layout, since
// Company has 10 editable fields — closer to Branch's field count than
// Department's). No dropdown dependency here, unlike BranchFormModal — Company
// sits at the top of the hierarchy (Company → Branch), so there's nothing for
// it to look up.
//
// NOTE: like BranchFormModal/DepartmentFormModal, `initialValues` is only
// read once via the useState initializer — CompaniesPage always has the full
// Company object already in memory before opening this modal in edit mode,
// and the parent supplies a `key` that changes per open/edit-target to force
// a clean remount rather than relying on a prop-sync effect.
const CompanyFormModal: React.FC<CompanyFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<CompanyFormValues>(
    initialValues ?? EMPTY_COMPANY_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof CompanyFormValues) => errors[field];

  const handleChange = (
    field: keyof CompanyFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const nextValue = e.target.value;
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateCompanyForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) {
      onSubmit(values);
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
      <div className="hr-modal hr-modal-form hr-modal-form-wide" role="dialog" aria-modal="true" aria-labelledby="company-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="company-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add School / University" : "Edit School / University"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="School / University Name" htmlFor="company-name" required error={err("name")}>
            <input
              id="company-name"
              className={`field-input ${err("name") ? "input-error" : ""}`}
              value={values.name}
              onChange={handleChange("name")}
              placeholder="e.g. TechRive Pvt Ltd"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <div className="hr-form-grid">
            {mode === "edit" && (
              <FormField label="Status" htmlFor="company-status" error={err("status")}>
                <select
                  id="company-status"
                  className="field-input hr-select"
                  value={values.status}
                  onChange={handleChange("status")}
                  disabled={submitting}
                >
                  <option value={COMPANY_STATUS.ACTIVE}>Active</option>
                  <option value={COMPANY_STATUS.INACTIVE}>Inactive</option>
                </select>
              </FormField>
            )}

            <FormField label="Phone" htmlFor="company-phone" error={err("phone")}>
              <input
                id="company-phone"
                type="tel"
                className={`field-input ${err("phone") ? "input-error" : ""}`}
                value={values.phone}
                onChange={handleChange("phone")}
                placeholder="021-1234567"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Fax" htmlFor="company-fax" error={err("fax")}>
              <input
                id="company-fax"
                type="tel"
                className={`field-input ${err("fax") ? "input-error" : ""}`}
                value={values.fax}
                onChange={handleChange("fax")}
                placeholder="021-1234567"
                disabled={submitting}
              />
            </FormField>

            <FormField label="NTN" htmlFor="company-ntn" error={err("ntn")}>
              <input
                id="company-ntn"
                className={`field-input ${err("ntn") ? "input-error" : ""}`}
                value={values.ntn}
                onChange={handleChange("ntn")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="GST" htmlFor="company-gst" error={err("gst")}>
              <input
                id="company-gst"
                className={`field-input ${err("gst") ? "input-error" : ""}`}
                value={values.gst}
                onChange={handleChange("gst")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="GST Type" htmlFor="company-gst-type" error={err("gst_type")}>
              <input
                id="company-gst-type"
                className={`field-input ${err("gst_type") ? "input-error" : ""}`}
                value={values.gst_type}
                onChange={handleChange("gst_type")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="VAT" htmlFor="company-vat" error={err("vat")}>
              <input
                id="company-vat"
                className={`field-input ${err("vat") ? "input-error" : ""}`}
                value={values.vat}
                onChange={handleChange("vat")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Logo URL" htmlFor="company-logo" error={err("logo")}>
              <input
                id="company-logo"
                className={`field-input ${err("logo") ? "input-error" : ""}`}
                value={values.logo}
                onChange={handleChange("logo")}
                placeholder="https://…"
                disabled={submitting}
              />
            </FormField>
          </div>

          <FormField label="Description" htmlFor="company-description" error={err("description")}>
            <textarea
              id="company-description"
              className="field-input hr-textarea"
              value={values.description}
              onChange={handleChange("description")}
              placeholder="Optional"
              rows={2}
              disabled={submitting}
            />
          </FormField>

          <FormField label="Address" htmlFor="company-address" error={err("address")}>
            <textarea
              id="company-address"
              className="field-input hr-textarea"
              value={values.address}
              onChange={handleChange("address")}
              placeholder="Optional"
              rows={2}
              disabled={submitting}
            />
          </FormField>

          <div className="hr-modal-actions">
            <button
              type="button"
              className="hr-btn hr-btn-secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="spinner-wrap">
                  <span className="spinner" />
                  Saving…
                </span>
              ) : mode === "create" ? (
                "Create School / University"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyFormModal;
