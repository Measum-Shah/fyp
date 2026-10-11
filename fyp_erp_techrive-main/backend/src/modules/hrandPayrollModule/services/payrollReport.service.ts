import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { REPORT_MAX_ROWS } from "../constants/report.constants";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { LOAN_REQUEST_STATUS } from "../constants/loanRequest.constants";
import {
  GrossSalaryQuery,
  LoanRegisterQuery,
  PayrollRunSummaryQuery,
  SalaryRegisterQuery,
  SalarySlipsQuery,
} from "../validators/payrollReport.validator";

// ─── Payroll Reports — Service ──────────────────────────────────────────────
// Reads from payroll_employees, erp_staff_salaries and request_loan_employee
// — the tables Payroll & Salary already owns (see payrollRun.service.ts /
// salary.service.ts / loan.service.ts). No `@relation` fields exist anywhere
// in this schema, so joins are manual lookup Maps, same as every other
// report in this module.

interface StaffLookup {
  id: number;
  name: string;
  reg_no: string | null;
}

const loadStaffMap = async (staffIds: number[]): Promise<Map<number, StaffLookup>> => {
  const rows = await prisma.staff.findMany({
    where: { id: { in: staffIds } },
    select: { id: true, first_name: true, last_name: true, reg_no: true },
  });
  return new Map(
    rows.map((r) => [
      r.id,
      { id: r.id, name: [r.first_name, r.last_name].filter(Boolean).join(" ") || `Staff #${r.id}`, reg_no: r.reg_no },
    ])
  );
};

const loadBranchMap = async (): Promise<Map<number, string>> => {
  const rows = await prisma.erpBranches.findMany({ select: { id: true, name: true } });
  return new Map(rows.map((b) => [b.id, b.name]));
};

// month_year ("YYYY-MM") ⇄ erp_staff_salaries' month_id/year_id — same split
// payrollRun.service.ts's splitMonthYear() does, duplicated here rather than
// imported since payrollRun.service.ts doesn't export it (it's a private
// helper there) and this is a one-line pure function, not worth a shared
// util module for.
const splitMonthYear = (monthYear: string): { month_id: string; year_id: number } => {
  const [year, month] = monthYear.split("-");
  return { month_id: month ?? "", year_id: Number(year ?? "") };
};

// ─── Payroll Run Summary Report ─────────────────────────────────────────────
// One row per (branch, month_year) run — employee count plus aggregated
// totals pulled from erp_staff_salaries. There's no FK between
// payroll_employees and erp_staff_salaries (matched by staff_id + branch_id
// + month_id/year_id, same as listRunMembers() does in payrollRun.service.ts)
// so the aggregation happens here in JS rather than a SQL GROUP BY join.
export interface PayrollRunSummaryRow {
  branch_id: number;
  branch_name: string;
  month_year: string;
  employee_count: number;
  total_gross: number;
  total_net: number;
  total_deductions: number;
}

export const getPayrollRunSummaryReport = async (
  params: PayrollRunSummaryQuery
): Promise<{ data: PayrollRunSummaryRow[]; totalRuns: number }> => {
  const { branch_id, company_id, month_year } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const runMembers = await prisma.payrollEmployees.findMany({
    where: {
      deleted_at: null,
      ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
      ...(month_year ? { month_year } : {}),
    },
    select: { branch_id: true, month_year: true, employee_id: true },
    take: REPORT_MAX_ROWS,
  });

  // Group members by branch_id + month_year.
  const groups = new Map<string, { branch_id: number; month_year: string; employeeIds: number[] }>();
  for (const m of runMembers) {
    const key = `${m.branch_id}:${m.month_year}`;
    const group = groups.get(key) ?? { branch_id: m.branch_id, month_year: m.month_year, employeeIds: [] };
    group.employeeIds.push(m.employee_id);
    groups.set(key, group);
  }

  const branchesById = await loadBranchMap();

  const data: PayrollRunSummaryRow[] = await Promise.all(
    Array.from(groups.values()).map(async (group) => {
      const { month_id, year_id } = splitMonthYear(group.month_year);
      const sheets = await prisma.erpStaffSalaries.findMany({
        where: {
          staff_id: { in: group.employeeIds },
          branch_id: group.branch_id,
          month_id,
          year_id,
          deleted_at: null,
        },
        select: { gross_salary: true, net_salary: true },
      });

      const total_gross = sheets.reduce((sum, s) => sum + (s.gross_salary ?? 0), 0);
      const total_net = sheets.reduce((sum, s) => sum + (s.net_salary ?? 0), 0);

      return {
        branch_id: group.branch_id,
        branch_name: branchesById.get(group.branch_id) ?? "—",
        month_year: group.month_year,
        employee_count: group.employeeIds.length,
        total_gross,
        total_net,
        total_deductions: total_gross - total_net,
      };
    })
  );

  data.sort((a, b) => b.month_year.localeCompare(a.month_year) || a.branch_name.localeCompare(b.branch_name));

  return { data, totalRuns: data.length };
};

