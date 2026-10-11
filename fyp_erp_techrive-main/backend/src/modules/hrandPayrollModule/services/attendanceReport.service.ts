import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import {
  AttendanceRecordsReportQuery,
  AttendanceSummaryReportQuery,
} from "../validators/attendanceReport.validator";

// ─── Attendance Reports — Service ───────────────────────────────────────────
// Reads from employee_attendance and attendance_summary — the tables
// Attendance already owns (see attendance.service.ts / attendanceSummary
// .service.ts). No `@relation` fields exist anywhere in this schema, so
// joins are manual lookup Maps, same pattern as every other report in this
// module.

interface EmployeeLookup {
  id: number;
  name: string;
  reg_no: string | null;
}

const loadEmployeeMap = async (employeeIds: number[]): Promise<Map<number, EmployeeLookup>> => {
  const rows = await prisma.staff.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, first_name: true, last_name: true, reg_no: true },
  });
  return new Map(
    rows.map((r) => [
      r.id,
      { id: r.id, name: [r.first_name, r.last_name].filter(Boolean).join(" ") || `Employee #${r.id}`, reg_no: r.reg_no },
    ])
  );
};

const loadBranchMap = async (): Promise<Map<number, string>> => {
  const rows = await prisma.erpBranches.findMany({ select: { id: true, name: true } });
  return new Map(rows.map((b) => [b.id, b.name]));
};

// ─── Attendance Records Report ──────────────────────────────────────────────
export interface AttendanceRecordReportRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  branch_id: number | null;
  branch_name: string;
  attendance_date: Date | null;
  status_id: number;
  status_title: string;
  time_in: string | null;
  time_out: string | null;
  remarks: string | null;
}

export const getAttendanceRecordsReport = async (
  params: AttendanceRecordsReportQuery
): Promise<{ data: AttendanceRecordReportRow[]; total: number; page: number; limit: number }> => {
  const { page, limit, employee_id, branch_id, company_id, status, from, to } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.EmployeeAttendanceWhereInput = {
    deleted_at: null,
    ...(employee_id ? { employee_id } : {}),
    ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          attendance_date: {
            ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
            ...(to ? { lte: new Date(`${to}T00:00:00.000Z`) } : {}),
          },
        }
      : {}),
  };

  const [total, records] = await prisma.$transaction([
    prisma.employeeAttendance.count({ where }),
    prisma.employeeAttendance.findMany({
      where,
      select: {
        id: true,
        employee_id: true,
        branch_id: true,
        attendance_date: true,
        status: true,
        timeIn: true,
        timeOut: true,
        remarks: true,
      },
      orderBy: [{ attendance_date: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const employeeIds = [...new Set(records.map((r) => r.employee_id).filter((id): id is number => id !== null))];

  const [employeesById, branchesById, statuses] = await Promise.all([
    loadEmployeeMap(employeeIds),
    loadBranchMap(),
    prisma.erpAttendanceStatuses.findMany({ select: { id: true, title: true } }),
  ]);
  const statusesById = new Map(statuses.map((s) => [s.id, s.title]));

  // employee_attendance.timeIn/timeOut are @db.Time(6) columns anchored to
  // 1970-01-01 in UTC — same round-trip approach attendance.service.ts's
  // dateToTimeString() uses, duplicated here since that helper isn't
  // exported for reuse outside the module (it's a private-ish detail of
  // how this one column type is stored).
  const toTimeString = (value: Date | null): string | null =>
    value ? value.toISOString().slice(11, 16) : null;

  const data: AttendanceRecordReportRow[] = records.map((r) => ({
    id: r.id,
    employee_id: r.employee_id ?? 0,
    employee_name: r.employee_id != null ? employeesById.get(r.employee_id)?.name ?? `Employee #${r.employee_id}` : "—",
    reg_no: r.employee_id != null ? employeesById.get(r.employee_id)?.reg_no ?? null : null,
    branch_id: r.branch_id,
    branch_name: r.branch_id != null ? branchesById.get(r.branch_id) ?? "—" : "—",
    attendance_date: r.attendance_date,
    status_id: r.status,
    status_title: statusesById.get(r.status) ?? "—",
    time_in: toTimeString(r.timeIn),
    time_out: toTimeString(r.timeOut),
    remarks: r.remarks,
  }));

  return { data, total, page, limit };
};

// ─── Attendance Summary Report ──────────────────────────────────────────────
// attendance_summary is a manually-entered monthly rollup (total absences,
// pay status, approval status per employee per month) — not a computed
// aggregate over employee_attendance's daily rows. This report surfaces
// that table as-is, same relationship Leave Balances has to
// erp_hrm_leave_entitlements (report on the source-of-truth table, don't
// re-derive it from a different one).
export interface AttendanceSummaryReportRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  branch_id: number;
  branch_name: string;
  month_id: number;
  month_title: string;
  year_id: number;
  year_title: string;
  total_absents: number | null;
  pay_status: string;
  approved_status: string | null;
}

export const getAttendanceSummaryReport = async (
  params: AttendanceSummaryReportQuery
): Promise<{ data: AttendanceSummaryReportRow[]; total: number; page: number; limit: number }> => {
  const { page, limit, staff_id, branch_id, company_id, month_id, year_id, pay_status, approved_status } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const summaryCompanyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.AttendanceSummaryWhereInput = {
    ...(staff_id ? { staff_id } : {}),
    ...(branch_id ? { branch_id } : summaryCompanyBranchIds ? { branch_id: { in: summaryCompanyBranchIds } } : {}),
    ...(month_id ? { month_id } : {}),
    ...(year_id ? { year_id } : {}),
    ...(pay_status ? { pay_status } : {}),
    ...(approved_status ? { approved_status } : {}),
  };

  const [total, summaries] = await prisma.$transaction([
    prisma.attendanceSummary.count({ where }),
    prisma.attendanceSummary.findMany({
      where,
      select: {
        id: true,
        staff_id: true,
        branch_id: true,
        month_id: true,
        year_id: true,
        total_absents: true,
        pay_status: true,
        approved_status: true,
      },
      orderBy: [{ year_id: "desc" }, { month_id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const [employeesById, branchesById, months, years] = await Promise.all([
    loadEmployeeMap(summaries.map((s) => s.staff_id)),
    loadBranchMap(),
    prisma.months.findMany({ select: { id: true, title: true } }),
    prisma.years.findMany({ select: { id: true, title: true } }),
  ]);
  const monthsById = new Map(months.map((m) => [m.id, m.title]));
  const yearsById = new Map(years.map((y) => [y.id, y.title]));

  const data: AttendanceSummaryReportRow[] = summaries.map((s) => ({
    id: s.id,
    employee_id: s.staff_id,
    employee_name: employeesById.get(s.staff_id)?.name ?? `Employee #${s.staff_id}`,
    reg_no: employeesById.get(s.staff_id)?.reg_no ?? null,
    branch_id: s.branch_id,
    branch_name: branchesById.get(s.branch_id) ?? "—",
    month_id: s.month_id,
    month_title: monthsById.get(s.month_id) ?? "—",
    year_id: s.year_id,
    year_title: yearsById.get(s.year_id) ?? "—",
    total_absents: s.total_absents,
    pay_status: s.pay_status,
    approved_status: s.approved_status,
  }));

  return { data, total, page, limit };
};
