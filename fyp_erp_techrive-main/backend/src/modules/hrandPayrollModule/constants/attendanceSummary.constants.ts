// ─── Attendance Summary — Backend Constants ─────────────────────────────────
// Attendance module, Phase 4c: attendance_summary — the monthly per-employee
// rollup that feeds payroll (referenced by staff_id/branch_id/month_id/
// year_id, none enforced as DB-level FKs, same as every other table here).

// pay_status and approved_status are both plain VARCHAR columns with no
// backing lookup table (unlike attendance status, which has a real
// erp_attendance_statuses table) — this codebase fixes them to a small,
// documented set of values rather than accepting arbitrary free text.
export const PAY_STATUS_OPTIONS = ["Unpaid", "Processing", "Paid", "Hold"] as const;

export const APPROVED_STATUS_OPTIONS = ["Pending", "Approved", "Rejected"] as const;

export const APPROVED_STATUS_DEFAULT = "Pending";

// approved_by is a String column (not an Int user-id FK like every other
// *_by column in this schema) defaulting to the literal text "Pending" —
// this codebase treats it honestly as a free-text "approved by" name field
// (the legacy convention this table was built around) rather than forcing
// it to resolve to a real user account.
export const APPROVED_BY_MAX_LENGTH = 255;
export const APPROVED_BY_DEFAULT = "Pending";

export const REMARKS_MAX_LENGTH = 1000;

export const TOTAL_ABSENTS_MIN = 0;
export const TOTAL_ABSENTS_MAX = 31;
