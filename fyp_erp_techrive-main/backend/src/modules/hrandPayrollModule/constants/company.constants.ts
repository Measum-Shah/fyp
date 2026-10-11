// ─── Company Module Constants ────────────────────────────────────────────────
// All limits below come directly from erp_companies' varchar(191) columns in
// the raw SQL schema, except gst_type/logo which are TEXT (unbounded) — those
// are given a sane application-layer cap since the UI still needs a limit.

export const COMPANY_NAME_MAX_LENGTH = 191;
export const COMPANY_DESCRIPTION_MAX_LENGTH = 191;
export const COMPANY_NTN_MAX_LENGTH = 191;
export const COMPANY_GST_MAX_LENGTH = 191;
export const COMPANY_GST_TYPE_MAX_LENGTH = 191;
export const COMPANY_VAT_MAX_LENGTH = 191;
export const COMPANY_PHONE_MAX_LENGTH = 191;
export const COMPANY_FAX_MAX_LENGTH = 191;
export const COMPANY_ADDRESS_MAX_LENGTH = 191;
export const COMPANY_LOGO_MAX_LENGTH = 500;

export const COMPANY_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;