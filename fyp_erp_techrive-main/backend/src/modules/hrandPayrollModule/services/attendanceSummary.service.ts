import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { APPROVED_BY_DEFAULT, APPROVED_STATUS_DEFAULT } from "../constants/attendanceSummary.constants";
import { LEAVE_TYPE_PAY_TYPE } from "../constants/leaveType.constants";
import { dateToTimeString } from "./attendance.service";
import {
  CreateAttendanceSummaryInput,
  SetApprovalInput,
  UpdateAttendanceSummaryInput,
} from "../validators/attendanceSummary.validator";

const summarySelect = {
  id: true,
  branch_id: true,
  staff_id: true,
  month_id: true,
  year_id: true,
  total_absents: true,
  remarks: true,
  pay_status: true,
  approved_status: true,
  approved_by: true,
  approved_by_employee_id: true,
  approved_by_designation_id: true,
  created_by: true,
  updated_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.AttendanceSummarySelect;

type SummaryRow = Prisma.AttendanceSummaryGetPayload<{ select: typeof summarySelect }>;

export interface SummaryEmployee {
  id: number;
  name: string;
  reg_no: string | null;
}

export interface AttendanceSummaryRecord extends SummaryRow {
  employee: SummaryEmployee | null;
  month_title: string | null;
  year_title: string | null;
}

interface ListSummariesParams {
  page: number;
  limit: number;
  staff_id?: number;
  branch_id?: number;
  company_id?: number;
  month_id?: number;
  year_id?: number;
  pay_status?: string;
  approved_status?: string;
}

interface ListSummariesResult {
  data: AttendanceSummaryRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertBranchExists = async (branch_id: number) => {
  const branch = await prisma.erpBranches.findFirst({ where: { id: branch_id, deleted_at: null } });
  if (!branch) {
    throw AppError.badRequest("Campus does not exist", { branch_id: `No campus found with id ${branch_id}` });
  }
};

const findActiveEmployeeOrThrow = async (staff_id: number) => {
  const staff = await prisma.staff.findFirst({
    where: { id: staff_id, deleted_at: null },
    select: { id: true, first_name: true, last_name: true, reg_no: true },
  });
  if (!staff) {
    throw AppError.badRequest("Employee does not exist", { staff_id: `No employee found with id ${staff_id}` });
  }
  return staff;
};

const findMonthOrThrow = async (month_id: number) => {
  const month = await prisma.months.findUnique({ where: { id: month_id } });
  if (!month) {
    throw AppError.badRequest("Month does not exist", { month_id: `No month found with id ${month_id}` });
  }
  return month;
};

const findYearOrThrow = async (year_id: number) => {
  const year = await prisma.years.findUnique({ where: { id: year_id } });
  if (!year) {
    throw AppError.badRequest("Year does not exist", { year_id: `No year found with id ${year_id}` });
  }
  return year;
};

/**
 * One summary per employee per month/year — enforced at the application
 * layer since attendance_summary has no unique constraint at the DB level
 * (same pattern as every other uniqueness check in this codebase).
 */
const assertNoDuplicateForPeriod = async (
  staff_id: number,
  month_id: number,
  year_id: number,
  excludeId?: number
) => {
  const existing = await prisma.attendanceSummary.findFirst({
    where: { staff_id, month_id, year_id, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("An attendance summary already exists for this employee and period", {
      month_id: "A summary already exists for this employee for this month/year",
    });
  }
};

const findSummaryOrThrow = async (id: number): Promise<SummaryRow> => {
  const record = await prisma.attendanceSummary.findUnique({ where: { id }, select: summarySelect });
  if (!record) {
    throw AppError.notFound(`Attendance summary with id ${id} was not found`);
  }
  return record;
};

const staffToSummary = (staff: {
  id: number;
  first_name: string | null;
  last_name: string | null;
  reg_no: string | null;
}): SummaryEmployee => ({
  id: staff.id,
  name: [staff.first_name, staff.last_name].filter(Boolean).join(" ") || `Employee #${staff.id}`,
  reg_no: staff.reg_no,
});

const attachRelated = async (rows: SummaryRow[]): Promise<AttendanceSummaryRecord[]> => {
  const staffIds = [...new Set(rows.map((r) => r.staff_id))];
  const monthIds = [...new Set(rows.map((r) => r.month_id))];
  const yearIds = [...new Set(rows.map((r) => r.year_id))];

  const [staffRows, monthRows, yearRows] = await Promise.all([
    staffIds.length
      ? prisma.staff.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, first_name: true, last_name: true, reg_no: true },
        })
      : Promise.resolve([]),
    monthIds.length ? prisma.months.findMany({ where: { id: { in: monthIds } } }) : Promise.resolve([]),
    yearIds.length ? prisma.years.findMany({ where: { id: { in: yearIds } } }) : Promise.resolve([]),
  ]);

  const staffById = new Map(staffRows.map((s) => [s.id, staffToSummary(s)]));
  const monthById = new Map(monthRows.map((m) => [m.id, m.title]));
  const yearById = new Map(yearRows.map((y) => [y.id, y.title]));

  return rows.map((row) => ({
    ...row,
    employee: staffById.get(row.staff_id) ?? null,
    month_title: monthById.get(row.month_id) ?? null,
    year_title: yearById.get(row.year_id) ?? null,
  }));
};

const attachOneRelated = async (row: SummaryRow): Promise<AttendanceSummaryRecord> => {
  const [staff, month, year] = await Promise.all([
    prisma.staff.findUnique({
      where: { id: row.staff_id },
      select: { id: true, first_name: true, last_name: true, reg_no: true },
    }),
    prisma.months.findUnique({ where: { id: row.month_id } }),
    prisma.years.findUnique({ where: { id: row.year_id } }),
  ]);

  return {
    ...row,
    employee: staff ? staffToSummary(staff) : null,
    month_title: month?.title ?? null,
    year_title: year?.title ?? null,
  };
};

// ─── List summaries ────────────────────────────────────────────────────────────
export const listAttendanceSummaries = async (
  params: ListSummariesParams,
  scope?: RecordScope
): Promise<ListSummariesResult> => {
  const { page, limit, staff_id, branch_id, company_id, month_id, year_id, pay_status, approved_status } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.AttendanceSummaryWhereInput = {
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id !== undefined
      ? { staff_id }
      : {}),
    ...(branch_id !== undefined ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(month_id !== undefined ? { month_id } : {}),
    ...(year_id !== undefined ? { year_id } : {}),
    ...(pay_status !== undefined ? { pay_status } : {}),
    ...(approved_status !== undefined ? { approved_status } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.attendanceSummary.count({ where }),
    prisma.attendanceSummary.findMany({
      where,
      select: summarySelect,
      orderBy: [{ year_id: "desc" }, { month_id: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: await attachRelated(rows),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

export const getAttendanceSummaryById = async (id: number, scope?: RecordScope): Promise<AttendanceSummaryRecord> => {
  const row = await findSummaryOrThrow(id);
  if (scope && !isWithinScope(scope, row.staff_id)) {
    throw AppError.notFound(`Attendance summary with id ${id} was not found`);
  }
  return attachOneRelated(row);
};

export const createAttendanceSummary = async (
  input: CreateAttendanceSummaryInput,
  actorId?: number
): Promise<AttendanceSummaryRecord> => {
  await findActiveEmployeeOrThrow(input.staff_id);
  await assertBranchExists(input.branch_id);
  await findMonthOrThrow(input.month_id);
  await findYearOrThrow(input.year_id);
  await assertNoDuplicateForPeriod(input.staff_id, input.month_id, input.year_id);

  const row = await prisma.attendanceSummary.create({
    data: {
      branch_id: input.branch_id,
      staff_id: input.staff_id,
      month_id: input.month_id,
      year_id: input.year_id,
      total_absents: input.total_absents ?? 0,
      remarks: input.remarks ?? null,
      pay_status: input.pay_status,
      approved_status: APPROVED_STATUS_DEFAULT,
      approved_by: APPROVED_BY_DEFAULT,
      created_by: actorId ?? 0,
      updated_by: actorId ?? 0,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: summarySelect,
  });

  return attachOneRelated(row);
};

export const updateAttendanceSummary = async (
  id: number,
  input: UpdateAttendanceSummaryInput,
  actorId?: number
): Promise<AttendanceSummaryRecord> => {
  await findSummaryOrThrow(id);

  const row = await prisma.attendanceSummary.update({
    where: { id },
    data: {
      ...(input.total_absents !== undefined ? { total_absents: input.total_absents } : {}),
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      ...(input.pay_status !== undefined ? { pay_status: input.pay_status } : {}),
      updated_by: actorId ?? 0,
      updated_at: new Date(),
    },
    select: summarySelect,
  });

  return attachOneRelated(row);
};

/**
 * Approver Name / Approver Designation must reference a real, active
 * employee and a real, non-deleted designation respectively — same rule as
 * resignation.service.ts#assertApproverEmployeeExists /
 * #assertApproverDesignationExists. The legacy free-text `approved_by`
 * column is still populated (with the selected employee's display name)
 * for backward compatibility with anything that still reads it as text.
 */
export const setAttendanceSummaryApproval = async (
  id: number,
  input: SetApprovalInput,
  actorId?: number
): Promise<AttendanceSummaryRecord> => {
  await findSummaryOrThrow(id);

  const employee = await prisma.staff.findFirst({
    where: { id: input.approved_by_employee_id, deleted_at: null },
    select: { id: true, first_name: true, last_name: true },
  });
  if (!employee) {
    throw AppError.badRequest("Selected approver does not exist or is inactive", {
      approved_by_employee_id: `No active employee found with id ${input.approved_by_employee_id}`,
    });
  }

  const designation = await prisma.designation.findFirst({
    where: { id: input.approved_by_designation_id, deleted_at: null },
    select: { id: true },
  });
  if (!designation) {
    throw AppError.badRequest("Selected approver designation does not exist", {
      approved_by_designation_id: `No designation found with id ${input.approved_by_designation_id}`,
    });
  }

  const approverName =
    [employee.first_name, employee.last_name].filter(Boolean).join(" ") || `Employee #${employee.id}`;

  const row = await prisma.attendanceSummary.update({
    where: { id },
    data: {
      approved_status: input.approved_status,
      approved_by: approverName,
      approved_by_employee_id: input.approved_by_employee_id,
      approved_by_designation_id: input.approved_by_designation_id,
      updated_by: actorId ?? 0,
      updated_at: new Date(),
    },
    select: summarySelect,
  });

  return attachOneRelated(row);
};

// attendance_summary has no deleted_at column (same situation as
// erp_holidays) so deletion is a genuine hard delete — see
// holiday.constants.ts for the fuller reasoning behind this pattern.
export const deleteAttendanceSummary = async (id: number): Promise<void> => {
  await findSummaryOrThrow(id);
  await prisma.attendanceSummary.delete({ where: { id } });
};

// ─── Detail view (View button): full-month daily breakdown + leave stats ───
// month_id/year_id on this table point at the Months/Years lookups, not a
// calendar date range directly — Months is a free-text title lookup (no
// numeric month column) so we resolve the month index by matching its
// title against the canonical month-name list, exactly how it was seeded
// (seed.ts's monthNames). Years.id IS the calendar year itself (see
// year.service.ts#createYear: `id: input.year`), so no lookup is needed
// there.
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface AttendanceSummaryDayDetail {
  date: string; // "YYYY-MM-DD"
  day_name: string;
  status_id: number | null;
  status_title: string | null;
  status_display_class: string | null;
  time_in: string | null;
  time_out: string | null;
  remarks: string | null;
}

export interface AttendanceSummaryLeaveStats {
  total_leave_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
}

export interface AttendanceSummaryDetail {
  summary: AttendanceSummaryRecord;
  days: AttendanceSummaryDayDetail[];
  leave_stats: AttendanceSummaryLeaveStats;
}

export const getAttendanceSummaryDetail = async (
  id: number,
  scope?: RecordScope
): Promise<AttendanceSummaryDetail> => {
  const row = await findSummaryOrThrow(id);
  if (scope && !isWithinScope(scope, row.staff_id)) {
    throw AppError.notFound(`Attendance summary with id ${id} was not found`);
  }
  const summary = await attachOneRelated(row);

  const emptyResult: AttendanceSummaryDetail = {
    summary,
    days: [],
    leave_stats: { total_leave_days: 0, paid_leave_days: 0, unpaid_leave_days: 0 },
  };

  const month = await prisma.months.findUnique({ where: { id: row.month_id }, select: { title: true } });
  const monthIndex = month
    ? MONTH_NAMES.findIndex((m) => m.toLowerCase() === (month.title ?? "").trim().toLowerCase())
    : -1;
  if (monthIndex === -1) return emptyResult;

  const year = row.year_id;
  const periodStart = new Date(Date.UTC(year, monthIndex, 1));
  const periodEnd = new Date(Date.UTC(year, monthIndex + 1, 0)); // last calendar day of the month
  const daysInMonth = periodEnd.getUTCDate();

  // ─── Daily attendance rows (employee_attendance, one row per day) ──────
  const attendanceRows = await prisma.employeeAttendance.findMany({
    where: {
      employee_id: row.staff_id,
      deleted_at: null,
      attendance_date: { gte: periodStart, lte: periodEnd },
    },
    select: { attendance_date: true, status: true, timeIn: true, timeOut: true, remarks: true },
  });

  const statusIds = [...new Set(attendanceRows.map((r) => r.status))];
  const statusRows = statusIds.length
    ? await prisma.erpAttendanceStatuses.findMany({
        where: { id: { in: statusIds } },
        select: { id: true, title: true, display_class: true },
      })
    : [];
  const statusById = new Map(statusRows.map((s) => [s.id, s]));
  const byDate = new Map(
    attendanceRows
      .filter((r) => r.attendance_date !== null)
      .map((r) => [(r.attendance_date as Date).toISOString().slice(0, 10), r])
  );

  const days: AttendanceSummaryDayDetail[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(Date.UTC(year, monthIndex, d));
    const iso = date.toISOString().slice(0, 10);
    const record = byDate.get(iso);
    const status = record ? statusById.get(record.status) : undefined;
    days.push({
      date: iso,
      day_name: WEEKDAY_NAMES[date.getUTCDay()] ?? "",
      status_id: record?.status ?? null,
      status_title: status?.title ?? null,
      status_display_class: status?.display_class ?? null,
      time_in: record ? dateToTimeString(record.timeIn) : null,
      time_out: record ? dateToTimeString(record.timeOut) : null,
      remarks: record?.remarks ?? null,
    });
  }

  // ─── Leave stats: approved leave requests overlapping this month ───────
  // Same "counts_as_approved" / "pay_type" resolution payrollRun.service.ts's
  // computeLeaveDeduction() uses, since neither leave_status nor leave_type
  // is inferable from its name alone (both are free-text admin lookups).
  const approvedStatusIds = (
    await prisma.erpHrmLeaveStatuses.findMany({
      where: { deleted_at: null, counts_as_approved: 1 },
      select: { id: true },
    })
  ).map((s) => s.id);

  let total_leave_days = 0;
  let paid_leave_days = 0;
  let unpaid_leave_days = 0;

  if (approvedStatusIds.length > 0) {
    const leaveRequests = await prisma.erpHrmLeaveRequests.findMany({
      where: {
        employee_id: row.staff_id,
        deleted_at: null,
        leave_status: { in: approvedStatusIds },
        start_date: { lte: periodEnd },
        end_date: { gte: periodStart },
      },
      select: { start_date: true, end_date: true, leave_type_id: true },
    });

    const leaveTypeIds = [...new Set(leaveRequests.map((r) => r.leave_type_id))];
    const leaveTypeRows = leaveTypeIds.length
      ? await prisma.erpHrmLeaveTypes.findMany({
          where: { id: { in: leaveTypeIds } },
          select: { id: true, pay_type: true },
        })
      : [];
    const payTypeById = new Map(leaveTypeRows.map((t) => [t.id, t.pay_type]));

    for (const request of leaveRequests) {
      const from = request.start_date < periodStart ? periodStart : request.start_date;
      const to = request.end_date > periodEnd ? periodEnd : request.end_date;
      const dayCount = Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY) + 1;
      if (dayCount <= 0) continue;

      total_leave_days += dayCount;
      if (payTypeById.get(request.leave_type_id) === LEAVE_TYPE_PAY_TYPE.UNPAID) {
        unpaid_leave_days += dayCount;
      } else {
        paid_leave_days += dayCount;
      }
    }
  }

  return { summary, days, leave_stats: { total_leave_days, paid_leave_days, unpaid_leave_days } };
};