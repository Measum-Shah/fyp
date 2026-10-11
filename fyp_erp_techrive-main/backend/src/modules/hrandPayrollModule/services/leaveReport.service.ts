import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { LeaveRequestsReportQuery, LeaveBalancesReportQuery } from "../validators/leaveReport.validator";

// ─── Leave Reports — Service ────────────────────────────────────────────────
// Reads from erp_hrm_leave_requests and erp_hrm_leave_entitlements — the
// tables Leave Management already owns (see leaveRequest.service.ts /
// leaveEntitlement.service.ts). No `@relation` fields exist anywhere in this
// schema, so joins are manual lookup Maps, same pattern as report.service.ts
// uses for department/branch/company.

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

// ─── Leave Requests Report ──────────────────────────────────────────────────
export interface LeaveRequestReportRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  leave_type_id: number;
  leave_type_name: string;
  branch_id: number;
  branch_name: string;
  leave_status_id: number;
  leave_status_name: string;
  start_date: Date;
  end_date: Date;
  total_days: number;
  applied_date: Date;
  comments: string | null;
}

export const getLeaveRequestsReport = async (
  params: LeaveRequestsReportQuery
): Promise<{ data: LeaveRequestReportRow[]; total: number; page: number; limit: number }> => {
  const { page, limit, search, employee_id, leave_type_id, leave_status, branch_id, company_id, from, to } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  // Same "search employee name/reg_no via a staff sub-lookup" approach
  // leaveRequest.service.ts's listLeaveRequests uses — erp_hrm_leave_requests
  // has no name column of its own.
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
    ...(employee_id ? { employee_id } : {}),
    ...(leave_type_id ? { leave_type_id } : {}),
    ...(leave_status ? { leave_status } : {}),
    ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(from || to
      ? {
          start_date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
    ...(search && matchingEmployeeIds.length > 0 ? { employee_id: { in: matchingEmployeeIds } } : {}),
  };

  const [total, requests] = await prisma.$transaction([
    prisma.erpHrmLeaveRequests.count({ where }),
    prisma.erpHrmLeaveRequests.findMany({
      where,
      select: {
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
      },
      orderBy: { start_date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const [employeesById, leaveTypes, leaveStatuses, branches] = await Promise.all([
    loadEmployeeMap(requests.map((r) => r.employee_id)),
    prisma.erpHrmLeaveTypes.findMany({ select: { id: true, name: true } }),
    prisma.erpHrmLeaveStatuses.findMany({ select: { id: true, name: true } }),
    prisma.erpBranches.findMany({ select: { id: true, name: true } }),
  ]);
  const leaveTypesById = new Map(leaveTypes.map((t) => [t.id, t.name]));
  const leaveStatusesById = new Map(leaveStatuses.map((s) => [s.id, s.name]));
  const branchesById = new Map(branches.map((b) => [b.id, b.name]));

  const data: LeaveRequestReportRow[] = requests.map((r) => ({
    id: r.id,
    employee_id: r.employee_id,
    employee_name: employeesById.get(r.employee_id)?.name ?? `Employee #${r.employee_id}`,
    reg_no: employeesById.get(r.employee_id)?.reg_no ?? null,
    leave_type_id: r.leave_type_id,
    leave_type_name: leaveTypesById.get(r.leave_type_id) ?? "—",
    branch_id: r.branch_id,
    branch_name: branchesById.get(r.branch_id) ?? "—",
    leave_status_id: r.leave_status,
    leave_status_name: leaveStatusesById.get(r.leave_status) ?? "—",
    start_date: r.start_date,
    end_date: r.end_date,
    total_days: r.total_days,
    applied_date: r.applied_date,
    comments: r.comments,
  }));

  return { data, total, page, limit };
};

// ─── Leave Balances Report ──────────────────────────────────────────────────
// erp_hrm_leave_entitlements tracks no_of_days (entitled) and days_used
// directly — no need to derive usage from approved leave requests (and, per
// leaveRequest.service.ts's own note, there's no reliable link from a
// request to a specific entitlement row to derive it from anyway).
// `remaining` is simply computed here, not stored.
export interface LeaveBalanceReportRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  leave_type_id: number;
  leave_type_name: string;
  no_of_days: number;
  days_used: number;
  remaining_days: number;
  start_date: Date | null;
  end_date: Date | null;
}

export const getLeaveBalancesReport = async (
  params: LeaveBalancesReportQuery
): Promise<{ data: LeaveBalanceReportRow[]; total: number; page: number; limit: number }> => {
  const { page, limit, employee_id, leave_type_id } = params;

  const where: Prisma.ErpHrmLeaveEntitlementsWhereInput = {
    deleted_at: null,
    ...(employee_id ? { employee_id } : {}),
    ...(leave_type_id ? { leave_type_id } : {}),
  };

  const [total, entitlements] = await prisma.$transaction([
    prisma.erpHrmLeaveEntitlements.count({ where }),
    prisma.erpHrmLeaveEntitlements.findMany({
      where,
      select: {
        id: true,
        employee_id: true,
        leave_type_id: true,
        no_of_days: true,
        days_used: true,
        start_date: true,
        end_date: true,
      },
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const [employeesById, leaveTypes] = await Promise.all([
    loadEmployeeMap(entitlements.map((e) => e.employee_id)),
    prisma.erpHrmLeaveTypes.findMany({ select: { id: true, name: true } }),
  ]);
  const leaveTypesById = new Map(leaveTypes.map((t) => [t.id, t.name]));

  const data: LeaveBalanceReportRow[] = entitlements.map((e) => ({
    id: e.id,
    employee_id: e.employee_id,
    employee_name: employeesById.get(e.employee_id)?.name ?? `Employee #${e.employee_id}`,
    reg_no: employeesById.get(e.employee_id)?.reg_no ?? null,
    leave_type_id: e.leave_type_id,
    leave_type_name: leaveTypesById.get(e.leave_type_id) ?? "—",
    no_of_days: e.no_of_days,
    days_used: e.days_used,
    remaining_days: e.no_of_days - e.days_used,
    start_date: e.start_date,
    end_date: e.end_date,
  }));

  return { data, total, page, limit };
};
