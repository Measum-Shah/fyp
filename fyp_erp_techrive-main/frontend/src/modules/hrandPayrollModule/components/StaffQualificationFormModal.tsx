import React, { useState } from "react";
import FormField from "./FormField";
import { staffQualificationAPI, resolveAttachmentUrl } from "../services/staffQualification.service";
import { getApiErrorMessage } from "../services/employee.service";
import { isFormValid, validateStaffQualificationForm } from "../services/staffQualification.validation";
import { EMPTY_STAFF_QUALIFICATION_FORM_VALUES } from "../services/staffQualification.types";
import type { StaffQualificationFormValues } from "../services/staffQualification.types";

interface StaffQualificationFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  employeeName: string;
  initialValues?: StaffQualificationFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: StaffQualificationFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconPaperclip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const StaffQualificationFormModal: React.FC<StaffQualificationFormModalProps> = ({
  open, mode, employeeName, initialValues, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<StaffQualificationFormValues>(
    initialValues ?? EMPTY_STAFF_QUALIFICATION_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof StaffQualificationFormValues) => errors[field];

  const handleChange = (field: keyof StaffQualificationFormValues) => (
    e: React.ChangeEvent<HTMLInputElement>
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const res = await staffQualificationAPI.uploadAttachment(file);
      setValues((prev) => ({ ...prev, attachment: res.data.attachment }));
    } catch (err) {
      setUploadError(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => setValues((prev) => ({ ...prev, attachment: "" }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateStaffQualificationForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  const attachmentUrl = resolveAttachmentUrl(values.attachment);
  const attachmentFileName = values.attachment ? values.attachment.split("/").pop() : null;

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="staff-qual-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="staff-qual-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Qualification" : "Edit Qualification"}
        </h3>
        <p className="hr-field-hint" style={{ marginTop: "-0.75rem", marginBottom: "1rem" }}>
          For {employeeName}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Degree / Qualification" htmlFor="qual-degree" required error={err("degree")}>
              <input id="qual-degree" className={`field-input ${err("degree") ? "input-error" : ""}`} value={values.degree} onChange={handleChange("degree")} disabled={submitting} autoFocus />
            </FormField>

            <FormField label="Institute" htmlFor="qual-institute" error={err("institute")}>
              <input id="qual-institute" className="field-input" value={values.institute} onChange={handleChange("institute")} disabled={submitting} />
            </FormField>

            <FormField label="Board / University" htmlFor="qual-board" error={err("board_or_university")}>
              <input id="qual-board" className="field-input" value={values.board_or_university} onChange={handleChange("board_or_university")} disabled={submitting} />
            </FormField>

            <FormField label="Passing Year" htmlFor="qual-year" error={err("passing_year")}>
              <input id="qual-year" inputMode="numeric" className={`field-input ${err("passing_year") ? "input-error" : ""}`} value={values.passing_year} onChange={handleChange("passing_year")} disabled={submitting} />
            </FormField>

            <FormField label="Grade / CGPA" htmlFor="qual-grade" error={err("grade_or_cgpa")}>
              <input id="qual-grade" className="field-input" value={values.grade_or_cgpa} onChange={handleChange("grade_or_cgpa")} disabled={submitting} />
            </FormField>
          </div>

          <FormField label="Attachment" htmlFor="qual-attachment" hint="PDF, DOC, DOCX, JPG, PNG or WEBP — up to 5MB" error={uploadError ?? undefined}>
            <input id="qual-attachment" type="file" className="field-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} disabled={submitting || uploading} />
            {uploading && <p className="hr-field-hint">Uploading…</p>}
            {!uploading && attachmentFileName && (
              <p className="hr-field-hint">
                <IconPaperclip />{" "}
                {attachmentUrl ? (
                  <a href={attachmentUrl} target="_blank" rel="noreferrer">{attachmentFileName}</a>
                ) : (
                  attachmentFileName
                )}{" "}
                <button type="button" className="hr-btn-linklike" onClick={removeAttachment} disabled={submitting}>Remove</button>
              </p>
            )}
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting || uploading}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Add Qualification" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffQualificationFormModal;
