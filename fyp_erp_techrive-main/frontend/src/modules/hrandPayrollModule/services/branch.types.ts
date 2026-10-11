// ─── Branch — Types ───────────────────────────────────────────────────────────
// Reuses ApiEnvelope/PaginatedEnvelope/PaginationMeta/LookupOption from
// employee.types.ts — the Company lookup option shape ({id, name}) is
// identical to LookupOption, so it's reused rather than redefined.
//
// city_id/country_id/bank_id/other_bank/voucher_id are plain optional numeric
// ids — there's no cities/countries/banks/voucher table anywhere in the SQL
// export for this schema, so there's nothing to build a dropdown lookup
// against. cambridge_acc/optional_acc/one_bill_prefix/exam_center_no are
// school/exam-board-specific fields (see branch.constants.ts on backend).

export interface Branch {
  id: number;
  company_id: number;
  name: string;
  branch_code: string | null;
  short_name: string | null;
  phone: string;
  fax: number | null;
  cell: string;
  email: string;
  website: string | null;
  address: string | null;
  city_id: number | null;
  country_id: number | null;
  bank_id: number | null;
  other_bank: number | null;
  voucher_id: number | null;
  logo: string | null;
  ip: string | null;
  port: string | null;
  cambridge_acc: string | null;
  optional_acc: string | null;
  one_bill_prefix: string | null;
  exam_center_no: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export const BRANCH_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export interface CreateBranchPayload {
  name: string;
  company_id: number;
  phone: string;
  cell: string;
  email: string;
  address?: string;
  website?: string;
  status?: number;
  branch_code?: string;
  short_name?: string;
  fax?: number;
  city_id?: number;
  country_id?: number;
  bank_id?: number;
  other_bank?: number;
  voucher_id?: number;
  logo?: string;
  ip?: string;
  port?: string;
  cambridge_acc?: string;
  optional_acc?: string;
  one_bill_prefix?: string;
  exam_center_no?: string;
}

export type UpdateBranchPayload = Partial<CreateBranchPayload>;

export interface BranchFormValues {
  name: string;
  company_id: string;
  phone: string;
  cell: string;
  email: string;
  address: string;
  website: string;
  status: string;
  branch_code: string;
  short_name: string;
  fax: string;
  city_id: string;
  country_id: string;
  bank_id: string;
  other_bank: string;
  voucher_id: string;
  logo: string;
  ip: string;
  port: string;
  cambridge_acc: string;
  optional_acc: string;
  one_bill_prefix: string;
  exam_center_no: string;
}

export const EMPTY_BRANCH_FORM_VALUES: BranchFormValues = {
  name: "",
  company_id: "",
  phone: "",
  cell: "",
  email: "",
  address: "",
  website: "",
  status: String(BRANCH_STATUS.ACTIVE),
  branch_code: "",
  short_name: "",
  fax: "",
  city_id: "",
  country_id: "",
  bank_id: "",
  other_bank: "",
  voucher_id: "",
  logo: "",
  ip: "",
  port: "",
  cambridge_acc: "",
  optional_acc: "",
  one_bill_prefix: "",
  exam_center_no: "",
};

export interface ListBranchesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}