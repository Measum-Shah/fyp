import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { APPROVAL_STATUS } from "../constants/branchTransfer.constants";
import {
  CreateBranchTransferInput,
  UpdateBranchTransferApprovalInput,
  UpdateBranchTransferInput,
} from "../validators/branchTransfer.validator";

const transferSelect = {
  id: true,
  staff_id: true,
  from_branch: true,
  to_branch: true,
  date: true,
  status: true,
  reason: true,
  created_by: true,
  principal_approval: true,
  principal_approval_employee_id: true,
  principal_approval_designation_id: true,
  verified_by: true,
  verified_status: true,
  verified_employee_id: true,
  verified_designation_id: true,
  approved_status: true,
  approved_employee_id: true,
  approved_designation_id: true,
  approved_by: true,
  updated_at: true,
  created_at: true,
} satisfies Prisma.StaffBranchTransferSelect;

export type BranchTransferRecord = Prisma.StaffBranchTransferGetPayload<{ select: typeof transferSelect }>;

interface ListBranchTransfersParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
  status?: string;
}

interface ListBranchTransfersResult {
  data: BranchTransferRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertBranchExists = async (branch_id: number, label: string) => {
  const branch = await prisma.erpBranches.findFirst({
    where: { id: branch_id, deleted_at: null },
    select: { id: true },
  });
  if (!branch) {
    throw AppError.badRequest(`${label} does not exist`, { branch_id: `No campus found with id ${branch_id}` });
  }
};

/** Approver Name must reference a real, active employee (same rule as
 * resignation.service.ts#assertApproverEmployeeExists). */
const assertApproverEmployeeExists = async (employeeId: number, field: string) => {
  const employee = await prisma.staff.findFirst({ where: { id: employeeId, deleted_at: null }, select: { id: true } });
  if (!employee) {
    throw AppError.badRequest("Selected approver does not exist or is inactive", {
      [field]: `No active employee found with id ${employeeId}`,
    });
  }
};

/** Approver Designation must reference a real, non-deleted designation. */
const assertApproverDesignationExists = async (designationId: number, field: string) => {
  const designation = await prisma.designation.findFirst({
    where: { id: designationId, deleted_at: null },
    select: { id: true },
  });
  if (!designation) {
    throw AppError.badRequest("Selected approver designation does not exist", {
      [field]: `No designation found with id ${designationId}`,
    });
  }
};

const findTransferOrThrow = async (id: number): Promise<BranchTransferRecord> => {
  const record = await prisma.staffBranchTransfer.findUnique({ where: { id }, select: transferSelect });
  if (!record) {
    throw AppError.notFound(`Campus transfer with id ${id} was not found`);
  }
  return record;
};

const computeOverallStatus = (verified: string, approved: string): string => {
  if (verified === APPROVAL_STATUS.REJECTED || approved === APPROVAL_STATUS.REJECTED) return APPROVAL_STATUS.REJECTED;
  if (approved === APPROVAL_STATUS.APPROVED) return APPROVAL_STATUS.APPROVED;
  return APPROVAL_STATUS.PENDING;
};

export const listBranchTransfers = async (
  params: ListBranchTransfersParams,
  scope?: RecordScope
): Promise<ListBranchTransfersResult> => {
  const { page, limit, search, staff_id, status } = params;

  const where: Prisma.StaffBranchTransferWhereInput = {
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id
      ? { staff_id }
      : {}),
    ...(status ? { status } : {}),
    ...(search ? { reason: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.staffBranchTransfer.count({ where }),
    prisma.staffBranchTransfer.findMany({
      where,
      select: transferSelect,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

export const getBranchTransferById = async (id: number, scope?: RecordScope): Promise<BranchTransferRecord> => {
  const record = await findTransferOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Campus transfer with id ${id} was not found`);
  }
  return record;
};

export const createBranchTransfer = async (
  input: CreateBranchTransferInput,
  actorId: number
): Promise<BranchTransferRecord> => {
  const staff = await prisma.staff.findFirst({
    where: { id: input.staff_id, deleted_at: null },
    select: { id: true, branch_id: true },
  });
  if (!staff) {
    throw AppError.badRequest("Employee does not exist", {
      staff_id: `No active employee found with id ${input.staff_id}`,
    });
  }

  const fromBranch = input.from_branch ?? staff.branch_id;
  await assertBranchExists(input.to_branch, "Destination campus");
  if (fromBranch) await assertBranchExists(fromBranch, "Origin campus");

  if (fromBranch === input.to_branch) {
    throw AppError.badRequest("Destination campus must be different from the current campus", {
      to_branch: "Employee is already assigned to this campus",
    });
  }

  return prisma.staffBranchTransfer.create({
    data: {
      staff_id: input.staff_id,
      from_branch: fromBranch ?? input.to_branch,
      to_branch: input.to_branch,
      date: new Date(input.date),
      status: APPROVAL_STATUS.PENDING,
      reason: input.reason,
      created_by: actorId,
      principal_approval: APPROVAL_STATUS.PENDING,
      // Nobody has verified/approved yet — seeded to the creator until a
      // real reviewer acts (see branchTransfer.constants.ts).
      verified_by: actorId,
      verified_status: APPROVAL_STATUS.PENDING,
      approved_status: APPROVAL_STATUS.PENDING,
      approved_by: actorId,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: transferSelect,
  });
};

export const updateBranchTransfer = async (
  id: number,
  input: UpdateBranchTransferInput
): Promise<BranchTransferRecord> => {
  const existing = await findTransferOrThrow(id);
  if (existing.status !== APPROVAL_STATUS.PENDING) {
    throw AppError.conflict("This transfer has already been decided and can no longer be edited", {
      id: "Only Pending transfers can be edited",
    });
  }

  if (input.to_branch !== undefined) await assertBranchExists(input.to_branch, "Destination campus");
  if (input.from_branch !== undefined) await assertBranchExists(input.from_branch, "Origin campus");

  return prisma.staffBranchTransfer.update({
    where: { id },
    data: {
      ...(input.staff_id !== undefined ? { staff_id: input.staff_id } : {}),
      ...(input.to_branch !== undefined ? { to_branch: input.to_branch } : {}),
      ...(input.from_branch !== undefined ? { from_branch: input.from_branch } : {}),
      ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      updated_at: new Date(),
    },
    select: transferSelect,
  });
};

/**
 * The one place this feature has real side effects: once approved_status
 * reaches Approved, the employee's staff.branch_id is updated to to_branch
 * automatically — this is what actually moves the employee, rather than
 * just recording that a move was agreed to.
 */
export const updateBranchTransferApproval = async (
  id: number,
  input: UpdateBranchTransferApprovalInput,
  actorId: number
): Promise<BranchTransferRecord> => {
  const existing = await findTransferOrThrow(id);

  const checks: Array<[number | undefined, string, (id: number, f: string) => Promise<void>]> = [
    [input.verified_employee_id, "verified_employee_id", assertApproverEmployeeExists],
    [input.verified_designation_id, "verified_designation_id", assertApproverDesignationExists],
    [input.approved_employee_id, "approved_employee_id", assertApproverEmployeeExists],
    [input.approved_designation_id, "approved_designation_id", assertApproverDesignationExists],
    [input.principal_approval_employee_id, "principal_approval_employee_id", assertApproverEmployeeExists],
    [input.principal_approval_designation_id, "principal_approval_designation_id", assertApproverDesignationExists],
  ];
  for (const [value, field, assertFn] of checks) {
    if (value !== undefined) await assertFn(value, field);
  }

  const nextVerified = input.verified_status ?? existing.verified_status ?? APPROVAL_STATUS.PENDING;
  const nextApproved = input.approved_status ?? existing.approved_status ?? APPROVAL_STATUS.PENDING;
  const nextStatus = computeOverallStatus(nextVerified, nextApproved);

  const updated = await prisma.staffBranchTransfer.update({
    where: { id },
    data: {
      verified_status: nextVerified,
      ...(input.verified_status !== undefined ? { verified_by: actorId } : {}),
      ...(input.verified_employee_id !== undefined ? { verified_employee_id: input.verified_employee_id } : {}),
      ...(input.verified_designation_id !== undefined ? { verified_designation_id: input.verified_designation_id } : {}),
      approved_status: nextApproved,
      ...(input.approved_status !== undefined ? { approved_by: actorId } : {}),
      ...(input.approved_employee_id !== undefined ? { approved_employee_id: input.approved_employee_id } : {}),
      ...(input.approved_designation_id !== undefined ? { approved_designation_id: input.approved_designation_id } : {}),
      ...(input.principal_approval !== undefined ? { principal_approval: input.principal_approval } : {}),
      ...(input.principal_approval_employee_id !== undefined
        ? { principal_approval_employee_id: input.principal_approval_employee_id }
        : {}),
      ...(input.principal_approval_designation_id !== undefined
        ? { principal_approval_designation_id: input.principal_approval_designation_id }
        : {}),
      status: nextStatus,
      updated_at: new Date(),
    },
    select: transferSelect,
  });

  if (nextStatus === APPROVAL_STATUS.APPROVED) {
    await prisma.staff.update({
      where: { id: existing.staff_id },
      data: { branch_id: existing.to_branch, updated_at: new Date() },
    });
  }

  return updated;
};

/** Hard delete — no deleted_at column on this table. Only while Pending. */
export const deleteBranchTransfer = async (id: number): Promise<void> => {
  const existing = await findTransferOrThrow(id);
  if (existing.status !== APPROVAL_STATUS.PENDING) {
    throw AppError.conflict("This transfer has already been decided and can no longer be deleted", {
      id: "Only Pending transfers can be deleted",
    });
  }
  await prisma.staffBranchTransfer.delete({ where: { id } });
};