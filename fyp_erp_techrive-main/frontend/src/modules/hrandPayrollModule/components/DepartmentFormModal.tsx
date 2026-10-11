import React, { useState, useEffect } from "react";
import { companyAPI } from "../services/company.service";
import { branchAPI } from "../services/branch.service";
import type { Company } from "../services/company.types";
import type { Branch } from "../services/branch.types";
import FormField from "./FormField";
import {
  isFormValid,
  validateDepartmentForm,
} from "../services/department.validation";
import { EMPTY_DEPARTMENT_FORM_VALUES } from "../services/department.types";
import type { DepartmentFormValues } from "../services/department.types";

interface DepartmentFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: DepartmentFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: DepartmentFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// A single modal handles both Add and Edit (mode prop), rather than separate
// routed pages — Department only has 2 editable fields, so a full page-per-
// action pattern (as used for the much larger Employee entity) would be
// unnecessary ceremony here. See the Phase 2 planning discussion for the
// reasoning.
//
// NOTE: like EmployeeForm, `initialValues` is only read once via the
// useState initializer — DepartmentsPage always has the full Department
// object already in memory (from the list) before opening this modal in
// edit mode, so there's no async-loading/re-sync concern to handle here.
const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<DepartmentFormValues>(
    initialValues ?? EMPTY_DEPARTMENT_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (open) {
      companyAPI.list({ limit: 100 }).then(res => setCompanies(res.data)).catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (values.company_id) {
      branchAPI.list({ limit: 100, company_id: Number(values.company_id) } as any)
        .then(res => setBranches(res.data))
        .catch(console.error);
    } else {
      setBranches([]);
    }
  }, [values.company_id]);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof DepartmentFormValues) => errors[field];

  const handleChange = (
    field: keyof DepartmentFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const nextValue = e.target.value;
    setValues((prev) => ({
      ...prev,
      [field]: nextValue,
      // A campus from the old school is no longer valid/visible — clear it.
      ...(field === "company_id" ? { branch_id: "" } : {}),
    }));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateDepartmentForm(values);
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
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="department-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="department-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Department" : "Edit Department"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="School" htmlFor="dept-company" required error={err("company_id")}>
            <select
              id="dept-company"
              className={`field-input ${err("company_id") ? "input-error" : ""}`}
              value={values.company_id}
              onChange={handleChange("company_id")}
              disabled={submitting || mode === "edit"}
            >
              <option value="">Select School</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Campus" htmlFor="dept-branch" required error={err("branch_id")}>
            <select
              id="dept-branch"
              className={`field-input ${err("branch_id") ? "input-error" : ""}`}
              value={values.branch_id}
              onChange={handleChange("branch_id")}
              disabled={submitting || mode === "edit" || !values.company_id}
            >
              <option value="">Select Campus</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Department Name" htmlFor="dept-name" required error={err("name")}>
            <input
              id="dept-name"
              className={`field-input ${err("name") ? "input-error" : ""}`}
              value={values.name}
              onChange={handleChange("name")}
              placeholder="e.g. Engineering"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <FormField label="Description" htmlFor="dept-description" error={err("description")}>
            <textarea
              id="dept-description"
              className="field-input hr-textarea"
              value={values.description}
              onChange={handleChange("description")}
              placeholder="Optional short description"
              rows={3}
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
                "Create Department"
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

export default DepartmentFormModal;