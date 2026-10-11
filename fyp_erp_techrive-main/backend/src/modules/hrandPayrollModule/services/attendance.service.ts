import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { ATTENDANCE_MACHINE_STATUS } from "../constants/attendance.constants";
import { CreateAttendanceInput, UpdateAttendanceInput } from "../validators/attendance.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const attendanceSelect = {
  id: true,
  branch_id: true,
  employee_id: true,
  attendance_date: true,
  status: true,
  timeIn: true,
  timeOut: true,
  remarks: true,
  comment: true,
  machine_status: true,
  approve_reject_by: true,
  created_by: true,
  updated_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.EmployeeAttendanceSelect;

type AttendanceRow = Prisma.EmployeeAttendanceGetPayload<{ select: typeof attendanceSelect }>;

export interface EmployeeSummary {
  id: number;
  name: string;
  reg_no: string | null;
}

export interface AttendanceRecord extends AttendanceRow {
  employee: EmployeeSummary | null;
}

interface ListAttendanceParams {
  page: number;
  limit: number;
  employee_id?: number;
  branch_id?: number;
  company_id?: number;
  status?: number;
  start_date?: string;
  end_date?: string;
}

interface ListAttendanceResult {
  data: AttendanceRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Time <-> string helpers ─────────────────────────────────────────────────
// employee_attendance.timeIn/timeOut are @db.Time(6) columns — same
// anchored-UTC-date round-trip approach as workShift.service.ts's
// timeStringToDate/dateToTimeString.
const timeStringToDate = (hhmm: string): Date => new Date(`1970-01-01T${hhmm}:00.000Z`);

const dateToTimeString = (value: Date | null): string | null => {
  if (!value) return null;
  return value.toISOString().slice(11, 16);
};

// ─── Employee lookups ────────────────────────────────────────────────────────

const staffToSummary = (staff: {
  id: number;
  first_name: string | null;
  last_name: string | null;
  reg_no: string | null;
}): EmployeeSummary => ({
  id: staff.id,
  name: [staff.first_name, staff.last_name].filter(Boolean).join(" ") || `Employee #${staff.id}`,
  reg_no: staff.reg_no,
});

const findActiveEmployeeOrThrow = async (employee_id: number) => {
  const staff = await prisma.staff.findFirst({
    where: { id: employee_id, deleted_at: null },
    select: { id: true, first_name: true, last_name: true, reg_no: true, branch_id: true },
  });

  if (!staff) {
    throw AppError.badRequest("Employee does not exist", {
      employee_id: `No employee found with id ${employee_id}`,
    });
  }

  return staff;
};

const assertBranchExists = async (branch_id: number) => {
  const branch = await prisma.erpBranches.findFirst({ where: { id: branch_id, deleted_at: null } });
  if (!branch) {
    throw AppError.badRequest("Campus does not exist", {
      branch_id: `No campus found with id ${branch_id}`,
    });
  }
};

const assertAttendanceStatusExists = async (status: number) => {
  const record = await prisma.erpAttendanceStatuses.findFirst({ where: { id: status } });
  if (!record) {
    throw AppError.badRequest("Attendance status does not exist", {
      status: `No attendance status found with id ${status}`,
    });
  }
};

/**
 * One attendance record per employee per day — enforced at the application
 * layer since employee_attendance has no unique constraint at the DB level
 * (same pattern as every other uniqueness check in this codebase).
 */
const assertNoDuplicateForDay = async (
  employee_id: number,
  attendance_date: string,
  excludeId?: number
) => {
  const existing = await prisma.employeeAttendance.findFirst({
    where: {
      employee_id,
      attendance_date: new Date(`${attendance_date}T00:00:00.000Z`),
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("This employee already has an attendance record for this date", {
      attendance_date: "An attendance record already exists for this employee on this date",
    });
  }
};

const findAttendanceOrThrow = async (id: number): Promise<AttendanceRow> => {
  const record = await prisma.employeeAttendance.findFirst({
    where: { id, deleted_at: null },
    select: attendanceSelect,
  });

  if (!record) {
    throw AppError.notFound(`Attendance record with id ${id} was not found`);
  }

  return record;
};

const attachEmployeeSummaries = async (rows: AttendanceRow[]): Promise<AttendanceRecord[]> => {
  const employeeIds = [...new Set(rows.map((r) => r.employee_id).filter((id): id is number => id !== null))];

  const staffRows =
    employeeIds.length > 0
      ? await prisma.staff.findMany({
          where: { id: { in: employeeIds } },
          select: { id: true, first_name: true, last_name: true, reg_no: true },
        })
      : [];

  const byId = new Map(staffRows.map((s) => [s.id, staffToSummary(s)]));

  return rows.map((row) => ({
    ...row,
    employee: row.employee_id !== null ? byId.get(row.employee_id) ?? null : null,
  }));
};

const attachEmployeeSummary = async (row: AttendanceRow): Promise<AttendanceRecord> => {
  if (row.employee_id === null) {
    return { ...row, employee: null };
  }

  const staff = await prisma.staff.findUnique({
    where: { id: row.employee_id },
    select: { id: true, first_name: true, last_name: true, reg_no: true },
  });

  return { ...row, employee: staff ? staffToSummary(staff) : null };
};

// ─── List attendance records ──────────────────────────────────────────────────
export const listAttendance = async (
  params: ListAttendanceParams,
  scope?: RecordScope
): Promise<ListAttendanceResult> => {
  const { page, limit, employee_id, branch_id, company_id, status, start_date, end_date } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.EmployeeAttendanceWhereInput = {
    deleted_at: null,
    // Self-scoped callers get their own employee_id forced regardless of
    // whatever employee_id they passed as a query param — that param is
    // meant for an HR/admin filtering the full list, not a way for a
    // self-service account to ask for someone else's attendance.
    ...(scope && scope.restrictToEmployeeId !== null
      ? { employee_id: scope.restrictToEmployeeId }
      : employee_id !== undefined
      ? { employee_id }
      : {}),
    ...(branch_id !== undefined ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(start_date || end_date
      ? {
          attendance_date: {
            ...(start_date ? { gte: new Date(`${start_date}T00:00:00.000Z`) } : {}),
            ...(end_date ? { lte: new Date(`${end_date}T00:00:00.000Z`) } : {}),
          },
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.employeeAttendance.count({ where }),
    prisma.employeeAttendance.findMany({
      where,
      select: attendanceSelect,
      orderBy: [{ attendance_date: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: await attachEmployeeSummaries(rows),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

// ─── Get single attendance record ────────────────────────────────────────────
export const getAttendanceById = async (id: number, scope?: RecordScope): Promise<AttendanceRecord> => {
  const row = await findAttendanceOrThrow(id);
  if (scope && !isWithinScope(scope, row.employee_id)) {
    throw AppError.notFound(`Attendance record with id ${id} was not found`);
  }
  return attachEmployeeSummary(row);
};

// ─── Create attendance record ─────────────────────────────────────────────────
export const createAttendance = async (
  input: CreateAttendanceInput,
  actorId?: number
): Promise<AttendanceRecord> => {
  const employee = await findActiveEmployeeOrThrow(input.employee_id);
  await assertAttendanceStatusExists(input.status);
  await assertNoDuplicateForDay(input.employee_id, input.attendance_date);

  // branch_id defaults to the employee's own branch when not explicitly
  // provided — the employee already carries a real branch_id, so this
  // avoids asking the person to re-select something already on record.
  const branch_id = input.branch_id ?? employee.branch_id;
  if (input.branch_id !== undefined) {
    await assertBranchExists(input.branch_id);
  }

  const row = await prisma.employeeAttendance.create({
    data: {
      employee_id: input.employee_id,
      branch_id,
      attendance_date: new Date(`${input.attendance_date}T00:00:00.000Z`),
      status: input.status,
      timeIn: input.timeIn ? timeStringToDate(input.timeIn) : null,
      timeOut: input.timeOut ? timeStringToDate(input.timeOut) : null,
      remarks: input.remarks ?? null,
      comment: input.comment ?? null,
      machine_status: ATTENDANCE_MACHINE_STATUS.MANUAL,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: attendanceSelect,
  });

  return attachEmployeeSummary(row);
};

// ─── Update attendance record ─────────────────────────────────────────────────
export const updateAttendance = async (
  id: number,
  input: UpdateAttendanceInput,
  actorId?: number
): Promise<AttendanceRecord> => {
  const existing = await findAttendanceOrThrow(id);

  if (input.status !== undefined) {
    await assertAttendanceStatusExists(input.status);
  }
  if (input.branch_id !== undefined) {
    await assertBranchExists(input.branch_id);
  }
  if (input.attendance_date !== undefined && existing.employee_id !== null) {
    await assertNoDuplicateForDay(existing.employee_id, input.attendance_date, id);
  }

  const row = await prisma.employeeAttendance.update({
    where: { id },
    data: {
      ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
      ...(input.attendance_date !== undefined
        ? { attendance_date: new Date(`${input.attendance_date}T00:00:00.000Z`) }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.timeIn !== undefined ? { timeIn: timeStringToDate(input.timeIn) } : {}),
      ...(input.timeOut !== undefined ? { timeOut: timeStringToDate(input.timeOut) } : {}),
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      ...(input.comment !== undefined ? { comment: input.comment } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: attendanceSelect,
  });

  return attachEmployeeSummary(row);
};

/**
 * approve_reject_by only records WHO reviewed a record — there's no paired
 * column recording an approved/rejected outcome (confirmed against the raw
 * SQL: employee_attendance has no such column). Rather than invent a
 * decision this schema doesn't actually store, this treats the column
 * honestly as "reviewed by" — set to the acting user's id when marking a
 * record reviewed, cleared back to null to un-mark it.
 */
export const setAttendanceReviewStatus = async (
  id: number,
  reviewed: boolean,
  actorId?: number
): Promise<AttendanceRecord> => {
  await findAttendanceOrThrow(id);

  const row = await prisma.employeeAttendance.update({
    where: { id },
    data: {
      approve_reject_by: reviewed ? actorId ?? null : null,
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: attendanceSelect,
  });

  return attachEmployeeSummary(row);
};

// ─── Delete attendance record (soft delete) ──────────────────────────────────
export const deleteAttendance = async (id: number, deletedBy?: number): Promise<void> => {
  await findAttendanceOrThrow(id);

  await prisma.employeeAttendance.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      updated_at: new Date(),
    },
  });
};

export { dateToTimeString };