import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateBranchTransferForm } from "../services/branchTransfer.validation";
import { EMPTY_BRANCH_TRANSFER_FORM_VALUES } from "../services/branchTransfer.types";
import type { BranchTransferFormValues } from "../services/branchTransfer.types";
import type { LookupOption } from "../services/employee.types";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";

interface BranchTransferFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: BranchTransferFormValues;
  staff: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: BranchTransferFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Origin branch (from_branch) isn't asked for here — the backend fills it in
// automatically from the employee's current branch (see
// branchTransfer.service.ts), which is more reliable than manual entry.
const BranchTransferFormModal: React.FC<BranchTransferFormModalProps> = ({
  open, mode, initialValues, staff, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<BranchTransferFormValues>(initialValues ?? EMPTY_BRANCH_TRANSFER_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  // Company → Branch cascade for the destination branch (see the
  // Company→Branch scoping task). Edit mode has no stored company_id to
  // prefill, so default to the legacy full list (undefined).
  const [companyId, setCompanyId] = useState<number | null | undefined>(
    mode === "edit" ? undefined : null
  );
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof BranchTransferFormValues) => errors[field];

  const handleChange = (field: keyof BranchTransferFormValues) => (
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
    const validationErrors = validateBranchTransferForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="transfer-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "New Campus Transfer" : "Edit Campus Transfer"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Employee" htmlFor="tr-staff" required error={err("staff_id")}>
              <select id="tr-staff" className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`} value={values.staff_id} onChange={handleChange("staff_id")} disabled={submitting || mode === "edit"}>
                <option value="">Select employee…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>

            <FormField label="School / University" htmlFor="tr-company">
              <select id="tr-company" className="field-input hr-select" value={companyId ?? ""} onChange={(e) => {
                setCompanyId(e.target.value ? Number(e.target.value) : null);
                // A branch from the old company is no longer valid/visible — clear it.
                setValues((prev) => ({ ...prev, to_branch: "" }));
              }} disabled={submitting}>
                <option value="">Select school / university…</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>

            <FormField label="Destination Campus" htmlFor="tr-branch" required error={err("to_branch")}>
              <select id="tr-branch" className={`field-input hr-select ${err("to_branch") ? "input-error" : ""}`} value={values.to_branch} onChange={handleChange("to_branch")} disabled={submitting || companyId === null}>
                <option value="">{companyId === null ? "Select a school / university first…" : "Select campus…"}</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FormField>

            <FormField label="Date" htmlFor="tr-date" required error={err("date")}>
              <input id="tr-date" type="date" className={`field-input ${err("date") ? "input-error" : ""}`} value={values.date} onChange={handleChange("date")} disabled={submitting} />
            </FormField>
          </div>

          <FormField label="Reason" htmlFor="tr-reason" required error={err("reason")}>
            <textarea id="tr-reason" className={`field-input hr-textarea ${err("reason") ? "input-error" : ""}`} value={values.reason} onChange={handleChange("reason")} rows={3} disabled={submitting} />
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Submit Request" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchTransferFormModal;
