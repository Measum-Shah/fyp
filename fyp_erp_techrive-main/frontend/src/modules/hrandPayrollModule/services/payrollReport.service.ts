import API from "../../../api/api";
import type {
  GrossSalaryParams,
  GrossSalaryReportResponse,
  LoanRegisterParams,
  LoanRegisterResponse,
  PayrollRunSummaryParams,
  PayrollRunSummaryResponse,
  SalaryRegisterParams,
  SalaryRegisterResponse,
  SalarySlipsParams,
  SalarySlipsResponse,
} from "./payrollReport.types";

// ─── Payroll Reports — API Service ───────────────────────────────────────────
export const payrollReportAPI = {
  payrollRunSummary: (params: PayrollRunSummaryParams = {}) =>
    API.get<PayrollRunSummaryResponse>("/reports/payroll-run-summary", { params }).then(
      (res) => res.data
    ),

  salaryRegister: (params: SalaryRegisterParams = {}) =>
    API.get<SalaryRegisterResponse>("/reports/salary-register", { params }).then(
      (res) => res.data
    ),

  loanRegister: (params: LoanRegisterParams = {}) =>
    API.get<LoanRegisterResponse>("/reports/loan-register", { params }).then((res) => res.data),

  grossSalary: (params: GrossSalaryParams = {}) =>
    API.get<GrossSalaryReportResponse>("/reports/gross-salary", { params }).then(
      (res) => res.data
    ),

  salarySlips: (params: SalarySlipsParams) =>
    API.get<SalarySlipsResponse>("/reports/salary-slips", { params }).then((res) => res.data),
};
