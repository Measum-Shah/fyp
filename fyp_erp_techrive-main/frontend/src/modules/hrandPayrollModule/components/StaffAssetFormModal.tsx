import React, { useState } from "react";
import FormField from "./FormField";
import { staffAssetAPI, resolveAttachmentUrl } from "../services/staffAsset.service";
import { getApiErrorMessage } from "../services/employee.service";
import { isFormValid, validateStaffAssetForm } from "../services/staffAsset.validation";
import {
  EMPTY_STAFF_ASSET_FORM_VALUES,
  STAFF_ASSET_CONDITION_SUGGESTIONS,
  STAFF_ASSET_TYPE_SUGGESTIONS,
} from "../services/staffAsset.types";
import type { StaffAssetFormValues } from "../services/staffAsset.types";

interface StaffAssetFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  employeeName: string;
  initialValues?: StaffAssetFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: StaffAssetFormValues) => void;
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

const StaffAssetFormModal: React.FC<StaffAssetFormModalProps> = ({
  open, mode, employeeName, initialValues, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [values, setValues] = useState<StaffAssetFormValues>(
    initialValues ?? EMPTY_STAFF_ASSET_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof StaffAssetFormValues) => errors[field];

  const handleChange = (field: keyof StaffAssetFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
      const res = await staffAssetAPI.uploadAttachment(file);
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
    const validationErrors = validateStaffAssetForm(values);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) onSubmit(values);
  };

  const attachmentUrl = resolveAttachmentUrl(values.attachment);
  const attachmentFileName = values.attachment ? values.attachment.split("/").pop() : null;

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form hr-modal-form-wide" role="dialog" aria-modal="true" aria-labelledby="staff-asset-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="staff-asset-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Add Asset" : "Edit Asset"}
        </h3>
        <p className="hr-field-hint" style={{ marginTop: "-0.75rem", marginBottom: "1rem" }}>
          For {employeeName}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Asset Name" htmlFor="asset-name" required error={err("asset_name")}>
              <input id="asset-name" className={`field-input ${err("asset_name") ? "input-error" : ""}`} value={values.asset_name} onChange={handleChange("asset_name")} disabled={submitting} autoFocus />
            </FormField>

            <FormField label="Asset Type" htmlFor="asset-type" error={err("asset_type")}>
              <input id="asset-type" list="asset-type-suggestions" className="field-input" value={values.asset_type} onChange={handleChange("asset_type")} disabled={submitting} />
              <datalist id="asset-type-suggestions">
                {STAFF_ASSET_TYPE_SUGGESTIONS.map((t) => <option key={t} value={t} />)}
              </datalist>
            </FormField>

            <FormField label="Serial Number" htmlFor="asset-serial" error={err("serial_number")}>
              <input id="asset-serial" className="field-input" value={values.serial_number} onChange={handleChange("serial_number")} disabled={submitting} />
            </FormField>

            <FormField label="Asset Code" htmlFor="asset-code" error={err("asset_code")}>
              <input id="asset-code" className="field-input" value={values.asset_code} onChange={handleChange("asset_code")} disabled={submitting} />
            </FormField>

            <FormField label="Issue Date" htmlFor="asset-issue-date" error={err("issue_date")}>
              <input id="asset-issue-date" type="date" className={`field-input ${err("issue_date") ? "input-error" : ""}`} value={values.issue_date} onChange={handleChange("issue_date")} disabled={submitting} />
            </FormField>

            <FormField label="Return Date" htmlFor="asset-return-date" error={err("return_date")}>
              <input id="asset-return-date" type="date" className={`field-input ${err("return_date") ? "input-error" : ""}`} value={values.return_date} onChange={handleChange("return_date")} disabled={submitting} />
            </FormField>

            <FormField label="Condition" htmlFor="asset-condition" error={err("condition")}>
              <input id="asset-condition" list="asset-condition-suggestions" className="field-input" value={values.condition} onChange={handleChange("condition")} disabled={submitting} />
              <datalist id="asset-condition-suggestions">
                {STAFF_ASSET_CONDITION_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </FormField>
          </div>

          <FormField label="Remarks" htmlFor="asset-remarks" error={err("remarks")}>
            <textarea id="asset-remarks" className="field-input" rows={2} value={values.remarks} onChange={handleChange("remarks")} disabled={submitting} />
          </FormField>

          <FormField label="Attachment" htmlFor="asset-attachment" hint="PDF, DOC, DOCX, JPG, PNG or WEBP — up to 5MB" error={uploadError ?? undefined}>
            <input id="asset-attachment" type="file" className="field-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} disabled={submitting || uploading} />
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
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : mode === "create" ? "Add Asset" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffAssetFormModal;
