import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { LEAVE_STATUS_STATUS } from "../constants/leaveStatus.constants";
import {
  CreateLeaveStatusInput,
  UpdateLeaveStatusInput,
} from "../validators/leaveStatus.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const leaveStatusSelect = {
  id: true,
  name: true,
  counts_as_approved: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpHrmLeaveStatusesSelect;

export type LeaveStatusRecord = Prisma.ErpHrmLeaveStatusesGetPayload<{
  select: typeof leaveStatusSelect;
}>;

export interface LeaveStatusLookupOption {
  id: number;
  name: string;
}

interface ListLeaveStatusesParams {
  page: number;
  limit: number;
  search?: string;
  status?: number;
}

interface ListLeaveStatusesResult {
  data: LeaveStatusRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Lookup (feeds the Leave Request form's status dropdown) ──────────────
export const listActiveLookup = async (): Promise<LeaveStatusLookupOption[]> => {
  return prisma.erpHrmLeaveStatuses.findMany({
    where: { deleted_at: null, status: LEAVE_STATUS_STATUS.ACTIVE },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertNameIsUnique = async (name: string, excludeId?: number) => {
  const existing = await prisma.erpHrmLeaveStatuses.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A leave status with this name already exists", {
      name: `Leave status '${name}' already exists`,
    });
  }
};

const findActiveLeaveStatusOrThrow = async (id: number): Promise<LeaveStatusRecord> => {
  const leaveStatus = await prisma.erpHrmLeaveStatuses.findFirst({
    where: { id, deleted_at: null },
    select: leaveStatusSelect,
  });

  if (!leaveStatus) {
    throw AppError.notFound(`Leave status with id ${id} was not found`);
  }

  return leaveStatus;
};

/** Blocks deletion while any non-deleted Leave Request still references this status. */
const assertLeaveStatusNotInUse = async (id: number) => {
  const requestCount = await prisma.erpHrmLeaveRequests.count({
    where: { leave_status: id, deleted_at: null },
  });

  if (requestCount > 0) {
    throw AppError.conflict(
      `Cannot delete this leave status — ${requestCount} leave request(s) still reference it`,
      { id: "Reassign affected leave requests to a different status before deleting this one" }
    );
  }
};

// ─── List leave statuses ──────────────────────────────────────────────────────
export const listLeaveStatuses = async (
  params: ListLeaveStatusesParams
): Promise<ListLeaveStatusesResult> => {
  const { page, limit, search, status } = params;

  const where: Prisma.ErpHrmLeaveStatusesWhereInput = {
    deleted_at: null,
    ...(status !== undefined ? { status } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpHrmLeaveStatuses.count({ where }),
    prisma.erpHrmLeaveStatuses.findMany({
      where,
      select: leaveStatusSelect,
      orderBy: { id: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ─── Get single leave status ──────────────────────────────────────────────────
export const getLeaveStatusById = async (id: number): Promise<LeaveStatusRecord> => {
  return findActiveLeaveStatusOrThrow(id);
};

// ─── Create leave status ───────────────────────────────────────────────────────
export const createLeaveStatus = async (
  input: CreateLeaveStatusInput,
  actorId?: number
): Promise<LeaveStatusRecord> => {
  await assertNameIsUnique(input.name);

  return prisma.erpHrmLeaveStatuses.create({
    data: {
      name: input.name,
      counts_as_approved: input.counts_as_approved ?? 0,
      status: input.status ?? LEAVE_STATUS_STATUS.ACTIVE,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: leaveStatusSelect,
  });
};

// ─── Update leave status ────────────────────────────────────────────────────────
export const updateLeaveStatus = async (
  id: number,
  input: UpdateLeaveStatusInput,
  actorId?: number
): Promise<LeaveStatusRecord> => {
  await findActiveLeaveStatusOrThrow(id);

  if (input.name !== undefined) {
    await assertNameIsUnique(input.name, id);
  }

  return prisma.erpHrmLeaveStatuses.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.counts_as_approved !== undefined ? { counts_as_approved: input.counts_as_approved } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: leaveStatusSelect,
  });
};

// ─── Delete leave status (soft delete, guarded) ───────────────────────────────
export const deleteLeaveStatus = async (id: number, deletedBy?: number): Promise<void> => {
  await findActiveLeaveStatusOrThrow(id);
  await assertLeaveStatusNotInUse(id);

  await prisma.erpHrmLeaveStatuses.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      status: LEAVE_STATUS_STATUS.INACTIVE,
      updated_at: new Date(),
    },
  });
};