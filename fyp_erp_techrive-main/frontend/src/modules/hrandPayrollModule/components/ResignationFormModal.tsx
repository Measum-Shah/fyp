import React, { useState } from "react";
import FormField from "./FormField";
import { isFormValid, validateResignationForm } from "../services/resignation.validation";
import { EMPTY_RESIGNATION_FORM_VALUES } from "../services/resignation.types";
import type { ResignationFormValues } from "../services/resignation.types";
import { resignationAPI, resolveExperienceLetterUrl } from "../services/resignation.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { LookupOption } from "../services/employee.types";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";

interface ResignationFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: ResignationFormValues;
  staff: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: ResignationFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ResignationFormModal: React.FC<ResignationFormModalProps> = ({
  open, mode, initialValues, staff, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<ResignationFormValues>(initialValues ?? EMPTY_RESIGNATION_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Company → Branch cascade (see the Company→Branch scoping task). Edit
  // mode has no stored company_id to prefill, so default to the legacy
  // full list (undefined) rather than empty/gated.
  const [companyId, setCompanyId] = useState<number | null | undefined>(
    mode === "edit" ? undefined : null
  );
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof ResignationFormValues) => errors[field];

  const handleChange = (field: keyof ResignationFormValues) => (
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

  // Real click-to-upload for the Experience Letter — mirrors
  // StaffQualificationFormModal.tsx's attachment upload. The <input
  // type="file"> itself never sends the file to the server on save; it
  // uploads immediately on selection and the resulting public path is what
  // gets stored on the resignation record.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const res = await resignationAPI.uploadExperienceLetter(file);
      setValues((prev) => ({ ...prev, experience_letter: res.data.experience_letter }));
      setClientErrors((prev) => {
        if (!("experience_letter" in prev)) return prev;
        const next = { ...prev };
        delete next.experience_letter;
        return next;
      });
    } catch (uploadErr) {
      setUploadError(getApiErrorMessage(uploadErr));
    } finally {
      setUploading(false);
    }
  };

  const removeExperienceLetter = () => setValues((prev) => ({ ...prev, experience_letter: "" }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateResignationForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  const experienceLetterUrl = resolveExperienceLetterUrl(values.experience_letter);
  const experienceLetterFileName = values.experience_letter ? values.experience_letter.split("/").pop() : null;

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="resign-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="resign-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "New Resignation" : "Edit Resignation"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Employee" htmlFor="res-staff" required error={err("staff_id")}>
              <select id="res-staff" className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`} value={values.staff_id} onChange={handleChange("staff_id")} disabled={submitting || mode === "edit"}>
                <option value="">Select employee…</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>

            <FormField label="School / University" htmlFor="res-company">
              <select id="res-company" className="field-input hr-select" value={companyId ?? ""} onChange={(e) => {
                setCompanyId(e.target.value ? Number(e.target.value) : null);
                // A branch from the old company is no longer valid/visible — clear it.
                setValues((prev) => ({ ...prev, branch_id: "" }));
              }} disabled={submitting}>
                <option value="">Select school / university…</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>

            <FormField label="Campus" htmlFor="res-branch" required error={err("branch_id")}>
              <select id="res-branch" className={`field-input hr-select ${err("branch_id") ? "input-error" : ""}`} value={values.branch_id} onChange={handleChange("branch_id")} disabled={submitting || companyId === null}>
                <option value="">{companyId === null ? "Select a school / university first…" : "Select campus…"}</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FormField>

            <FormField label="Role ID" htmlFor="res-role" required error={err("role_id")}>
              <input id="res-role" inputMode="numeric" className={`field-input ${err("role_id") ? "input-error" : ""}`} value={values.role_id} onChange={handleChange("role_id")} disabled={submitting} />
            </FormField>

            <FormField label="Notice Period" htmlFor="res-notice" required error={err("notice_period")}>
              <input id="res-notice" className={`field-input ${err("notice_period") ? "input-error" : ""}`} value={values.notice_period} onChange={handleChange("notice_period")} placeholder="e.g. 30 days" disabled={submitting} />
            </FormField>

            <FormField label="Last Day of Work" htmlFor="res-last-day" required error={err("last_day_of_work")}>
              <input id="res-last-day" type="date" className={`field-input ${err("last_day_of_work") ? "input-error" : ""}`} value={values.last_day_of_work} onChange={handleChange("last_day_of_work")} disabled={submitting} />
            </FormField>

            <FormField label="Join Date" htmlFor="res-join-date" error={err("join_date")}>
              <input id="res-join-date" type="date" className={`field-input ${err("join_date") ? "input-error" : ""}`} value={values.join_date} onChange={handleChange("join_date")} disabled={submitting} />
            </FormField>

            <FormField label="Class (if teaching staff)" htmlFor="res-class" error={err("class")}>
              <input id="res-class" className="field-input" value={values.class} onChange={handleChange("class")} placeholder="Optional" disabled={submitting} />
            </FormField>

            <FormField label="Subject (if teaching staff)" htmlFor="res-subject" error={err("subject")}>
              <input id="res-subject" className="field-input" value={values.subject} onChange={handleChange("subject")} placeholder="Optional" disabled={submitting} />
            </FormField>
          </div>

          <FormField label="Reason" htmlFor="res-reason" required error={err("reason")}>
            <textarea id="res-reason" className={`field-input hr-textarea ${err("reason") ? "input-error" : ""}`} value={values.reason} onChange={handleChange("reason")} rows={3} disabled={submitting} />
          </FormField>

          <FormField
            label="Experience Letter"
            htmlFor="res-letter"
            error={err("experience_letter") ?? (uploadError ?? undefined)}
            hint="PDF, DOC, DOCX, JPG, JPEG or PNG — up to 5MB"
          >
            <input
              id="res-letter"
              type="file"
              className="field-input"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={submitting || uploading}
            />
            {uploading && <p className="hr-field-hint">Uploading…</p>}
            {!uploading && experienceLetterFileName && (
              <p className="hr-field-hint">
                Selected:{" "}
                {experienceLetterUrl ? (
                  <a href={experienceLetterUrl} target="_blank" rel="noreferrer">
                    {experienceLetterFileName}
                  </a>
                ) : (
                  experienceLetterFileName
                )}
                {" — "}
                <button type="button" className="hr-btn-linklike" onClick={removeExperienceLetter} disabled={submitting}>
                  Remove
                </button>
              </p>
            )}
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting || uploading}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Submit Resignation" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResignationFormModal;
