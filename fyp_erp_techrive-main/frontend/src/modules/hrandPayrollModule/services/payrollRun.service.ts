import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreatePayrollRunPayload,
  EligibleStaffMember,
  ListPayrollRunParams,
  PayrollRunMember,
  RunPayrollBatchResult,
} from "./payrollRun.types";

export const payrollRunAPI = {
  eligibleStaff: (branch_id: number, month_year: string) =>
    API.get<ApiEnvelope<EligibleStaffMember[]>>("/payroll-runs/eligible-staff", {
      params: { branch_id, month_year },
    }).then((res) => res.data),

  list: (params: ListPayrollRunParams) =>
    API.get<PaginatedEnvelope<PayrollRunMember>>("/payroll-runs", { params }).then((res) => res.data),

  create: (payload: CreatePayrollRunPayload) =>
    API.post<ApiEnvelope<RunPayrollBatchResult>>("/payroll-runs", payload).then((res) => res.data),

  removeMember: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/payroll-runs/${id}`).then((res) => res.data),
};
