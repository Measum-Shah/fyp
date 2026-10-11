import API from "../../../api/api";
import type {
  CnicExpiryParams,
  CnicExpiryReportResponse,
  ContractProbationExpiryParams,
  ContractProbationExpiryReportResponse,
  EmployeeAnalyticsReportResponse,
  EmployeeDirectoryParams,
  EmployeeDirectoryReportResponse,
  HeadcountByBranchReportResponse,
  HeadcountByDepartmentReportResponse,
  JoinersExitsParams,
  JoinersExitsReportResponse,
  StaffStrengthReportResponse,
} from "./report.types";

// ─── Reports — API Service ───────────────────────────────────────────────────
// Same shape as employeeAPI/departmentAPI/branchAPI/companyAPI: a plain
// object of named methods on the shared API axios instance.
// getApiErrorMessage/getApiFieldErrors are NOT re-exported here — callers
// import them from employee.service.ts, same convention as every other
// HR & Payroll service file.

export const reportAPI = {
  employeeDirectory: (params: EmployeeDirectoryParams = {}) =>
    API.get<EmployeeDirectoryReportResponse>("/reports/employee-directory", {
      params,
    }).then((res) => res.data),

  headcountByDepartment: () =>
    API.get<HeadcountByDepartmentReportResponse>("/reports/headcount-by-department").then(
      (res) => res.data
    ),

  headcountByBranch: () =>
    API.get<HeadcountByBranchReportResponse>("/reports/headcount-by-branch").then(
      (res) => res.data
    ),
    employeeAnalytics: () =>
    API.get<EmployeeAnalyticsReportResponse>("/reports/employee-analytics").then(
      (res) => res.data
    ),

  joinersAndExits: (params: JoinersExitsParams) =>
    API.get<JoinersExitsReportResponse>("/reports/joiners-exits", { params }).then(
      (res) => res.data
    ),

  cnicExpiry: (params: CnicExpiryParams = {}) =>
    API.get<CnicExpiryReportResponse>("/reports/cnic-expiry", { params }).then((res) => res.data),

  contractProbationExpiry: (params: ContractProbationExpiryParams = {}) =>
    API.get<ContractProbationExpiryReportResponse>("/reports/contract-probation-expiry", {
      params,
    }).then((res) => res.data),

  staffStrength: () =>
    API.get<StaffStrengthReportResponse>("/reports/staff-strength").then((res) => res.data),
};