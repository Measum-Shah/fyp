import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { isBranchVisible } from "../utils/branch-scope.util";
import { LEAVE_TYPE_PAY_TYPE, LEAVE_TYPE_STATUS } from "../constants/leaveType.constants";
import {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
} from "../validators/leaveType.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const leaveTypeSelect = {
  id: true,
  name: true,
  permitted_days: true,
  year: true,
  parent_id: true,
  type: true,
  branch_id: true,
  start_date: true,
  end_date: true,
  pay_type: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpHrmLeaveTypesSelect;

export type LeaveTypeRecord = Prisma.ErpHrmLeaveTypesGetPayload<{
  select: typeof leaveTypeSelect;
}>;

export interface LeaveTypeLookupOption {
  id: number;
  name: string;
}

interface ListLeaveTypesParams {
  page: number;
  limit: number;
  search?: string;
  status?: number;
}

interface ListLeaveTypesResult {
  data: LeaveTypeRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Lookup (feeds Leave Request / Leave Entitlement form dropdowns) ───────
export const listActiveLookup = async (): Promise<LeaveTypeLookupOption[]> => {
  return prisma.erpHrmLeaveTypes.findMany({
    where: { deleted_at: null, status: LEAVE_TYPE_STATUS.ACTIVE },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * erp_hrm_leave_types has no unique constraint on `name` at the DB level, so
 * uniqueness is enforced here at the application layer, same pattern as
 * department.service.ts/company.service.ts.
 */
const assertNameIsUnique = async (name: string, excludeId?: number) => {
  const existing = await prisma.erpHrmLeaveTypes.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A leave type with this name already exists", {
      name: `Leave type '${name}' already exists`,
    });
  }
};

const findActiveLeaveTypeOrThrow = async (id: number): Promise<LeaveTypeRecord> => {
  const leaveType = await prisma.erpHrmLeaveTypes.findFirst({
    where: { id, deleted_at: null },
    select: leaveTypeSelect,
  });

  if (!leaveType) {
    throw AppError.notFound(`Leave type with id ${id} was not found`);
  }

  return leaveType;
};

const LEAVE_TYPE_TOP_LEVEL_PARENT_ID = 0;

/**
 * parent_id is a genuine self-referencing hierarchy column (nullable
 * INTEGER DEFAULT 0), same shape and same lack of an FK constraint as
 * designation.parent_id — enforced here at the application layer. This
 * validation keeps getting silently dropped in later revisions of this
 * file; restored again since removing it allows dangling/circular parent
 * references with zero guard.
 */
const assertParentIsValid = async (parentId: number, selfId?: number) => {
  if (parentId === LEAVE_TYPE_TOP_LEVEL_PARENT_ID) return;

  if (parentId === selfId) {
    throw AppError.badRequest("A leave type cannot be its own parent", {
      parent_id: "Choose a different parent leave type",
    });
  }

  const parent = await prisma.erpHrmLeaveTypes.findFirst({
    where: { id: parentId, deleted_at: null },
    select: { id: true, parent_id: true },
  });

  if (!parent) {
    throw AppError.badRequest("Parent leave type does not exist", {
      parent_id: `No leave type found with id ${parentId}`,
    });
  }

  if (selfId !== undefined) {
    let current = parent;
    const visited = new Set<number>([parentId]);

    while ((current.parent_id ?? LEAVE_TYPE_TOP_LEVEL_PARENT_ID) !== LEAVE_TYPE_TOP_LEVEL_PARENT_ID) {
      const currentParentId = current.parent_id as number;
      if (currentParentId === selfId) {
        throw AppError.badRequest("This would create a circular reporting chain", {
          parent_id: "Choose a parent leave type that isn't a descendant of this one",
        });
      }
      if (visited.has(currentParentId)) break;
      visited.add(currentParentId);

      const next = await prisma.erpHrmLeaveTypes.findFirst({
        where: { id: currentParentId, deleted_at: null },
        select: { id: true, parent_id: true },
      });
      if (!next) break;
      current = next;
    }
  }
};

/**
 * Delete guard covering every real dependent: entitlements, requests,
 * leaves, the leave_type_staff_types junction, and child leave types. This
 * keeps getting narrowed back to just requests+entitlements in later
 * revisions of this file — restored to the full scope again, since the
 * narrower version allows orphaning leave records and dangling staff-type
 * links / child rows.
 */
const assertLeaveTypeNotInUse = async (id: number) => {
  const [entitlementCount, requestCount, leaveCount, staffTypeLinkCount, childCount] =
    await prisma.$transaction([
      prisma.erpHrmLeaveEntitlements.count({ where: { leave_type_id: id, deleted_at: null } }),
      prisma.erpHrmLeaveRequests.count({ where: { leave_type_id: id, deleted_at: null } }),
      prisma.erpHrmLeaves.count({ where: { leave_type_id: id, deleted_at: null } }),
      prisma.leaveTypeStaffTypes.count({ where: { leave_type_id: id, deleted_at: null } }),
      prisma.erpHrmLeaveTypes.count({ where: { parent_id: id, deleted_at: null } }),
    ]);

  if (entitlementCount > 0) {
    throw AppError.conflict(
      `Cannot delete this leave type — ${entitlementCount} employee entitlement(s) reference it`,
      { id: "Remove or reassign the related leave entitlements first" }
    );
  }
  if (requestCount > 0) {
    throw AppError.conflict(
      `Cannot delete this leave type — ${requestCount} leave request(s) reference it`,
      { id: "Remove or reassign the related leave requests first" }
    );
  }
  if (leaveCount > 0) {
    throw AppError.conflict(
      `Cannot delete this leave type — ${leaveCount} leave record(s) reference it`,
      { id: "Remove or reassign the related leave records first" }
    );
  }
  if (staffTypeLinkCount > 0) {
    throw AppError.conflict(
      `Cannot delete this leave type — it is still linked to ${staffTypeLinkCount} staff type(s)`,
      { id: "Remove the staff type restrictions for this leave type first" }
    );
  }
  if (childCount > 0) {
    throw AppError.conflict(
      `Cannot delete this leave type — ${childCount} other leave type(s) report to it`,
      { id: "Reassign or remove the child leave types before deleting this one" }
    );
  }
};

// ─── List leave types ─────────────────────────────────────────────────────────
export const listLeaveTypes = async (
  params: ListLeaveTypesParams,
  branchIds?: number[] | null
): Promise<ListLeaveTypesResult> => {
  const { page, limit, search, status } = params;

  const where: Prisma.ErpHrmLeaveTypesWhereInput = {
    deleted_at: null,
    ...(branchIds ? { OR: [{ branch_id: null }, { branch_id: { in: branchIds } }] } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpHrmLeaveTypes.count({ where }),
    prisma.erpHrmLeaveTypes.findMany({
      where,
      select: leaveTypeSelect,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ─── Get single leave type ────────────────────────────────────────────────────
export const getLeaveTypeById = async (id: number, branchIds?: number[] | null): Promise<LeaveTypeRecord> => {
  const record = await findActiveLeaveTypeOrThrow(id);
  if (branchIds !== undefined && !isBranchVisible(branchIds ?? null, record.branch_id)) {
    throw AppError.notFound(`Leave type with id ${id} was not found`);
  }
  return record;
};

// ─── Create leave type ────────────────────────────────────────────────────────
export const createLeaveType = async (
  input: CreateLeaveTypeInput,
  actorId?: number
): Promise<LeaveTypeRecord> => {
  await assertNameIsUnique(input.name);

  const parentId = input.parent_id ?? LEAVE_TYPE_TOP_LEVEL_PARENT_ID;
  await assertParentIsValid(parentId);

  return prisma.erpHrmLeaveTypes.create({
    data: {
      name: input.name,
      permitted_days: input.permitted_days ?? 0,
      year: input.year ?? new Date().getFullYear(),
      parent_id: parentId,
      type: input.type,
      start_date: input.start_date ? new Date(input.start_date) : undefined,
      end_date: input.end_date ? new Date(input.end_date) : undefined,
      pay_type: input.pay_type ?? LEAVE_TYPE_PAY_TYPE.PAID,
      status: input.status ?? LEAVE_TYPE_STATUS.ACTIVE,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: leaveTypeSelect,
  });
};

// ─── Update leave type ────────────────────────────────────────────────────────
export const updateLeaveType = async (
  id: number,
  input: UpdateLeaveTypeInput,
  actorId?: number
): Promise<LeaveTypeRecord> => {
  await findActiveLeaveTypeOrThrow(id);

  if (input.name !== undefined) {
    await assertNameIsUnique(input.name, id);
  }
  if (input.parent_id !== undefined) {
    await assertParentIsValid(input.parent_id ?? LEAVE_TYPE_TOP_LEVEL_PARENT_ID, id);
  }

  return prisma.erpHrmLeaveTypes.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.permitted_days !== undefined ? { permitted_days: input.permitted_days } : {}),
      ...(input.year !== undefined ? { year: input.year } : {}),
      ...(input.parent_id !== undefined ? { parent_id: input.parent_id } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.start_date !== undefined ? { start_date: new Date(input.start_date) } : {}),
      ...(input.end_date !== undefined ? { end_date: new Date(input.end_date) } : {}),
      ...(input.pay_type !== undefined ? { pay_type: input.pay_type } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: leaveTypeSelect,
  });
};

// ─── Delete leave type (soft delete, guarded) ─────────────────────────────────
export const deleteLeaveType = async (id: number, deletedBy?: number): Promise<void> => {
  await findActiveLeaveTypeOrThrow(id);
  await assertLeaveTypeNotInUse(id);

  await prisma.erpHrmLeaveTypes.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      status: LEAVE_TYPE_STATUS.INACTIVE,
      updated_at: new Date(),
    },
  });
};