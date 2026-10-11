import React, { useState } from "react";
import FormField from "./FormField";
import { useLeaveRequestLookups } from "../hooks/useLeaveRequestLookups";
import { leaveRequestAPI, resolveAttachmentUrl } from "../services/leaveRequest.service";
import { getApiErrorMessage } from "../services/employee.service";
import {
  calculateTotalDays,
  isFormValid,
  validateLeaveRequestForm,
} from "../services/leaveRequest.validation";
import {
  EMPTY_LEAVE_REQUEST_FORM_VALUES,
  LEAVE_REQUEST_SINGLE_DURATION_OPTIONS,
  LEAVE_REQUEST_STATUS,
} from "../services/leaveRequest.types";
import type { LeaveRequestFormValues } from "../services/leaveRequest.types";
import { useCompanyLookup } from "../hooks/useCompanyLookup";

interface LeaveRequestFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: LeaveRequestFormValues;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: LeaveRequestFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconPaperclip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

// erp_hrm_leave_requests.leave_status is a free-standing FK into the
// admin-managed erp_hrm_leave_statuses table (no fixed PENDING id — see
// leaveRequest.constants.ts), so on Apply for Leave (create mode, where the
// field is no longer shown) the best default is whichever lookup row is
// literally named "Pending"; falling back to the first status if none is
// named that, so a request can always be submitted as long as at least one
// leave status exists.
const pickDefaultLeaveStatusId = (statuses: { id: number; name: string }[]): string => {
  if (statuses.length === 0) return "";
  const pending = statuses.find((s) => s.name.trim().toLowerCase() === "pending");
  return String((pending ?? statuses[0]).id);
};

