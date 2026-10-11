// ─── EOBI / EPF Register Constants ───────────────────────────────────────────
// Table: eobi_epf_register — one row per employee, tracking that employee's
// EOBI contribution amount and EPF contribution amount, plus which Campus
// (erp_branches) and School (erp_companies) the entry belongs to. Kept as
// its own record here (rather than only living inside the Salary Sheet row)
// because this is the dedicated register table the schema provides for it,
// separate from payroll itself — useful as a standalone contribution report.
//
// company_id has no relation defined in this schema, but a real companies
// table (erp_companies) does exist and is already used by the Branch
// feature's Company lookup (branch.service.ts's listCompanies()) — reused
// here rather than duplicated.
// status is a free String column (no enum in the DB) — constrained here to
// a fixed set of sensible values rather than left fully open-ended.

export const EOBI_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
} as const;