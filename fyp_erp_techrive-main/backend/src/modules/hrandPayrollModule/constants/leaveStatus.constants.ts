// ─── Leave Status Module Constants ──────────────────────────────────────────
// erp_hrm_leave_statuses: id, name, status, created_by, updated_by,
// deleted_by, created_at, updated_at, deleted_at (confirmed against the raw
// SQL — a small admin-managed master, e.g. "Pending" / "Approved" /
// "Rejected" / "Cancelled". The dump ships with zero seed rows, so HR must
// create these themselves before Leave Requests can reference one — same
// bootstrap requirement as Department/Designation/Staff Type.

export const LEAVE_STATUS_NAME_MAX_LENGTH = 255; // matches "name" varchar(255)

export const LEAVE_STATUS_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

// counts_as_approved (2026-08-22, fixes audit finding #3): since this table
// is free-text/admin-named, payrollRun.service.ts's computeLeaveDeduction()
// can't infer which row means "Approved" from its name. HR flags the
// row(s) that should count via this boolean-style field. Defaults to 0/off
// for every row until explicitly set.
export const LEAVE_STATUS_APPROVAL_FLAG = {
  COUNTS_AS_APPROVED: 1,
  DOES_NOT_COUNT: 0,
} as const;