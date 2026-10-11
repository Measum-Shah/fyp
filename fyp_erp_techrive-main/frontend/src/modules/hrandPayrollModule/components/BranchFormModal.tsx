import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateBranchForm } from "../services/branch.validation";
import { EMPTY_BRANCH_FORM_VALUES, BRANCH_STATUS } from "../services/branch.types";
import type { BranchFormValues } from "../services/branch.types";
import type { LookupOption } from "../services/employee.types";

interface BranchFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: BranchFormValues;
  companies: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: BranchFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Branch now covers every real (non-legacy) column on erp_branches — 23
// editable fields — so the form is broken into labeled sections rather than
// one long .hr-form-grid, to keep it scannable. Sections: Basic Info,
// Location & Reference IDs (no lookup tables exist for these in the schema,
// so they're plain numeric ids — see branch.constants.ts), Network/Logo, and
// Exam & Billing (school/exam-board-specific columns, kept visually distinct
// since they won't apply to every branch).
const BranchFormModal: React.FC<BranchFormModalProps> = ({
  open,
  mode,
  initialValues,
  companies,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<BranchFormValues>(
    initialValues ?? EMPTY_BRANCH_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof BranchFormValues) => errors[field];

  const handleChange = (
    field: keyof BranchFormValues
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
    const validationErrors = validateBranchForm(values);
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
      <div className="hr-modal hr-modal-form hr-modal-form-wide" role="dialog" aria-modal="true" aria-labelledby="branch-modal-title">
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="branch-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Campus" : "Edit Campus"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Campus Name" htmlFor="branch-name" required error={err("name")}>
            <input
              id="branch-name"
              className={`field-input ${err("name") ? "input-error" : ""}`}
              value={values.name}
              onChange={handleChange("name")}
              placeholder="e.g. Main Campus"
              disabled={submitting}
              autoFocus
            />
          </FormField>

          <div className="hr-form-grid">
            <FormField label="School / University" htmlFor="branch-company" required error={err("company_id")}>
              <select
                id="branch-company"
                className={`field-input hr-select ${err("company_id") ? "input-error" : ""}`}
                value={values.company_id}
                onChange={handleChange("company_id")}
                disabled={submitting}
              >
                <option value="">Select school / university…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            {mode === "edit" && (
              <FormField label="Status" htmlFor="branch-status" error={err("status")}>
                <select
                  id="branch-status"
                  className="field-input hr-select"
                  value={values.status}
                  onChange={handleChange("status")}
                  disabled={submitting}
                >
                  <option value={BRANCH_STATUS.ACTIVE}>Active</option>
                  <option value={BRANCH_STATUS.INACTIVE}>Inactive</option>
                </select>
              </FormField>
            )}

            <FormField label="Campus Code" htmlFor="branch-code" error={err("branch_code")}>
              <input
                id="branch-code"
                className={`field-input ${err("branch_code") ? "input-error" : ""}`}
                value={values.branch_code}
                onChange={handleChange("branch_code")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Short Name" htmlFor="branch-short-name" error={err("short_name")}>
              <input
                id="branch-short-name"
                className={`field-input ${err("short_name") ? "input-error" : ""}`}
                value={values.short_name}
                onChange={handleChange("short_name")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Phone" htmlFor="branch-phone" required error={err("phone")}>
              <input
                id="branch-phone"
                type="tel"
                className={`field-input ${err("phone") ? "input-error" : ""}`}
                value={values.phone}
                onChange={handleChange("phone")}
                placeholder="021-1234567"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Mobile / Cell" htmlFor="branch-cell" required error={err("cell")}>
              <input
                id="branch-cell"
                type="tel"
                className={`field-input ${err("cell") ? "input-error" : ""}`}
                value={values.cell}
                onChange={handleChange("cell")}
                placeholder="0300-1234567"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Fax" htmlFor="branch-fax" error={err("fax")}>
              <input
                id="branch-fax"
                inputMode="numeric"
                className={`field-input ${err("fax") ? "input-error" : ""}`}
                value={values.fax}
                onChange={handleChange("fax")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Email" htmlFor="branch-email" required error={err("email")}>
              <input
                id="branch-email"
                type="email"
                className={`field-input ${err("email") ? "input-error" : ""}`}
                value={values.email}
                onChange={handleChange("email")}
                placeholder="campus@techrive.com"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Website" htmlFor="branch-website" error={err("website")}>
              <input
                id="branch-website"
                className={`field-input ${err("website") ? "input-error" : ""}`}
                value={values.website}
                onChange={handleChange("website")}
                placeholder="https://…"
                disabled={submitting}
              />
            </FormField>
          </div>

          <FormField label="Address" htmlFor="branch-address" error={err("address")}>
            <textarea
              id="branch-address"
              className="field-input hr-textarea"
              value={values.address}
              onChange={handleChange("address")}
              placeholder="Optional"
              rows={2}
              disabled={submitting}
            />
          </FormField>

          {/* ── Location & Reference IDs ─────────────────────────────────
              No cities/countries/banks/voucher table exists anywhere in the
              SQL export, so these are plain numeric ids, not dropdowns. */}
          <h4 className="hr-form-section-title">Location &amp; Reference IDs</h4>
          <p className="hr-field-hint">
            Enter the numeric id directly.
          </p>
          <div className="hr-form-grid">
            <FormField label="City ID" htmlFor="branch-city-id" error={err("city_id")}>
              <input
                id="branch-city-id"
                inputMode="numeric"
                className={`field-input ${err("city_id") ? "input-error" : ""}`}
                value={values.city_id}
                onChange={handleChange("city_id")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Country ID" htmlFor="branch-country-id" error={err("country_id")}>
              <input
                id="branch-country-id"
                inputMode="numeric"
                className={`field-input ${err("country_id") ? "input-error" : ""}`}
                value={values.country_id}
                onChange={handleChange("country_id")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Bank ID" htmlFor="branch-bank-id" error={err("bank_id")}>
              <input
                id="branch-bank-id"
                inputMode="numeric"
                className={`field-input ${err("bank_id") ? "input-error" : ""}`}
                value={values.bank_id}
                onChange={handleChange("bank_id")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Other Bank ID" htmlFor="branch-other-bank" error={err("other_bank")}>
              <input
                id="branch-other-bank"
                inputMode="numeric"
                className={`field-input ${err("other_bank") ? "input-error" : ""}`}
                value={values.other_bank}
                onChange={handleChange("other_bank")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Voucher ID" htmlFor="branch-voucher-id" error={err("voucher_id")}>
              <input
                id="branch-voucher-id"
                inputMode="numeric"
                className={`field-input ${err("voucher_id") ? "input-error" : ""}`}
                value={values.voucher_id}
                onChange={handleChange("voucher_id")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>
          </div>

          {/* ── Network & Logo ──────────────────────────────────────────── */}
          <h4 className="hr-form-section-title">Network &amp; Logo</h4>
          <div className="hr-form-grid">
            <FormField label="Logo URL" htmlFor="branch-logo" error={err("logo")}>
              <input
                id="branch-logo"
                className={`field-input ${err("logo") ? "input-error" : ""}`}
                value={values.logo}
                onChange={handleChange("logo")}
                placeholder="https://…"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Device IP" htmlFor="branch-ip" error={err("ip")}>
              <input
                id="branch-ip"
                className={`field-input ${err("ip") ? "input-error" : ""}`}
                value={values.ip}
                onChange={handleChange("ip")}
                placeholder="e.g. 192.168.1.10"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Device Port" htmlFor="branch-port" error={err("port")}>
              <input
                id="branch-port"
                className={`field-input ${err("port") ? "input-error" : ""}`}
                value={values.port}
                onChange={handleChange("port")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>
          </div>

          {/* ── Exam & Billing (school/exam-board-specific) ─────────────── */}
          <h4 className="hr-form-section-title">Exam &amp; Billing</h4>
          <p className="hr-field-hint">
            Leave blank if not applicable.
          </p>
          <div className="hr-form-grid">
            <FormField label="Cambridge Account" htmlFor="branch-cambridge-acc" error={err("cambridge_acc")}>
              <input
                id="branch-cambridge-acc"
                className={`field-input ${err("cambridge_acc") ? "input-error" : ""}`}
                value={values.cambridge_acc}
                onChange={handleChange("cambridge_acc")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Optional Account" htmlFor="branch-optional-acc" error={err("optional_acc")}>
              <input
                id="branch-optional-acc"
                className={`field-input ${err("optional_acc") ? "input-error" : ""}`}
                value={values.optional_acc}
                onChange={handleChange("optional_acc")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="One Bill Prefix" htmlFor="branch-one-bill-prefix" error={err("one_bill_prefix")}>
              <input
                id="branch-one-bill-prefix"
                className={`field-input ${err("one_bill_prefix") ? "input-error" : ""}`}
                value={values.one_bill_prefix}
                onChange={handleChange("one_bill_prefix")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>

            <FormField label="Exam Center No." htmlFor="branch-exam-center-no" error={err("exam_center_no")}>
              <input
                id="branch-exam-center-no"
                className={`field-input ${err("exam_center_no") ? "input-error" : ""}`}
                value={values.exam_center_no}
                onChange={handleChange("exam_center_no")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>
          </div>

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
                "Create Campus"
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

export default BranchFormModal;
