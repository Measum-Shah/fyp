// ─── Reports — Shared Types ──────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/report.service.ts
// field-for-field, same convention as employee.types.ts / department.types.ts.

import type { ApiEnvelope, PaginationMeta } from "./employee.types";

// ─── Employee Directory Report ──────────────────────────────────────────────
export interface EmployeeDirectoryRow {
  id: number;
  reg_no: string | null;
  full_name: string;
  email: string;
  mobile_1: string | null;
  gender: string | null;
  cnic: string;
  designation: string | null;
  staff_type: string;
  department_id: number | null;
  department_name: string;
  branch_id: number;
  branch_name: string;
  company_name: string;
  status: string | null;
  join_date: string | null;
}

export interface EmployeeDirectoryParams {
  page?: number;
  limit?: number;
  search?: string;
  department_id?: number;
  branch_id?: number;
  company_id?: number;
  status?: string;
}

export type EmployeeDirectoryReportResponse = ApiEnvelope<EmployeeDirectoryRow[]> & {
  meta: PaginationMeta;
};

// ─── Headcount Reports ───────────────────────────────────────────────────────
export interface HeadcountRow {
  id: number;
  name: string;
  total: number;
  active: number;
  inactive: number;
}

export interface BranchHeadcountRow extends HeadcountRow {
  company_name: string;
}

export type HeadcountByDepartmentReportResponse = ApiEnvelope<HeadcountRow[]> & {
  meta: { totalEmployees: number };
};

export type HeadcountByBranchReportResponse = ApiEnvelope<BranchHeadcountRow[]> & {
  meta: { totalEmployees: number };
};
// ─── Employee Analytics Report ───────────────────────────────────────────────
export interface DistributionSlice {
  label: string;
  count: number;
  percentage: number;
}

export interface EmployeeAnalyticsData {
  totalEmployees: number;
  byStaffType: DistributionSlice[];
  byGender: DistributionSlice[];
  byDesignation: DistributionSlice[];
  byTenure: DistributionSlice[];
}

export type EmployeeAnalyticsReportResponse = ApiEnvelope<EmployeeAnalyticsData> & {
  meta: { totalEmployees: number };
};

// ─── Joiners & Exits Report ──────────────────────────────────────────────────
export interface JoinersExitsParams {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export interface JoinersExitsData {
  joiners: EmployeeDirectoryRow[];
  exits: EmployeeDirectoryRow[];
}

export type JoinersExitsReportResponse = ApiEnvelope<JoinersExitsData> & {
  meta: { joinersCount: number; exitsCount: number; from: string; to: string };
};

// ─── CNIC Expiry Report ──────────────────────────────────────────────────────
export interface CnicExpiryRow extends EmployeeDirectoryRow {
  cnic_expiry_date_value: string;
  days_remaining: number;
}

export interface CnicExpiryParams {
  from?: string;
  to?: string;
  branch_id?: number;
  company_id?: number;
  department_id?: number;
}

export type CnicExpiryReportResponse = ApiEnvelope<CnicExpiryRow[]> & {
  meta: { total: number };
};

// ─── Contract & Probation Expiry Report ─────────────────────────────────────
export interface ContractProbationExpiryRow extends EmployeeDirectoryRow {
  expiry_type: "Contract" | "Probation";
  expiry_date_raw: string;
  expiry_date_value: string;
  days_remaining: number;
}

export interface ContractProbationExpiryParams {
  from?: string;
  to?: string;
  branch_id?: number;
  company_id?: number;
  department_id?: number;
  type?: "contract" | "probation";
}

export type ContractProbationExpiryReportResponse = ApiEnvelope<ContractProbationExpiryRow[]> & {
  meta: { total: number };
};

// ─── Staff Strength Report ───────────────────────────────────────────────────
export interface StaffStrengthData {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byDepartment: HeadcountRow[];
  byBranch: BranchHeadcountRow[];
  byStaffType: DistributionSlice[];
  byJobStatus: DistributionSlice[];
}

export type StaffStrengthReportResponse = ApiEnvelope<StaffStrengthData> & {
  meta: { totalEmployees: number };
};