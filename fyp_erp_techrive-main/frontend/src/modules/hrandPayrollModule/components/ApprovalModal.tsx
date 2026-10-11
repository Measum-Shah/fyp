import React, { useState } from "react";
import ApproverFields from "./ApproverFields";
import type { ApprovedStatus } from "../services/attendanceSummary.constants";
import type { SetApprovalPayload } from "../services/attendanceSummary.types";
import type { LookupOption, StaffLookupOption } from "../services/employee.types";

interface ApprovalModalProps {
  open: boolean;
  currentStatus: string | null;
  currentApprovedByEmployeeId: number | null;
  currentApprovedByDesignationId: number | null;
  staff: StaffLookupOption[];
  staffLoading: boolean;
  designations: LookupOption[];
  designationsLoading: boolean;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: SetApprovalPayload) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// approved_status, approved_by_employee_id and approved_by_designation_id
// are always changed together through this one modal. Approver Name and
// Approver Designation are now real dropdowns sourced from the Employees /
// Designations tables (never free text) — see ApproverFields.tsx, the same
// component ResignationApprovalModal / BranchTransferApprovalModal use.
const ApprovalModal: React.FC<ApprovalModalProps> = ({
  open,
  currentStatus,
  currentApprovedByEmployeeId,
  currentApprovedByDesignationId,
  staff,
  staffLoading,
  designations,
  designationsLoading,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [approvedStatus, setApprovedStatus] = useState<ApprovedStatus>(
    (currentStatus as ApprovedStatus) || "Pending"
  );
  const [employeeId, setEmployeeId] = useState(currentApprovedByEmployeeId ? String(currentApprovedByEmployeeId) : "");
  const [designationId, setDesignationId] = useState(
    currentApprovedByDesignationId ? String(currentApprovedByDesignationId) : ""
  );
  const [clientError, setClientError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setClientError("Approver name is required");
      return;
    }
    if (!designationId) {
      setClientError("Approver designation is required");
      return;
    }
    setClientError(null);
    onSubmit({
      approved_status: approvedStatus,
      approved_by_employee_id: Number(employeeId),
      approved_by_designation_id: Number(designationId),
    });
  };

  return (
    <div
      className="hr-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="hr-modal hr-modal-form" role="dialog" aria-modal="true" aria-labelledby="approval-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close">
          <IconClose />
        </button>

        <h3 id="approval-modal-title" className="hr-modal-title hr-modal-title-left">
          Update Approval
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <ApproverFields
            idPrefix="attsum-approval"
            status={approvedStatus}
            employeeId={employeeId}
            designationId={designationId}
            onStatusChange={(v) => setApprovedStatus(v as ApprovedStatus)}
            onEmployeeChange={(v) => { setEmployeeId(v); setClientError(null); }}
            onDesignationChange={(v) => { setDesignationId(v); setClientError(null); }}
            staff={staff}
            staffLoading={staffLoading}
            designations={designations}
            designationsLoading={designationsLoading}
            disabled={submitting}
            errors={{
              status: serverErrors.approved_status,
              employeeId: serverErrors.approved_by_employee_id ?? (clientError && !employeeId ? clientError : undefined),
              designationId:
                serverErrors.approved_by_designation_id ?? (clientError && employeeId && !designationId ? clientError : undefined),
            }}
          />

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="spinner-wrap">
                  <span className="spinner" />
                  Saving…
                </span>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApprovalModal;
