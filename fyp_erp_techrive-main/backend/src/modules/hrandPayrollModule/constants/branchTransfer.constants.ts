// ─── Staff Branch Transfer Constants ─────────────────────────────────────────
// Table: staff_branch_transfer — the richer of two overlapping tables in this
// schema (staff_transfer_branches is a simpler, looks-like-an-audit-log
// duplicate with no approval chain at all); this one was chosen as the real
// feature, same call as building erp_staff_salaries instead of the legacy
// `payrolls` table.
//
// verified_by and approved_by are both NOT NULL Int columns with no default —
// at creation time nobody has verified or approved anything yet, so both are
// seeded with the creator's own id (created_by) as a placeholder and
// overwritten for real once someone actually verifies/approves (see
// branchTransfer.service.ts). principal_approval has the same NOT NULL/no
// default shape and is seeded to 'Pending'.
//
// REAL LOGIC: like Resignations, overall `status` is derived from
// verified_status + approved_status. Once approved_status reaches Approved,
// the employee's staff.branch_id is updated to `to_branch` automatically —
// this is what makes "approving a transfer" actually move the employee.

export const APPROVAL_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export const TRANSFER_REASON_MAX_LENGTH = 1000;
