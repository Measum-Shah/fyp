// ─── Company — Types ──────────────────────────────────────────────────────────
// Reuses ApiEnvelope/PaginatedEnvelope/PaginationMeta from employee.types.ts,
// same as branch.types.ts/department.types.ts.

export interface Company {
  id: number;
  name: string;
  description: string | null;
  ntn: string | null;
  gst: string | null;
  gst_type: string | null;
  vat: string | null;
  phone: string | null;
  fax: string | null;
  address: string | null;
  logo: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export const COMPANY_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export interface CreateCompanyPayload {
  name: string;
  description?: string;
  ntn?: string;
  gst?: string;
  gst_type?: string;
  vat?: string;
  phone?: string;
  fax?: string;
  address?: string;
  logo?: string;
  status?: number;
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export interface CompanyFormValues {
  name: string;
  description: string;
  ntn: string;
  gst: string;
  gst_type: string;
  vat: string;
  phone: string;
  fax: string;
  address: string;
  logo: string;
  status: string;
}

export const EMPTY_COMPANY_FORM_VALUES: CompanyFormValues = {
  name: "",
  description: "",
  ntn: "",
  gst: "",
  gst_type: "",
  vat: "",
  phone: "",
  fax: "",
  address: "",
  logo: "",
  status: String(COMPANY_STATUS.ACTIVE),
};

export interface ListCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}