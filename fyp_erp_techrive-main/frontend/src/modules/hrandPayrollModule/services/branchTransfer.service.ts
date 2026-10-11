import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  BranchTransfer,
  CreateBranchTransferPayload,
  ListBranchTransfersParams,
  UpdateBranchTransferApprovalPayload,
  UpdateBranchTransferPayload,
} from "./branchTransfer.types";

export const branchTransferAPI = {
  list: (params: ListBranchTransfersParams = {}) =>
    API.get<PaginatedEnvelope<BranchTransfer>>("/branch-transfers", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<BranchTransfer>>(`/branch-transfers/${id}`).then((res) => res.data),

  create: (payload: CreateBranchTransferPayload) =>
    API.post<ApiEnvelope<BranchTransfer>>("/branch-transfers", payload).then((res) => res.data),

  update: (id: number, payload: UpdateBranchTransferPayload) =>
    API.put<ApiEnvelope<BranchTransfer>>(`/branch-transfers/${id}`, payload).then((res) => res.data),

  updateApproval: (id: number, payload: UpdateBranchTransferApprovalPayload) =>
    API.patch<ApiEnvelope<BranchTransfer>>(`/branch-transfers/${id}/approval`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/branch-transfers/${id}`).then((res) => res.data),
};
