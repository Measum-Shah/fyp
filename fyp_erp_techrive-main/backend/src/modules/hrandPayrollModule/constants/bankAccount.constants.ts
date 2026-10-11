// ─── Staff Bank Account Constants ────────────────────────────────────────────
// Table: staff_bank_accounts. Confirmed against the raw SQL — there is no
// bank_id column here (and no FK to erp_banks anywhere in this table), so
// "which bank" is not a field this table tracks at all; only the branch name
// (bank_branch, free text), account_title and account_number are stored.
// erp_banks is a *separate* concept (a bank master table used elsewhere, e.g.
// erp_bankdetail for the company's own disbursement accounts) and is
// intentionally NOT wired into this feature — there's nothing in the schema
// to join it against here.
//
// staff_bi_id (nullable int) appears to reference staff_basic_information.id,
// but that table is out of scope for this feature and there's no relation
// defined anywhere in this schema to confirm it. Left as an optional,
// unvalidated integer rather than guessed at.

export const BANK_ACCOUNT_TITLE_MAX_LENGTH = 100;
export const BANK_ACCOUNT_NUMBER_MAX_LENGTH = 100;
export const BANK_BRANCH_MAX_LENGTH = 100;
export const STAFF_REG_NO_MAX_LENGTH = 100;

export const BANK_ACCOUNT_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "InActive",
} as const;