// ─── Salary Register Report ─────────────────────────────────────────────────
export interface SalaryRegisterRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  branch_id: number;
  branch_name: string;
  month_id: string | null;
  year_id: number | null;
  gross_salary: number;
  basic_salary: number | null;
  medical_allowance: string;
  house_rent_allowance: string;
  conveyance_allowance: number | null;
  eobi_amount: number | null;
  epf_amount: number | null;
  tax_amount: number | null;
  loan_amount: number | null;
  net_salary: number | null;
  salary_status: string;
}

export const getSalaryRegisterReport = async (
  params: SalaryRegisterQuery
): Promise<{ data: SalaryRegisterRow[]; total: number; page: number; limit: number }> => {
  const { page, limit, search, staff_id, branch_id, company_id, month_id, year_id, salary_status } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const matchingStaffIds = search
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

  const where: Prisma.ErpStaffSalariesWhereInput = {
    deleted_at: null,
    ...(staff_id ? { staff_id } : {}),
    ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(month_id ? { month_id } : {}),
    ...(year_id ? { year_id } : {}),
    ...(salary_status ? { salary_status } : {}),
    ...(search && matchingStaffIds.length > 0 ? { staff_id: { in: matchingStaffIds } } : {}),
  };

  const [total, sheets] = await prisma.$transaction([
    prisma.erpStaffSalaries.count({ where }),
    prisma.erpStaffSalaries.findMany({
      where,
      select: {
        id: true,
        staff_id: true,
        branch_id: true,
        month_id: true,
        year_id: true,
        gross_salary: true,
        basic_salary: true,
        medical_allowance: true,
        house_rent_allowance: true,
        conveyance_allowance: true,
        eobi_amount: true,
        epf_amount: true,
        tax_amount: true,
        loan_amount: true,
        net_salary: true,
        salary_status: true,
      },
      orderBy: [{ year_id: "desc" }, { month_id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const staffIds = sheets.map((s) => s.staff_id).filter((id): id is number => id != null);
  const [staffById, branchesById] = await Promise.all([loadStaffMap(staffIds), loadBranchMap()]);

  const data: SalaryRegisterRow[] = sheets.map((s) => ({
    id: s.id,
    employee_id: s.staff_id ?? 0,
    employee_name: s.staff_id != null ? staffById.get(s.staff_id)?.name ?? `Staff #${s.staff_id}` : "—",
    reg_no: s.staff_id != null ? staffById.get(s.staff_id)?.reg_no ?? null : null,
    branch_id: s.branch_id,
    branch_name: branchesById.get(s.branch_id) ?? "—",
    month_id: s.month_id,
    year_id: s.year_id,
    gross_salary: s.gross_salary,
    basic_salary: s.basic_salary,
    medical_allowance: s.medical_allowance,
    house_rent_allowance: s.house_rent_allowance,
    conveyance_allowance: s.conveyance_allowance,
    eobi_amount: s.eobi_amount,
    epf_amount: s.epf_amount,
    tax_amount: s.tax_amount,
    loan_amount: s.loan_amount,
    net_salary: s.net_salary,
    salary_status: s.salary_status,
  }));

  return { data, total, page, limit };
};

// ─── Loan Register Report ───────────────────────────────────────────────────
// request_loan_employee has no deleted_at column (confirmed against the raw
// SQL/Prisma schema — same as loan.service.ts's listLoans() finding), so
// there is no soft-delete guard to apply here.
export interface LoanRegisterRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  branch_id: number;
  branch_name: string;
  type: string;
  amount: number;
  installments: number;
  monthly_installment: number | null;
  status: number;
  effective_from: Date;
  reason: string | null;
  // remaining_balance (2026-08-22, fixes audit finding #10, P3): the loan
  // request row itself doesn't track a running balance — that only exists
  // on the salary sheet (see payrollRun.service.ts's computeLoanDeduction
  // and markLoansCompletedIfPaidOff). This is derived by looking up the
  // employee's most recent salary sheet:
  //   - status COMPLETED (3) -> 0 (paid off, regardless of what the last
  //     sheet said, since completion is what stops further deduction)
  //   - status APPROVED (1), a sheet exists -> that sheet's remaining_amount
  //   - status APPROVED (1), no sheet yet -> the full principal (amount) —
  //     nothing has been deducted yet
  //   - status PENDING/REJECTED -> null, not applicable
  // CAVEAT: if an employee has more than one concurrently-approved loan,
  // this shows the COMBINED remaining balance across all of them (the
  // existing payroll architecture doesn't track balances per individual
  // loan — see the P0 loan-deduction fix's own comments), not this row's
  // balance in isolation. Report readers should be aware of this when an
  // employee appears more than once with an APPROVED status.
  remaining_balance: number | null;
}

const getLatestRemainingByStaffId = async (staffIds: number[]): Promise<Map<number, number>> => {
  const uniqueIds = [...new Set(staffIds)];
  if (uniqueIds.length === 0) return new Map();

  // For each staff, the single most recent salary sheet (by payroll
  // period, falling back to id as a tiebreaker) determines the current
  // combined loan balance.
  const sheets = await prisma.erpStaffSalaries.findMany({
    where: { staff_id: { in: uniqueIds }, deleted_at: null },
    select: { staff_id: true, remaining_amount: true, year_id: true, month_id: true, id: true },
    orderBy: [{ year_id: "desc" }, { month_id: "desc" }, { id: "desc" }],
  });

  const latestByStaffId = new Map<number, number>();
  for (const sheet of sheets) {
    if (!latestByStaffId.has(sheet.staff_id)) {
      latestByStaffId.set(sheet.staff_id, sheet.remaining_amount ?? 0);
    }
  }
  return latestByStaffId;
};

export const getLoanRegisterReport = async (
  params: LoanRegisterQuery
): Promise<{ data: LoanRegisterRow[]; total: number; page: number; limit: number }> => {
  const { page, limit, search, staff_id, branch_id, company_id, status } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.RequestLoanEmployeeWhereInput = {
    ...(staff_id ? { staff_id } : {}),
    ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(search
      ? { OR: [{ type: { contains: search, mode: "insensitive" } }, { reason: { contains: search, mode: "insensitive" } }] }
      : {}),
  };

  const [total, loans] = await prisma.$transaction([
    prisma.requestLoanEmployee.count({ where }),
    prisma.requestLoanEmployee.findMany({
      where,
      select: {
        id: true,
        staff_id: true,
        branch_id: true,
        type: true,
        amount: true,
        installments: true,
        monthly_installment: true,
        status: true,
        effective_from: true,
        reason: true,
      },
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const [staffById, branchesById, latestRemainingByStaffId] = await Promise.all([
    loadStaffMap(loans.map((l) => l.staff_id)),
    loadBranchMap(),
    getLatestRemainingByStaffId(loans.map((l) => l.staff_id)),
  ]);

  const data: LoanRegisterRow[] = loans.map((l) => {
    let remaining_balance: number | null;
    if (l.status === LOAN_REQUEST_STATUS.COMPLETED) {
      remaining_balance = 0;
    } else if (l.status === LOAN_REQUEST_STATUS.APPROVED) {
      remaining_balance = latestRemainingByStaffId.get(l.staff_id) ?? l.amount;
    } else {
      remaining_balance = null;
    }

    return {
      id: l.id,
      employee_id: l.staff_id,
      employee_name: staffById.get(l.staff_id)?.name ?? `Staff #${l.staff_id}`,
      reg_no: staffById.get(l.staff_id)?.reg_no ?? null,
      branch_id: l.branch_id,
      branch_name: branchesById.get(l.branch_id) ?? "—",
      type: l.type,
      amount: l.amount,
      installments: l.installments,
      monthly_installment: l.monthly_installment,
      status: l.status,
      effective_from: l.effective_from,
      reason: l.reason,
      remaining_balance,
    };
  });

  return { data, total, page, limit };
};

// ─── Current month/year helper (Gross Salary Report default) ───────────────
const currentMonthYear = (): { month_id: string; year_id: number } => {
  const now = new Date();
  return { month_id: String(now.getMonth() + 1).padStart(2, "0"), year_id: now.getFullYear() };
};

// ─── Latest month/year that actually has salary sheets ─────────────────────
// "Today's calendar month" is a poor default when payroll for the current
// month hasn't been generated yet — the report would silently render empty
// on first paint with no obvious explanation. When the caller hasn't
// specified month_id/year_id, prefer the most recent month_year that has
// any (non-deleted) erp_staff_salaries rows, so first paint shows the last
// payroll actually run instead of a guaranteed-empty "current month".
// Falls back to currentMonthYear() only when there are no salary sheets in
// the system at all yet (first run, brand-new install).
const latestSalaryMonthYear = async (): Promise<{ month_id: string; year_id: number } | null> => {
  const latest = await prisma.erpStaffSalaries.findFirst({
    where: { deleted_at: null },
    select: { month_id: true, year_id: true },
    orderBy: [{ year_id: "desc" }, { month_id: "desc" }],
  });
  if (!latest || !latest.month_id || latest.year_id == null) return null;
  return { month_id: latest.month_id, year_id: latest.year_id };
};

// ─── Department lookup + staff-in-department filter helper ─────────────────
// erp_staff_salaries has no department_id of its own (only staff_id +
// branch_id) — same "no FK, join in JS" reality as everywhere else in this
// module — so a department filter has to resolve to a staff_id list first.
const loadDepartmentMap = async (): Promise<Map<number, string>> => {
  const rows = await prisma.departments.findMany({ select: { id: true, name: true } });
  return new Map(rows.map((d) => [d.id, d.name]));
};

const staffIdsInDepartment = async (department_id: number): Promise<number[]> => {
  const rows = await prisma.staff.findMany({
    where: { deleted_at: null, department_id },
    select: { id: true },
  });
  return rows.map((r) => r.id);
};

// ─── Dynamic allowance breakdown per sheet (hr_salary_allowances) ──────────
// Same manual-join convention as loadStaffMap/loadBranchMap above (this
// schema has no usable @relation aggregation). Unlike the old sum-only
// helper this used to be, the Gross Salary Report now needs the individual
// allowance-type components (not just their total) so it can show which
// specific allowance items make up an employee's "Allowances" figure —
// see the "Gross Salary Report — component breakdown" note below. Resolves
// display names against hr_allowance_types, same as salary.service.ts's
// loadAllowancesBySalaryId (kept separate rather than imported/reused since
// that one isn't exported and this report needs its own shape: grouped by
// type across the whole result set, not a flat per-sheet list).
export interface AllowanceColumn {
  key: string;
  label: string;
}

interface SalaryAllowanceSumRow {
  salary_id: number;
  allowance_type_id: number;
  amount: number;
}

const loadAllowanceBreakdownBySalaryId = async (
  salaryIds: number[]
): Promise<{
  bySalaryId: Map<number, Map<string, number>>;
  columns: AllowanceColumn[];
}> => {
  if (salaryIds.length === 0) return { bySalaryId: new Map(), columns: [] };

  const rows: SalaryAllowanceSumRow[] = await prisma.hrSalaryAllowances.findMany({
    where: { salary_id: { in: salaryIds } },
    select: { salary_id: true, allowance_type_id: true, amount: true },
  });
  if (rows.length === 0) return { bySalaryId: new Map(), columns: [] };

  const typeIds: number[] = [...new Set(rows.map((r: SalaryAllowanceSumRow) => r.allowance_type_id))];
  const types: { id: number; name: string }[] = await prisma.hrAllowanceTypes.findMany({
    where: { id: { in: typeIds } },
    select: { id: true, name: true },
  });
  const namesById = new Map(types.map((t: { id: number; name: string }) => [t.id, t.name] as const));

  // Dynamic allowance types get a stable, collision-free column key derived
  // from their allowance_type_id — new types created in HR Settings need no
  // code change to start appearing here, they're discovered purely from
  // whatever hr_salary_allowances rows actually exist for the sheets in
  // this report.
  const columnByTypeId = new Map<number, AllowanceColumn>();
  for (const typeId of typeIds) {
    columnByTypeId.set(typeId, {
      key: `allowance_type_${typeId}`,
      label: namesById.get(typeId) ?? `Allowance #${typeId}`,
    });
  }

  const bySalaryId = new Map<number, Map<string, number>>();
  for (const row of rows) {
    const column = columnByTypeId.get(row.allowance_type_id)!;
    const perSalary = bySalaryId.get(row.salary_id) ?? new Map<string, number>();
    perSalary.set(column.key, (perSalary.get(column.key) ?? 0) + row.amount);
    bySalaryId.set(row.salary_id, perSalary);
  }

  // Sorted by label so column order in the UI/export is stable and
  // alphabetical rather than depending on insertion/discovery order.
  const columns = [...columnByTypeId.values()].sort((a, b) => a.label.localeCompare(b.label));

  return { bySalaryId, columns };
};

// ─── Fixed deduction / payroll-deduction components ─────────────────────────
// Unlike allowances (configurable via hr_allowance_types), this schema has
// no admin-configurable "deduction types" table — EOBI/EPF/Tax/Training/
// Other Deduction and the two payroll-run deductions (loan installment,
// leave deduction) are fixed columns on erp_staff_salaries itself (see
// computeTotals() in salary.service.ts and computeLoanDeduction/
// computeLeaveDeduction in payrollRun.service.ts). They're still broken out
// as individual named components below (rather than left as a single
// total) to satisfy the report's component-level breakdown requirement —
// dynamic detection isn't possible for these two groups only because the
// data model itself has no per-deduction-type table to discover from.
const DEDUCTION_COLUMNS: AllowanceColumn[] = [
  { key: "eobi_amount", label: "EOBI" },
  { key: "epf_amount", label: "EPF" },
  { key: "tax_amount", label: "Tax" },
  { key: "training", label: "Training" },
  { key: "other_deduction", label: "Other Deduction" },
];

const PAYROLL_DEDUCTION_COLUMNS: AllowanceColumn[] = [
  { key: "pay_loan", label: "Loan Installment" },
  { key: "leaves_deduction", label: "Leave Deduction" },
];

// ─── Gross Salary Report ─────────────────────────────────────────────────────
// "How much salary did we pay this month" — one row per employee's salary
// sheet for the selected month/year, plus a grand total. month_id/year_id
// default to the current calendar month when omitted (see
// payrollReport.validator.ts), which is what both the dashboard widget and
// this report page's first paint rely on.
//
// allowances/deductions/payroll_deductions/arrears/leaves/net_salary are all
// read straight off the sheet that Salary Sheet generation/edit already
// computed and persisted (see salary.service.ts's
// computeAutoGrossSalary/computeTotals) — nothing here is recalculated or
// hardcoded, this just surfaces the existing figures:
//   allowances = medical_allowance + house_rent_allowance +
//                conveyance_allowance + sum(hr_salary_allowances) — the
//                same components computeAutoGrossSalary folds into
//                gross_salary in the first place.
//   payroll_deductions = pay_loan + leaves_deduction — the two deduction
//                components computeTotals() sources from Payroll Run
//                processing itself (the loan installment actually repaid
//                this run, and the leave-based deduction computed from
//                hr_payroll_deduction_formulas — see payrollRun.service.ts's
//                computeLeaveDeduction), read back unchanged.
//   deductions = (gross_before_adj − net_salary) − payroll_deductions — the
//                remaining epf+eobi+tax+training+other_deduction slice of
//                computeTotals()'s total, derived by subtraction so it can
//                never drift from what was actually persisted rather than
//                being re-summed from parts.
//   arrears/leaves = the sheet's own `arrears`/`leaves` columns, unchanged.
// ─── Gross Salary Report — component breakdown (2026-08-30) ────────────────
// allowances/deductions/payroll_deductions remain the same totals as
// before (nothing about how they're calculated changed — see the notes
// below them), but each is now paired with a `*_by_type` map naming the
// individual components that sum to that total, e.g.
// `allowances_by_type: { medical_allowance: 5000, house_rent_allowance: 30000,
// allowance_type_7: 12000 }`. Column keys are stable and match the
// key/label pairs returned in this report's allowanceColumns/
// deductionColumns/payrollDeductionColumns (see getGrossSalaryReport's
// return value) — the frontend renders one table column per entry in
// those arrays and looks up `row.<group>_by_type[column.key] ?? 0`, so a
// brand-new allowance type shows up automatically with zero code changes.
export interface GrossSalaryRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  branch_id: number;
  branch_name: string;
  department_name: string;
  gross_salary: number;
  allowances: number;
  allowances_by_type: Record<string, number>;
  deductions: number | null;
  deductions_by_type: Record<string, number>;
  payroll_deductions: number;
  payroll_deductions_by_type: Record<string, number>;
  arrears: number;
  leaves: number;
  net_salary: number | null;
  salary_status: string;
}

export const getGrossSalaryReport = async (
  params: GrossSalaryQuery
): Promise<{
  data: GrossSalaryRow[];
  employeeCount: number;
  totalGross: number;
  totalNet: number;
  totalAllowances: number;
  totalDeductions: number;
  month_id: string;
  year_id: number;
  allowanceColumns: AllowanceColumn[];
  deductionColumns: AllowanceColumn[];
  payrollDeductionColumns: AllowanceColumn[];
}> => {
  // Only fall back to "latest month with data" when the caller didn't ask
  // for a specific month/year — an explicit filter (e.g. the user typing
  // 07/2026 into the report) is always honored as-is, even if it turns out
  // to be empty.
  const defaultMonthYear =
    params.month_id == null && params.year_id == null
      ? (await latestSalaryMonthYear()) ?? currentMonthYear()
      : currentMonthYear();
  const { month_id, year_id } = { ...defaultMonthYear, ...params };
  const { branch_id, company_id, department_id } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const grossCompanyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const departmentStaffIds = department_id ? await staffIdsInDepartment(department_id) : null;

  const where: Prisma.ErpStaffSalariesWhereInput = {
    deleted_at: null,
    month_id,
    year_id,
    ...(branch_id ? { branch_id } : grossCompanyBranchIds ? { branch_id: { in: grossCompanyBranchIds } } : {}),
    ...(departmentStaffIds ? { staff_id: { in: departmentStaffIds } } : {}),
  };

  const sheets = await prisma.erpStaffSalaries.findMany({
    where,
    select: {
      id: true,
      staff_id: true,
      branch_id: true,
      gross_salary: true,
      medical_allowance: true,
      house_rent_allowance: true,
      conveyance_allowance: true,
      gross_before_adj: true,
      eobi_amount: true,
      epf_amount: true,
      tax_amount: true,
      training: true,
      other_deduction: true,
      pay_loan: true,
      leaves_deduction: true,
      arrears: true,
      leaves: true,
      net_salary: true,
      salary_status: true,
    },
    orderBy: { gross_salary: "desc" },
    take: REPORT_MAX_ROWS,
  });

  const staffIds = sheets.map((s) => s.staff_id).filter((id): id is number => id != null);
  const [staffById, branchesById, staffRows, allowanceBreakdown] = await Promise.all([
    loadStaffMap(staffIds),
    loadBranchMap(),
    prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, department_id: true },
    }),
    loadAllowanceBreakdownBySalaryId(sheets.map((s) => s.id)),
  ]);
  const { bySalaryId: dynamicAllowancesBySalaryId, columns: dynamicAllowanceColumns } = allowanceBreakdown;
  const departmentsById = await loadDepartmentMap();
  const staffDepartmentById = new Map(staffRows.map((s) => [s.id, s.department_id]));

  // Fixed allowance columns always shown (every erp_staff_salaries row has
  // these, unlike the dynamic hr_salary_allowances ones which only exist
  // when actually applied) + whatever dynamic allowance types were
  // discovered above — this is the full, stable column set the table/export
  // and every row's allowances_by_type are built against.
  const FIXED_ALLOWANCE_COLUMNS: AllowanceColumn[] = [
    { key: "medical_allowance", label: "Medical Allowance" },
    { key: "house_rent_allowance", label: "House Rent Allowance" },
    { key: "conveyance_allowance", label: "Conveyance Allowance" },
  ];
  const allowanceColumns = [...FIXED_ALLOWANCE_COLUMNS, ...dynamicAllowanceColumns];

  const data: GrossSalaryRow[] = sheets.map((s) => {
    const deptId = s.staff_id != null ? staffDepartmentById.get(s.staff_id) : null;

    const dynamicAllowances = dynamicAllowancesBySalaryId.get(s.id);
    const allowances_by_type: Record<string, number> = {
      medical_allowance: Math.round(Number(s.medical_allowance) || 0),
      house_rent_allowance: Math.round(Number(s.house_rent_allowance) || 0),
      conveyance_allowance: s.conveyance_allowance ?? 0,
    };
    for (const column of dynamicAllowanceColumns) {
      allowances_by_type[column.key] = dynamicAllowances?.get(column.key) ?? 0;
    }
    const allowances = Math.round(Object.values(allowances_by_type).reduce((sum, v) => sum + v, 0));

    // gross_before_adj is populated by computeTotals() on every
    // create/update (see salary.service.ts); fall back to gross + arrears
    // for the rare legacy row where it's still null so a report row is
    // never silently dropped/blank.
    const grossBeforeAdj = s.gross_before_adj ?? s.gross_salary + (s.arrears ?? 0);

    // payroll_deductions = the portion of total deductions that Payroll Run
    // itself produces (loan installment + leave-based deduction) — always
    // computable from the sheet's own columns, independent of net_salary.
    const payLoan = s.pay_loan ?? 0;
    const leavesDeduction = s.leaves_deduction ?? 0;
    const payroll_deductions_by_type: Record<string, number> = {
      pay_loan: payLoan,
      leaves_deduction: leavesDeduction,
    };
    const payroll_deductions = payLoan + leavesDeduction;

    // The remaining (non-payroll-run) deduction components — EOBI/EPF/Tax/
    // Training/Other Deduction — are read straight off the sheet's own
    // columns too, same as computeTotals()'s `deductions` formula in
    // salary.service.ts adds them up (epf + eobi + tax + training +
    // other_deduction + pay_loan + leaves_deduction). Summing just this
    // subset here is mathematically the same value the old `deductions`
    // total below resolves to whenever net_salary is known, so the
    // breakdown always reconciles with the total instead of drifting from it.
    const deductions_by_type: Record<string, number> = {
      eobi_amount: s.eobi_amount ?? 0,
      epf_amount: s.epf_amount ?? 0,
      tax_amount: s.tax_amount ?? 0,
      training: s.training ?? 0,
      other_deduction: s.other_deduction ?? 0,
    };

    // net_salary itself can legitimately be null (sheet created but totals
    // never computed yet) — in that case "deductions" is genuinely unknown,
    // not zero, so it's left null rather than guessed (deductions_by_type
    // above is still populated from the sheet's stored columns regardless,
    // since those exist independently of whether net_salary was derived).
    const totalDeductions = s.net_salary != null ? grossBeforeAdj - s.net_salary : null;
    const deductions = totalDeductions != null ? totalDeductions - payroll_deductions : null;

    return {
      id: s.id,
      employee_id: s.staff_id ?? 0,
      employee_name: s.staff_id != null ? staffById.get(s.staff_id)?.name ?? `Staff #${s.staff_id}` : "—",
      reg_no: s.staff_id != null ? staffById.get(s.staff_id)?.reg_no ?? null : null,
      branch_id: s.branch_id,
      branch_name: branchesById.get(s.branch_id) ?? "—",
      department_name: deptId != null ? departmentsById.get(deptId) ?? "—" : "—",
      gross_salary: s.gross_salary,
      allowances,
      allowances_by_type,
      deductions,
      deductions_by_type,
      payroll_deductions,
      payroll_deductions_by_type,
      arrears: s.arrears ?? 0,
      leaves: s.leaves ?? 0,
      net_salary: s.net_salary,
      salary_status: s.salary_status,
    };
  });

  const totalGross = data.reduce((sum, r) => sum + (r.gross_salary ?? 0), 0);
  const totalNet = data.reduce((sum, r) => sum + (r.net_salary ?? 0), 0);
  const totalAllowances = data.reduce((sum, r) => sum + r.allowances, 0);
  const totalDeductions = data.reduce((sum, r) => sum + (r.deductions ?? 0) + r.payroll_deductions, 0);

  return {
    data,
    employeeCount: data.length,
    totalGross,
    totalNet,
    totalAllowances,
    totalDeductions,
    month_id,
    year_id,
    allowanceColumns,
    deductionColumns: DEDUCTION_COLUMNS,
    payrollDeductionColumns: PAYROLL_DEDUCTION_COLUMNS,
  };
};

// ─── Bulk Salary Slip Data ────────────────────────────────────────────────────
// One "slip" object per employee's salary sheet for the requested month —
// shaped for a printable payslip rather than a table row (full name pieces,
// designation, bank details, and every allowance/deduction line broken out
// individually instead of collapsed into a single "gross"/"net" pair).
export interface SalarySlipRow {
  sheet_id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  designation: string | null;
  department_name: string;
  branch_name: string;
  company_name: string;
  cnic: string | null;
  bank_account: string | null;
  account_title: string | null;
  account_number: string | null;
  month_id: string;
  year_id: number;
  basic_salary: number | null;
  medical_allowance: string;
  house_rent_allowance: string;
  conveyance_allowance: number | null;
  gross_salary: number;
  eobi_amount: number | null;
  epf_amount: number | null;
  tax_amount: number | null;
  loan_amount: number | null;
  other_deduction: number | null;
  arrears: number;
  net_salary: number | null;
  salary_status: string;
}

export const getSalarySlips = async (
  params: SalarySlipsQuery
): Promise<{ data: SalarySlipRow[]; total: number }> => {
  const { month_id, year_id, branch_id, company_id, department_id, staff_ids } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const slipsCompanyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const departmentStaffIds = department_id ? await staffIdsInDepartment(department_id) : null;
  const idFilters = [departmentStaffIds, staff_ids].filter(
    (ids): ids is number[] => Array.isArray(ids)
  );
  // Intersect every id filter that was actually supplied (department filter,
  // explicit staff_ids selection) rather than only honouring the last one.
  const staffIdFilter =
    idFilters.length === 0
      ? null
      : idFilters.reduce((acc, ids) => acc.filter((id) => ids.includes(id)));

  const where: Prisma.ErpStaffSalariesWhereInput = {
    deleted_at: null,
    month_id,
    year_id,
    ...(branch_id ? { branch_id } : slipsCompanyBranchIds ? { branch_id: { in: slipsCompanyBranchIds } } : {}),
    ...(staffIdFilter ? { staff_id: { in: staffIdFilter } } : {}),
  };

  const sheets = await prisma.erpStaffSalaries.findMany({
    where,
    select: {
      id: true,
      staff_id: true,
      branch_id: true,
      basic_salary: true,
      medical_allowance: true,
      house_rent_allowance: true,
      conveyance_allowance: true,
      gross_salary: true,
      eobi_amount: true,
      epf_amount: true,
      tax_amount: true,
      loan_amount: true,
      other_deduction: true,
      arrears: true,
      net_salary: true,
      salary_status: true,
    },
    orderBy: { staff_id: "asc" },
    take: REPORT_MAX_ROWS,
  });

  const staffIds = sheets.map((s) => s.staff_id).filter((id): id is number => id != null);

  const [staffRows, branches, companies] = await Promise.all([
    prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: {
        id: true,
        reg_no: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        designation: true,
        department_id: true,
        branch_id: true,
        cnic: true,
        bank_account: true,
        account_title: true,
        account_number: true,
      },
    }),
    prisma.erpBranches.findMany({ select: { id: true, name: true, company_id: true } }),
    prisma.erpCompanies.findMany({ select: { id: true, name: true } }),
  ]);

  const departmentsById = await loadDepartmentMap();
  const staffById = new Map(staffRows.map((s) => [s.id, s]));
  const branchesById = new Map(branches.map((b) => [b.id, b]));
  const companiesById = new Map(companies.map((c) => [c.id, c]));

  const data: SalarySlipRow[] = sheets.map((s) => {
    const staff = s.staff_id != null ? staffById.get(s.staff_id) : undefined;
    const branch = branchesById.get(s.branch_id);
    const company = branch ? companiesById.get(branch.company_id) : undefined;

    return {
      sheet_id: s.id,
      employee_id: s.staff_id ?? 0,
      employee_name: staff
        ? [staff.first_name, staff.middle_name, staff.last_name].filter(Boolean).join(" ") || `Staff #${s.staff_id}`
        : `Staff #${s.staff_id}`,
      reg_no: staff?.reg_no ?? null,
      designation: staff?.designation ?? null,
      department_name:
        staff?.department_id != null ? departmentsById.get(staff.department_id) ?? "—" : "—",
      branch_name: branch?.name ?? "—",
      company_name: company?.name ?? "—",
      cnic: staff?.cnic ?? null,
      bank_account: staff?.bank_account ?? null,
      account_title: staff?.account_title ?? null,
      account_number: staff?.account_number ?? null,
      month_id,
      year_id,
      basic_salary: s.basic_salary,
      medical_allowance: s.medical_allowance,
      house_rent_allowance: s.house_rent_allowance,
      conveyance_allowance: s.conveyance_allowance,
      gross_salary: s.gross_salary,
      eobi_amount: s.eobi_amount,
      epf_amount: s.epf_amount,
      tax_amount: s.tax_amount,
      loan_amount: s.loan_amount,
      other_deduction: s.other_deduction,
      arrears: s.arrears,
      net_salary: s.net_salary,
      salary_status: s.salary_status,
    };
  });

  return { data, total: data.length };
};