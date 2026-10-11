import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateDeductionFormulaPayload,
  DeductionFormula,
  ListDeductionFormulasParams,
  UpdateDeductionFormulaPayload,
} from "./payrollDeductionFormula.types";

export const deductionFormulaAPI = {
  list: (params: ListDeductionFormulasParams = {}) =>
    API.get<PaginatedEnvelope<DeductionFormula>>("/payroll-deduction-formulas", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<DeductionFormula>>(`/payroll-deduction-formulas/${id}`).then((res) => res.data),

  create: (payload: CreateDeductionFormulaPayload) =>
    API.post<ApiEnvelope<DeductionFormula>>("/payroll-deduction-formulas", payload).then((res) => res.data),

  update: (id: number, payload: UpdateDeductionFormulaPayload) =>
    API.put<ApiEnvelope<DeductionFormula>>(`/payroll-deduction-formulas/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/payroll-deduction-formulas/${id}`).then((res) => res.data),
};
