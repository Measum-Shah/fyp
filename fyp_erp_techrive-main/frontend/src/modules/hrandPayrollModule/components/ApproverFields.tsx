import React from "react";
import FormField from "./FormField";
import type { LookupOption, StaffLookupOption } from "../services/employee.types";

export const APPROVAL_STATUS_OPTIONS = ["Pending", "Approved", "Rejected"] as const;
export type ApprovalStatusValue = (typeof APPROVAL_STATUS_OPTIONS)[number];

interface ApproverFieldsProps {
  /** Prefix used to build unique element ids, e.g. "res-ceo", "bt-verified". */
  idPrefix: string;
  /** Optional heading shown above the three fields (e.g. "CEO Approval"). */
  legend?: string;
  status: string;
  employeeId: string; // "" or a numeric string — the selected staff id
  designationId: string; // "" or a numeric string — the selected designation id
  onStatusChange: (value: string) => void;
  onEmployeeChange: (value: string) => void;
  onDesignationChange: (value: string) => void;
  staff: StaffLookupOption[];
  staffLoading: boolean;
  designations: LookupOption[];
  designationsLoading: boolean;
  disabled?: boolean;
  errors?: { status?: string; employeeId?: string; designationId?: string };
}

/**
 * Shared by ResignationApprovalModal, BranchTransferApprovalModal, and
 * ApprovalModal (Attendance Summaries) — the three approval sections the
 * task requires to be structurally identical: a status dropdown restricted
 * to Pending/Approved/Rejected, an Approver Name dropdown sourced from the
 * real Employees list (never free text, never hardcoded), and an Approver
 * Designation dropdown sourced from the real Designations list (same).
 *
 * Selecting an employee auto-fills Approver Designation from that
 * employee's own designation (staff.designation_id, kept in sync by
 * employee.service.ts#resolveDesignationId) when one is on file — but the
 * designation field stays independently editable afterward, since some
 * approval stages may legitimately want a different designation recorded
 * than the approver's own day-to-day one.
 */
const ApproverFields: React.FC<ApproverFieldsProps> = ({
  idPrefix,
  legend,
  status,
  employeeId,
  designationId,
  onStatusChange,
  onEmployeeChange,
  onDesignationChange,
  staff,
  staffLoading,
  designations,
  designationsLoading,
  disabled,
  errors = {},
}) => {
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onEmployeeChange(value);

    if (value) {
      const selected = staff.find((s) => String(s.id) === value);
      if (selected?.designation_id) {
        onDesignationChange(String(selected.designation_id));
      }
    }
  };

  return (
    <fieldset className="hr-approval-fieldset">
      {legend && <legend className="hr-approval-legend">{legend}</legend>}

      <FormField label="Approval Status" htmlFor={`${idPrefix}-status`} required error={errors.status}>
        <select
          id={`${idPrefix}-status`}
          className={`field-input hr-select ${errors.status ? "input-error" : ""}`}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          disabled={disabled}
        >
          {APPROVAL_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Approver Name" htmlFor={`${idPrefix}-employee`} required error={errors.employeeId}>
        <select
          id={`${idPrefix}-employee`}
          className={`field-input hr-select ${errors.employeeId ? "input-error" : ""}`}
          value={employeeId}
          onChange={handleEmployeeChange}
          disabled={disabled || staffLoading}
        >
          <option value="">Select employee…</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </FormField>

      <FormField
        label="Approver Designation"
        htmlFor={`${idPrefix}-designation`}
        required
        error={errors.designationId}
        hint={employeeId ? undefined : "Auto-fills from the selected employee's designation, if one is on file"}
      >
        <select
          id={`${idPrefix}-designation`}
          className={`field-input hr-select ${errors.designationId ? "input-error" : ""}`}
          value={designationId}
          onChange={(e) => onDesignationChange(e.target.value)}
          disabled={disabled || designationsLoading}
        >
          <option value="">Select designation…</option>
          {designations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </FormField>
    </fieldset>
  );
};

export default ApproverFields;
