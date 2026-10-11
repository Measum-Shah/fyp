import React, { useState } from "react";
import ApproverFields from "./ApproverFields";
import { APPROVAL_STATUS } from "../services/branchTransfer.types";
import type { BranchTransfer, UpdateBranchTransferApprovalPayload } from "../services/branchTransfer.types";
import type { LookupOption, StaffLookupOption } from "../services/employee.types";

interface BranchTransferApprovalModalProps {
  open: boolean;
  record: BranchTransfer | null;
  staff: StaffLookupOption[];
  staffLoading: boolean;
  designations: LookupOption[];
  designationsLoading: boolean;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (payload: UpdateBranchTransferApprovalPayload) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// UI-ONLY CHANGE: this modal now shows a single "VERIFIED STATUS" section
// instead of the previous three (Verified Status, Approved Status,
// Principal Approval). It's wired to the same underlying verified_status /
// verified_employee_id / verified_designation_id fields as before — no
// backend, database, or validation changes were made. The Approved Status
// and Principal Approval fields still exist on the record and are simply
// no longer edited from this modal.
const BranchTransferApprovalModal: React.FC<BranchTransferApprovalModalProps> = ({
  open, record, staff, staffLoading, designations, designationsLoading, submitting, serverErrors = {}, onSubmit, onCancel,
}) => {
  const [draft, setDraft] = useState<UpdateBranchTransferApprovalPayload>({});

  if (!open || !record) return null;

  const verifiedStatus = draft.verified_status ?? record.verified_status ?? APPROVAL_STATUS.PENDING;
  const verifiedEmployeeId = String(draft.verified_employee_id ?? record.verified_employee_id ?? "");
  const verifiedDesignationId = String(draft.verified_designation_id ?? record.verified_designation_id ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(draft);
  };

  return (
    <div className="hr-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !submitting) onCancel(); }}>
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="transfer-approval-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close"><IconClose /></button>

        <h3 id="transfer-approval-title" className="hr-modal-title hr-modal-title-left">Transfer Approval</h3>
        <p className="hr-field-hint">
          Overall status: <strong>{record.status}</strong>
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <ApproverFields
            idPrefix="tr-verified"
            legend="VERIFIED STATUS"
            status={verifiedStatus}
            employeeId={verifiedEmployeeId}
            designationId={verifiedDesignationId}
            onStatusChange={(v) => setDraft((prev) => ({ ...prev, verified_status: v }))}
            onEmployeeChange={(v) =>
              setDraft((prev) => ({ ...prev, verified_employee_id: v === "" ? undefined : Number(v) }))
            }
            onDesignationChange={(v) =>
              setDraft((prev) => ({ ...prev, verified_designation_id: v === "" ? undefined : Number(v) }))
            }
            staff={staff}
            staffLoading={staffLoading}
            designations={designations}
            designationsLoading={designationsLoading}
            disabled={submitting}
            errors={{
              status: serverErrors.verified_status,
              employeeId: serverErrors.verified_employee_id,
              designationId: serverErrors.verified_designation_id,
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

export default BranchTransferApprovalModal;
