import React, { useState } from "react";
import ApproverFields from "./ApproverFields";
import { APPROVAL_STATUS } from "../services/resignation.types";
import type { Resignation, UpdateResignationApprovalPayload } from "../services/resignation.types";
import type { LookupOption, StaffLookupOption } from "../services/employee.types";

interface ResignationApprovalModalProps {
  open: boolean;
  record: Resignation | null;
  staff: StaffLookupOption[];
  staffLoading: boolean;
  designations: LookupOption[];
  designationsLoading: boolean;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (payload: UpdateResignationApprovalPayload) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Overall status is computed server-side from the CEO/HR Head approval
// fields on the record (Approved only once both reach Approved) — see
// resignation.service.ts. Once that happens, the employee's staff.status
// is automatically flipped to Inactive.
//
// UI-ONLY CHANGE: this modal now shows a single "VERIFIED STATUS" section
// instead of the previous two (CEO Approval, HR Head Approval). It's wired
// to the same underlying approved_by_ceo / approved_by_ceo_employee_id /
// approved_by_ceo_designation_id fields as before — no backend, database,
// or validation changes were made. The HR Head fields still exist on the
// record and are simply no longer edited from this modal.
const ResignationApprovalModal: React.FC<ResignationApprovalModalProps> = ({
  open, record, staff, staffLoading, designations, designationsLoading, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [draft, setDraft] = useState<UpdateResignationApprovalPayload>({});

  if (!open || !record) return null;

  const statusValue = draft.approved_by_ceo ?? record.approved_by_ceo ?? APPROVAL_STATUS.PENDING;

  const employeeId = String(
    draft.approved_by_ceo_employee_id ?? record.approved_by_ceo_employee_id ?? ""
  );
  const designationId = String(
    draft.approved_by_ceo_designation_id ?? record.approved_by_ceo_designation_id ?? ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(draft);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="resign-approval-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="resign-approval-title" className="hr-modal-title hr-modal-title-left">Resignation Approval</h3>
        <p className="hr-field-hint">
          Overall status: <strong>{record.status}</strong>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <ApproverFields
            idPrefix="res-verified"
            legend="VERIFIED STATUS"
            status={statusValue}
            employeeId={employeeId}
            designationId={designationId}
            onStatusChange={(v) => setDraft((prev) => ({ ...prev, approved_by_ceo: v }))}
            onEmployeeChange={(v) =>
              setDraft((prev) => ({ ...prev, approved_by_ceo_employee_id: v === "" ? undefined : Number(v) }))
            }
            onDesignationChange={(v) =>
              setDraft((prev) => ({ ...prev, approved_by_ceo_designation_id: v === "" ? undefined : Number(v) }))
            }
            staff={staff}
            staffLoading={staffLoading}
            designations={designations}
            designationsLoading={designationsLoading}
            disabled={submitting}
            errors={{
              status: serverErrors.approved_by_ceo,
              employeeId: serverErrors.approved_by_ceo_employee_id,
              designationId: serverErrors.approved_by_ceo_designation_id,
            }}
          />

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-wrap"><span className="spinner" />Saving…</span> : "Save Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResignationApprovalModal;
