// ─── Branch Transfer — Types ──────────────────────────────────────────────────
export const APPROVAL_STATUS = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" } as const;

export interface BranchTransfer {
  id: number;
  staff_id: number;
  from_branch: number | null;
  to_branch: number;
  date: string | null;
  status: string | null;
  reason: string;
  created_by: number | null;
  principal_approval: string | null;
  principal_approval_employee_id: number | null;
  principal_approval_designation_id: number | null;
  verified_by: number | null;
  verified_status: string | null;
  verified_employee_id: number | null;
  verified_designation_id: number | null;
  approved_status: string | null;
  approved_employee_id: number | null;
  approved_designation_id: number | null;
  approved_by: number | null;
  updated_at: string | null;
  created_at: string | null;
}

export interface CreateBranchTransferPayload {
  staff_id: number;
  to_branch: number;
  from_branch?: number;
  date: string;
  reason: string;
}

export type UpdateBranchTransferPayload = Partial<CreateBranchTransferPayload>;

export interface UpdateBranchTransferApprovalPayload {
  verified_status?: string;
  verified_employee_id?: number;
  verified_designation_id?: number;
  approved_status?: string;
  approved_employee_id?: number;
  approved_designation_id?: number;
  principal_approval?: string;
  principal_approval_employee_id?: number;
  principal_approval_designation_id?: number;
}

export interface BranchTransferFormValues {
  staff_id: string;
  to_branch: string;
  date: string;
  reason: string;
}

export const EMPTY_BRANCH_TRANSFER_FORM_VALUES: BranchTransferFormValues = {
  staff_id: "",
  to_branch: "",
  date: new Date().toISOString().slice(0, 10),
  reason: "",
};

export interface ListBranchTransfersParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  status?: string;
}