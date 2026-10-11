// ─── Salary Increment Constants ──────────────────────────────────────────────
// Table: increment_pfs. Approval used to be a dual CEO + Principal workflow;
// it is now a single Status field (Pending / Approved / Rejected) — see
// increment-status-schema-alter.sql for the additive column migration and
// backfill from the old ceo_approval/principal_approval columns, which are
// kept in the DB (unused by the app) so no historical data is lost.
//
// Two columns are unusual and kept exactly as named in the DB rather than
// renamed, so this stays a faithful mapping of the schema:
//   - "New_salary_increment" (capitalized, underscore) — the resulting new
//     gross salary after the increment
//   - "Amount" (capitalized) — the increment amount itself (New − Previous)
//
// user_id (nullable int) exists *alongside* staff_id on this table — looks
// like a legacy reference to erp_users (the login account), distinct from
// staff_id (the employee record). Exposed as an optional plain integer,
// same treatment as ledger_id in salary.constants.ts, since there's no
// relation defined anywhere in this schema to confirm it against.

export const INCREMENT_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export const INCREMENT_REASON_MAX_LENGTH = 191;
export const INCREMENT_STAFF_TYPE_MAX_LENGTH = 191;
export const INCREMENT_ROLE_ID_MAX_LENGTH = 191;