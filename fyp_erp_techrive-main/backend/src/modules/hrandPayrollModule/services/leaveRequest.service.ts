import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { LEAVE_REQUEST_STATUS } from "../constants/leaveRequest.constants";
import {
  ChangeLeaveRequestStatusInput,
  CreateLeaveRequestInput,
  UpdateLeaveRequestInput,
} from "../validators/leaveRequest.validator";

// ─── Shared select — never leak the excluded legacy multi-day pattern columns ─
const leaveRequestSelect = {
  id: true,
  employee_id: true,
  leave_type_id: true,
  branch_id: true,
  leave_status: true,
  start_date: true,
  end_date: true,
  total_days: true,
  applied_date: true,
  comments: true,
  remarks: true,
  attachment: true,
  single_duration: true,
  single_shift: true,
  single_hours_start: true,
  single_hours_end: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpHrmLeaveRequestsSelect;

export type LeaveRequestRecord = Prisma.ErpHrmLeaveRequestsGetPayload<{
  select: typeof leaveRequestSelect;
}>;

interface ListLeaveRequestsParams {
  page: number;
  limit: number;
  search?: string;
  employee_id?: number;
  leave_type_id?: number;
  leave_status?: number;
  branch_id?: number;
  company_id?: number;
}

interface ListLeaveRequestsResult {
  data: LeaveRequestRecord[];
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

const assertBranchExists = async (branch_id: number) => {
  const branch = await prisma.erpBranches.findFirst({
    where: { id: branch_id, deleted_at: null },
    select: { id: true },
  });
  if (!branch) {
    throw AppError.badRequest("Campus does not exist", {
      branch_id: `No campus found with id ${branch_id}`,
    });
  }
};

const assertLeaveStatusExists = async (leave_status: number) => {
  const status = await prisma.erpHrmLeaveStatuses.findFirst({
    where: { id: leave_status, deleted_at: null },
    select: { id: true },
  });
  if (!status) {
    throw AppError.badRequest("Leave status does not exist", {
      leave_status: `No leave status found with id ${leave_status}. Create one under Leave Statuses first.`,
    });
  }
};

const findActiveLeaveRequestOrThrow = async (id: number): Promise<LeaveRequestRecord> => {
  const request = await prisma.erpHrmLeaveRequests.findFirst({
    where: { id, deleted_at: null },
    select: leaveRequestSelect,
  });

  if (!request) {
    throw AppError.notFound(`Leave request with id ${id} was not found`);
  }

  return request;
};

// ─── List leave requests ──────────────────────────────────────────────────────
export const listLeaveRequests = async (
  params: ListLeaveRequestsParams,
  scope?: RecordScope
): Promise<ListLeaveRequestsResult> => {
  const { page, limit, search, employee_id, leave_type_id, leave_status, branch_id, company_id } = params;

  // If both are given, the branch must actually belong to the company —
  // otherwise a mismatched pair would silently ignore one filter.
  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  // `search` matches against comments/remarks directly, and against the
  // linked employee's name/reg_no via a staff sub-lookup — erp_hrm_leave_requests
  // has no name column of its own to search.
  const matchingEmployeeIds = search
    ? await prisma.staff
        .findMany({
          where: {
            deleted_at: null,
            OR: [
              { first_name: { contains: search, mode: "insensitive" } },
              { last_name: { contains: search, mode: "insensitive" } },
              { reg_no: { contains: search, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        })
        .then((rows) => rows.map((r) => r.id))
    : [];

  const where: Prisma.ErpHrmLeaveRequestsWhereInput = {
    deleted_at: null,
    ...(scope && scope.restrictToEmployeeId !== null
      ? { employee_id: scope.restrictToEmployeeId }
      : employee_id
      ? { employee_id }
      : {}),
    ...(leave_type_id ? { leave_type_id } : {}),
    ...(leave_status ? { leave_status } : {}),
    ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(search
      ? {
          OR: [
            { comments: { contains: search, mode: "insensitive" } },
            { remarks: { contains: search, mode: "insensitive" } },
            ...(matchingEmployeeIds.length > 0
              ? [{ employee_id: { in: matchingEmployeeIds } }]
              : []),
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpHrmLeaveRequests.count({ where }),
    prisma.erpHrmLeaveRequests.findMany({
      where,
      select: leaveRequestSelect,
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

// ─── Get single leave request ─────────────────────────────────────────────────
export const getLeaveRequestById = async (id: number, scope?: RecordScope): Promise<LeaveRequestRecord> => {
  const record = await findActiveLeaveRequestOrThrow(id);
  if (scope && !isWithinScope(scope, record.employee_id)) {
    throw AppError.notFound(`Leave request with id ${id} was not found`);
  }
  return record;
};

// ─── Create leave request ─────────────────────────────────────────────────────
export const createLeaveRequest = async (
  input: CreateLeaveRequestInput,
  actorId?: number
): Promise<LeaveRequestRecord> => {
  await assertEmployeeExists(input.employee_id);
  await assertLeaveTypeExists(input.leave_type_id);
  await assertBranchExists(input.branch_id);
  await assertLeaveStatusExists(input.leave_status);

  return prisma.erpHrmLeaveRequests.create({
    data: {
      employee_id: input.employee_id,
      leave_type_id: input.leave_type_id,
      branch_id: input.branch_id,
      leave_status: input.leave_status,
      start_date: new Date(input.start_date),
      end_date: new Date(input.end_date),
      total_days: input.total_days,
      applied_date: new Date(input.applied_date),
      comments: input.comments,
      remarks: input.remarks,
      attachment: input.attachment,
      single_duration: input.single_duration,
      single_shift: input.single_shift,
      single_hours_start: input.single_hours_start,
      single_hours_end: input.single_hours_end,
      status: input.status ?? LEAVE_REQUEST_STATUS.ACTIVE,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: leaveRequestSelect,
  });
};

// ─── Update leave request ─────────────────────────────────────────────────────
export const updateLeaveRequest = async (
  id: number,
  input: UpdateLeaveRequestInput,
  actorId?: number
): Promise<LeaveRequestRecord> => {
  await findActiveLeaveRequestOrThrow(id);

  if (input.employee_id !== undefined) await assertEmployeeExists(input.employee_id);
  if (input.leave_type_id !== undefined) await assertLeaveTypeExists(input.leave_type_id);
  if (input.branch_id !== undefined) await assertBranchExists(input.branch_id);
  if (input.leave_status !== undefined) await assertLeaveStatusExists(input.leave_status);

  return prisma.erpHrmLeaveRequests.update({
    where: { id },
    data: {
      ...(input.employee_id !== undefined ? { employee_id: input.employee_id } : {}),
      ...(input.leave_type_id !== undefined ? { leave_type_id: input.leave_type_id } : {}),
      ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
      ...(input.leave_status !== undefined ? { leave_status: input.leave_status } : {}),
      ...(input.start_date !== undefined ? { start_date: new Date(input.start_date) } : {}),
      ...(input.end_date !== undefined ? { end_date: new Date(input.end_date) } : {}),
      ...(input.total_days !== undefined ? { total_days: input.total_days } : {}),
      ...(input.applied_date !== undefined ? { applied_date: new Date(input.applied_date) } : {}),
      ...(input.comments !== undefined ? { comments: input.comments } : {}),
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      ...(input.attachment !== undefined ? { attachment: input.attachment } : {}),
      ...(input.single_duration !== undefined ? { single_duration: input.single_duration } : {}),
      ...(input.single_shift !== undefined ? { single_shift: input.single_shift } : {}),
      ...(input.single_hours_start !== undefined
        ? { single_hours_start: input.single_hours_start }
        : {}),
      ...(input.single_hours_end !== undefined
        ? { single_hours_end: input.single_hours_end }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: leaveRequestSelect,
  });
};

/**
 * Dedicated status-change endpoint (used by the Approve/Reject/etc. actions
 * on the Leave Requests table). Kept separate from the generic `update` so
 * the review action always goes through the same leave-status existence
 * check and records `remarks` the same way, regardless of what else a
 * future edit form might send.
 *
 * IMPORTANT — this intentionally does NOT touch erp_hrm_leave_entitlements.
 * There's no DB constraint linking a request to a specific entitlement row,
 * and an employee can have multiple entitlement rows for the same leave
 * type (e.g. across policy years) — auto-decrementing `days_used` here would
 * mean guessing which row to touch, risking silently wrong HR balance data.
 * HR reviews the approved request and updates the entitlement's days_used
 * themselves via the Leave Entitlements page, same as they'd do when
 * granting new leave.
 */
export const changeLeaveRequestStatus = async (
  id: number,
  input: ChangeLeaveRequestStatusInput,
  actorId?: number
): Promise<LeaveRequestRecord> => {
  await findActiveLeaveRequestOrThrow(id);
  await assertLeaveStatusExists(input.leave_status);

  return prisma.erpHrmLeaveRequests.update({
    where: { id },
    data: {
      leave_status: input.leave_status,
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: leaveRequestSelect,
  });
};

// ─── Delete leave request (soft delete) ───────────────────────────────────────
export const deleteLeaveRequest = async (id: number, deletedBy?: number): Promise<void> => {
  await findActiveLeaveRequestOrThrow(id);

  await prisma.erpHrmLeaveRequests.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      status: LEAVE_REQUEST_STATUS.INACTIVE,
      updated_at: new Date(),
    },
  });
};

// ─── Lookup: employees (feeds the Leave Request form's Employee dropdown) ──
// No general-purpose "employees lookup" existed outside employee.service.ts's
// own department/branch/designation/staff-type lookups, so this is a small,
// local one — same id/name/reg_no shape a leave-request table row needs.
export interface EmployeeLookupOption {
  id: number;
  name: string;
  reg_no: string | null;
}

export const listEmployeeLookup = async (): Promise<EmployeeLookupOption[]> => {
  const rows = await prisma.staff.findMany({
    where: { deleted_at: null, status: "Active" },
    select: { id: true, first_name: true, last_name: true, reg_no: true },
    orderBy: { first_name: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ") || `Employee #${row.id}`,
    reg_no: row.reg_no,
  }));
};