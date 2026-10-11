// ─── Branch Module Constants ─────────────────────────────────────────────────
// erp_branches has a handful of legacy NOT NULL columns unrelated to basic
// branch management (provisional_details, tel_no, main_logo, second_logo —
// likely leftovers from this ERP's school-management origin, main_logo/
// second_logo being orphaned Laravel media-library ids with no reference
// table in this schema). They're silently defaulted here rather than
// exposed in the API/UI, same treatment as
// staff.epf_description/epf_opening_amount/eobi_opening_amount in
// employee.service.ts.
//
// `city_name` (INTEGER, DEFAULT NULL) is left unset too — it's nullable, but
// sits right next to `city_id` (also INTEGER, also DEFAULT NULL) and looks
// like a duplicate/superseded column from the source system rather than a
// second, distinct piece of data. Flagged here rather than guessed at.
//
// There is no `cities`, `countries`, `banks`, or `voucher` table anywhere in
// the SQL export, so city_id/country_id/bank_id/other_bank/voucher_id are
// exposed as plain optional integer ids (not dropdown lookups) — there's
// nothing in this schema to look them up against.

export const BRANCH_NAME_MAX_LENGTH = 255;
export const BRANCH_ADDRESS_MAX_LENGTH = 191;
export const BRANCH_WEBSITE_MAX_LENGTH = 255;
export const BRANCH_CODE_MAX_LENGTH = 191;
export const BRANCH_SHORT_NAME_MAX_LENGTH = 255;
export const BRANCH_LOGO_MAX_LENGTH = 500;
export const BRANCH_IP_MAX_LENGTH = 255;
export const BRANCH_PORT_MAX_LENGTH = 255;

// School/exam-board-specific columns (this schema's origin is a school
// management system — see cambridge_acc). Kept as their own group so the UI
// can present them under a distinct "Exam & Billing" section rather than
// mixing them with general branch fields.
export const BRANCH_CAMBRIDGE_ACC_MAX_LENGTH = 191;
export const BRANCH_OPTIONAL_ACC_MAX_LENGTH = 191;
export const BRANCH_ONE_BILL_PREFIX_MAX_LENGTH = 20;
export const BRANCH_EXAM_CENTER_NO_MAX_LENGTH = 191;

export const BRANCH_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

// Legacy-required-but-out-of-scope column defaults
export const BRANCH_LEGACY_DEFAULTS = {
  provisional_details: "",
  tel_no: "",
  main_logo: 0,
  second_logo: 0,
} as const;