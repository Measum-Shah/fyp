// ─── Allowance Type — Types ───────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/allowanceType.service.ts

export const ALLOWANCE_CALCULATION_TYPE = { FIXED: "FIXED", PERCENTAGE: "PERCENTAGE" } as const;
export type AllowanceCalculationType = (typeof ALLOWANCE_CALCULATION_TYPE)[keyof typeof ALLOWANCE_CALCULATION_TYPE];

export const ALLOWANCE_TYPE_STATUS = { ACTIVE: 1, INACTIVE: 0 } as const;

export interface AllowanceType {
  id: number;
  name: string;
  code: string | null;
  calculation_type: string;
  default_value: number;
  is_taxable: number;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateAllowanceTypePayload {
  name: string;
  code?: string;
  calculation_type?: string;
  default_value: number;
  is_taxable?: 0 | 1;
  status?: number;
}

export type UpdateAllowanceTypePayload = Partial<CreateAllowanceTypePayload>;

export interface AllowanceTypeFormValues {
  name: string;
  code: string;
  calculation_type: AllowanceCalculationType;
  default_value: string;
  is_taxable: 0 | 1;
  status: number;
}

export const EMPTY_ALLOWANCE_TYPE_FORM_VALUES: AllowanceTypeFormValues = {
  name: "",
  code: "",
  calculation_type: ALLOWANCE_CALCULATION_TYPE.FIXED,
  default_value: "",
  is_taxable: 1,
  status: ALLOWANCE_TYPE_STATUS.ACTIVE,
};

export interface ListAllowanceTypesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}
