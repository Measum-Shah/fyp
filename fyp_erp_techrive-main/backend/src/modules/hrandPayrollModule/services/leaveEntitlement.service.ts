import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { LEAVE_ENTITLEMENT_STATUS } from "../constants/leaveEntitlement.constants";
import {
  CreateLeaveEntitlementInput,
  UpdateLeaveEntitlementInput,
} from "../validators/leaveEntitlement.validator";

// ─── Shared select ─────────────────────────────────────────────────────────
const leaveEntitlementSelect = {
  id: true,
  employee_id: true,
  leave_type_id: true,
  no_of_days: true,
  days_used: true,
  start_date: true,
  end_date: true,
  credited_date: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpHrmLeaveEntitlementsSelect;

export type LeaveEntitlementRecord = Prisma.ErpHrmLeaveEntitlementsGetPayload<{
  select: typeof leaveEntitlementSelect;
}>;

interface ListLeaveEntitlementsParams {
  page: number;
  limit: number;
  employee_id?: number;
  leave_type_id?: number;
  status?: number;
}

interface ListLeaveEntitlementsResult {
  data: LeaveEntitlementRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertEmployeeExists = async (employee_id: number) => {
  const employee = await prisma.staff.findFirst({
    where: { id: employee_id, deleted_at: null },
    select: { id: true },
  });
  if (!employee) {
    throw AppError.badRequest("Employee does not exist", {
      employee_id: `No employee found with id ${employee_id}`,
    });
  }
};

const assertLeaveTypeExists = async (leave_type_id: number) => {
  const leaveType = await prisma.erpHrmLeaveTypes.findFirst({
    where: { id: leave_type_id, deleted_at: null },
    select: { id: true },
  });
  if (!leaveType) {
    throw AppError.badRequest("Leave type does not exist", {
      leave_type_id: `No leave type found with id ${leave_type_id}`,
    });
  }
};

const findActiveLeaveEntitlementOrThrow = async (id: number): Promise<LeaveEntitlementRecord> => {
  const entitlement = await prisma.erpHrmLeaveEntitlements.findFirst({
    where: { id, deleted_at: null },
    select: leaveEntitlementSelect,
  });

  if (!entitlement) {
    throw AppError.notFound(`Leave entitlement with id ${id} was not found`);
  }

  return entitlement;
};

// ─── List leave entitlements ──────────────────────────────────────────────────
export const listLeaveEntitlements = async (
  params: ListLeaveEntitlementsParams,
  scope?: RecordScope
): Promise<ListLeaveEntitlementsResult> => {
  const { page, limit, employee_id, leave_type_id, status } = params;

  const where: Prisma.ErpHrmLeaveEntitlementsWhereInput = {
    deleted_at: null,
    ...(scope && scope.restrictToEmployeeId !== null
      ? { employee_id: scope.restrictToEmployeeId }
      : employee_id
      ? { employee_id }
      : {}),
    ...(leave_type_id ? { leave_type_id } : {}),
    ...(status !== undefined ? { status } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpHrmLeaveEntitlements.count({ where }),
    prisma.erpHrmLeaveEntitlements.findMany({
      where,
      select: leaveEntitlementSelect,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ─── Get single leave entitlement ─────────────────────────────────────────────
export const getLeaveEntitlementById = async (id: number, scope?: RecordScope): Promise<LeaveEntitlementRecord> => {
  const record = await findActiveLeaveEntitlementOrThrow(id);
  if (scope && !isWithinScope(scope, record.employee_id)) {
    throw AppError.notFound(`Leave entitlement with id ${id} was not found`);
  }
  return record;
};

// ─── Create leave entitlement ─────────────────────────────────────────────────
export const createLeaveEntitlement = async (
  input: CreateLeaveEntitlementInput,
  actorId?: number
): Promise<LeaveEntitlementRecord> => {
  await assertEmployeeExists(input.employee_id);
  await assertLeaveTypeExists(input.leave_type_id);

  return prisma.erpHrmLeaveEntitlements.create({
    data: {
      employee_id: input.employee_id,
      leave_type_id: input.leave_type_id,
      no_of_days: input.no_of_days,
      days_used: input.days_used ?? 0,
      ...(input.start_date !== undefined ? { start_date: new Date(input.start_date) } : {}),
      ...(input.end_date !== undefined ? { end_date: new Date(input.end_date) } : {}),
      ...(input.credited_date !== undefined
        ? { credited_date: new Date(input.credited_date) }
        : {}),
      status: input.status ?? LEAVE_ENTITLEMENT_STATUS.ACTIVE,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: leaveEntitlementSelect,
  });
};

// ─── Update leave entitlement ─────────────────────────────────────────────────
export const updateLeaveEntitlement = async (
  id: number,
  input: UpdateLeaveEntitlementInput,
  actorId?: number
): Promise<LeaveEntitlementRecord> => {
  const existing = await findActiveLeaveEntitlementOrThrow(id);

  if (input.employee_id !== undefined) {
    await assertEmployeeExists(input.employee_id);
  }
  if (input.leave_type_id !== undefined) {
    await assertLeaveTypeExists(input.leave_type_id);
  }

  // The validator only catches days_used > no_of_days when both are sent in
  // the same request — a request that only touches one of them still needs
  // to be checked against whichever value isn't changing.
  const effectiveNoOfDays = input.no_of_days ?? existing.no_of_days;
  const effectiveDaysUsed = input.days_used ?? existing.days_used;
  if (effectiveDaysUsed > effectiveNoOfDays) {
    throw AppError.badRequest("Days used cannot be more than the number of days allocated", {
      days_used: `Days used (${effectiveDaysUsed}) exceeds the ${effectiveNoOfDays} day(s) allocated`,
    });
  }

  return prisma.erpHrmLeaveEntitlements.update({
    where: { id },
    data: {
      ...(input.employee_id !== undefined ? { employee_id: input.employee_id } : {}),
      ...(input.leave_type_id !== undefined ? { leave_type_id: input.leave_type_id } : {}),
      ...(input.no_of_days !== undefined ? { no_of_days: input.no_of_days } : {}),
      ...(input.days_used !== undefined ? { days_used: input.days_used } : {}),
      ...(input.start_date !== undefined ? { start_date: new Date(input.start_date) } : {}),
      ...(input.end_date !== undefined ? { end_date: new Date(input.end_date) } : {}),
      ...(input.credited_date !== undefined
        ? { credited_date: new Date(input.credited_date) }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: leaveEntitlementSelect,
  });
};

// ─── Delete leave entitlement (soft delete) ───────────────────────────────────
export const deleteLeaveEntitlement = async (id: number, deletedBy?: number): Promise<void> => {
  await findActiveLeaveEntitlementOrThrow(id);

  await prisma.erpHrmLeaveEntitlements.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      status: LEAVE_ENTITLEMENT_STATUS.INACTIVE,
      updated_at: new Date(),
    },
  });
};