const LeaveRequestFormModal: React.FC<LeaveRequestFormModalProps> = ({
  open,
  mode,
  initialValues,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<LeaveRequestFormValues>(
    initialValues ?? EMPTY_LEAVE_REQUEST_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Company → Branch cascade (see the Company→Branch scoping task). The
  // record itself only stores branch_id, so companyId is local UI-only
  // state. Edit mode has no stored company_id to prefill, so default to
  // the legacy full list (undefined) rather than empty/gated.
  const [companyId, setCompanyId] = useState<number | null | undefined>(
    mode === "edit" ? undefined : null
  );
  const { companies } = useCompanyLookup();
  const { employees, leaveTypes, leaveStatuses, branches, loading: lookupsLoading } =
    useLeaveRequestLookups(companyId);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanyId(e.target.value ? Number(e.target.value) : null);
    // A branch from the old company is no longer valid/visible — clear it.
    setValues((prev) => ({ ...prev, branch_id: "" }));
  };

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof LeaveRequestFormValues) => errors[field];

  const totalDays = calculateTotalDays(values.start_date, values.end_date);
  const isSingleDay = totalDays === 1;

  const handleChange = (
    field: keyof LeaveRequestFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const nextValue = field === "status" ? Number(e.target.value) : e.target.value;
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
      const res = await leaveRequestAPI.uploadAttachment(file);
      setValues((prev) => ({ ...prev, attachment: res.data.attachment }));
    } catch (uploadErr) {
      setUploadError(getApiErrorMessage(uploadErr));
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => setValues((prev) => ({ ...prev, attachment: "" }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Apply for Leave no longer shows a Leave Status field — inject the
    // default ("Pending", or the first available status) right before
    // validating/submitting so the record still gets its required internal
    // status, without needing to setState from an effect.
    const valuesToSubmit =
      mode === "create" && !values.leave_status
        ? { ...values, leave_status: pickDefaultLeaveStatusId(leaveStatuses) }
        : values;

    const validationErrors = validateLeaveRequestForm(valuesToSubmit);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) {
      onSubmit(valuesToSubmit);
    }
  };

  const attachmentUrl = resolveAttachmentUrl(values.attachment);
  const attachmentFileName = values.attachment ? values.attachment.split("/").pop() : null;

  return (
    <div
      className="hr-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div
        className="hr-modal hr-modal-form hr-modal-form-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-request-modal-title"
      >
        <button
          type="button"
          className="hr-modal-close"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Close"
        >
          <IconClose />
        </button>

        <h3 id="leave-request-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Apply for Leave" : "Edit Leave Request"}
        </h3>

        {mode === "create" && !lookupsLoading && leaveStatuses.length === 0 && (
          <p className="hr-field-error" role="alert">
            No leave statuses exist yet — ask an admin to create one under Leave Statuses before
            applying for leave.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="hr-form-grid">
            <FormField label="Employee" htmlFor="lr-employee" required error={err("employee_id")}>
              <select
                id="lr-employee"
                className={`field-input hr-select ${err("employee_id") ? "input-error" : ""}`}
                value={values.employee_id}
                onChange={handleChange("employee_id")}
                disabled={submitting || lookupsLoading}
              >
                <option value="">Select employee…</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                    {employee.reg_no ? ` (${employee.reg_no})` : ""}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Leave Type" htmlFor="lr-leave-type" required error={err("leave_type_id")}>
              <select
                id="lr-leave-type"
                className={`field-input hr-select ${err("leave_type_id") ? "input-error" : ""}`}
                value={values.leave_type_id}
                onChange={handleChange("leave_type_id")}
                disabled={submitting || lookupsLoading}
              >
                <option value="">Select leave type…</option>
                {leaveTypes.map((leaveType) => (
                  <option key={leaveType.id} value={leaveType.id}>
                    {leaveType.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="School / University" htmlFor="lr-company">
              <select
                id="lr-company"
                className="field-input hr-select"
                value={companyId ?? ""}
                onChange={handleCompanyChange}
                disabled={submitting}
              >
                <option value="">Select school / university…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Campus" htmlFor="lr-branch" required error={err("branch_id")}>
              <select
                id="lr-branch"
                className={`field-input hr-select ${err("branch_id") ? "input-error" : ""}`}
                value={values.branch_id}
                onChange={handleChange("branch_id")}
                disabled={submitting || lookupsLoading || companyId === null}
              >
                <option value="">{companyId === null ? "Select a school / university first…" : "Select campus…"}</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </FormField>

            {mode === "edit" && (
              <FormField
                label="Leave Status"
                htmlFor="lr-leave-status"
                required
                error={err("leave_status")}
                hint={
                  leaveStatuses.length === 0 && !lookupsLoading
                    ? "No leave statuses exist yet — create one under Leave Statuses first"
                    : undefined
                }
              >
                <select
                  id="lr-leave-status"
                  className={`field-input hr-select ${err("leave_status") ? "input-error" : ""}`}
                  value={values.leave_status}
                  onChange={handleChange("leave_status")}
                  disabled={submitting || lookupsLoading}
                >
                  <option value="">Select status…</option>
                  {leaveStatuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </div>

          <div className="hr-form-grid">
            <FormField label="Start Date" htmlFor="lr-start-date" required error={err("start_date")}>
              <input
                id="lr-start-date"
                type="date"
                className={`field-input ${err("start_date") ? "input-error" : ""}`}
                value={values.start_date}
                onChange={handleChange("start_date")}
                disabled={submitting}
              />
            </FormField>

            <FormField label="End Date" htmlFor="lr-end-date" required error={err("end_date")}>
              <input
                id="lr-end-date"
                type="date"
                className={`field-input ${err("end_date") ? "input-error" : ""}`}
                value={values.end_date}
                onChange={handleChange("end_date")}
                disabled={submitting}
              />
            </FormField>
          </div>

          <div className="hr-form-grid">
            <FormField label="Total Days" htmlFor="lr-total-days">
              <input
                id="lr-total-days"
                className="field-input"
                value={totalDays > 0 ? totalDays : "—"}
                disabled
                readOnly
              />
            </FormField>

            <FormField label="Applied Date" htmlFor="lr-applied-date" required error={err("applied_date")}>
              <input
                id="lr-applied-date"
                type="date"
                className={`field-input ${err("applied_date") ? "input-error" : ""}`}
                value={values.applied_date}
                onChange={handleChange("applied_date")}
                disabled={submitting}
              />
            </FormField>
          </div>

          {isSingleDay && (
            <>
              <h3 className="hr-form-section-title">Single-Day Options</h3>
              <div className="hr-form-grid">
                <FormField label="Duration" htmlFor="lr-single-duration" hint="Optional — leave unset for a full day">
                  <select
                    id="lr-single-duration"
                    className="field-input hr-select"
                    value={values.single_duration}
                    onChange={handleChange("single_duration")}
                    disabled={submitting}
                  >
                    <option value="">Full Day (default)</option>
                    {LEAVE_REQUEST_SINGLE_DURATION_OPTIONS.filter((o) => o !== "Full Day").map(
                      (option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                <FormField label="Shift" htmlFor="lr-single-shift" hint="Optional, e.g. Morning">
                  <input
                    id="lr-single-shift"
                    className="field-input"
                    value={values.single_shift}
                    onChange={handleChange("single_shift")}
                    disabled={submitting}
                  />
                </FormField>
              </div>

              {values.single_duration === "Hourly" && (
                <div className="hr-form-grid">
                  <FormField
                    label="Start Time"
                    htmlFor="lr-single-hours-start"
                    required
                    error={err("single_hours_start")}
                  >
                    <input
                      id="lr-single-hours-start"
                      type="time"
                      className={`field-input ${err("single_hours_start") ? "input-error" : ""}`}
                      value={values.single_hours_start}
                      onChange={handleChange("single_hours_start")}
                      disabled={submitting}
                    />
                  </FormField>

                  <FormField
                    label="End Time"
                    htmlFor="lr-single-hours-end"
                    required
                    error={err("single_hours_end")}
                  >
                    <input
                      id="lr-single-hours-end"
                      type="time"
                      className={`field-input ${err("single_hours_end") ? "input-error" : ""}`}
                      value={values.single_hours_end}
                      onChange={handleChange("single_hours_end")}
                      disabled={submitting}
                    />
                  </FormField>
                </div>
              )}
            </>
          )}

          <FormField label="Comments" htmlFor="lr-comments" hint="Employee's reason for the leave" error={err("comments")}>
            <textarea
              id="lr-comments"
              className="field-input hr-textarea"
              value={values.comments}
              onChange={handleChange("comments")}
              rows={2}
              disabled={submitting}
            />
          </FormField>

          {mode === "edit" && (
            <FormField label="Remarks" htmlFor="lr-remarks" hint="Reviewer's notes" error={err("remarks")}>
              <textarea
                id="lr-remarks"
                className="field-input hr-textarea"
                value={values.remarks}
                onChange={handleChange("remarks")}
                rows={2}
                disabled={submitting}
              />
            </FormField>
          )}

          <FormField
            label="Attachment"
            htmlFor="lr-attachment"
            hint="PDF, DOC, DOCX, JPG, PNG or WEBP — up to 5MB"
            error={uploadError ?? err("attachment")}
          >
            <input
              id="lr-attachment"
              type="file"
              className="field-input"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={submitting || uploading}
            />
            {uploading && <p className="hr-field-hint">Uploading…</p>}
            {!uploading && attachmentFileName && (
              <p className="hr-field-hint">
                <IconPaperclip />{" "}
                {attachmentUrl ? (
                  <a href={attachmentUrl} target="_blank" rel="noreferrer">{attachmentFileName}</a>
                ) : (
                  attachmentFileName
                )}{" "}
                <button type="button" className="hr-btn-linklike" onClick={removeAttachment} disabled={submitting}>
                  Remove
                </button>
              </p>
            )}
          </FormField>

          {mode === "edit" && (
            <FormField label="Record Status" htmlFor="lr-status">
              <select
                id="lr-status"
                className="field-input hr-select"
                value={values.status}
                onChange={handleChange("status")}
                disabled={submitting}
              >
                <option value={LEAVE_REQUEST_STATUS.ACTIVE}>Active</option>
                <option value={LEAVE_REQUEST_STATUS.INACTIVE}>Inactive</option>
              </select>
            </FormField>
          )}

          <div className="hr-modal-actions">
            <button
              type="button"
              className="hr-btn hr-btn-secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting || uploading}>
              {submitting ? (
                <span className="spinner-wrap">
                  <span className="spinner" />
                  Saving…
                </span>
              ) : mode === "create" ? (
                "Submit Leave Request"
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

export default LeaveRequestFormModal;
