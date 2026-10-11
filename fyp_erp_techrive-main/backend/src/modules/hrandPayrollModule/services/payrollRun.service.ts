import { prisma } from "../../../config/db";
import { postJournalEntry } from "../../accountsModule/services/posting.service";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { PAYROLL_RUN_STATUS } from "../constants/payrollRun.constants";
import { SALARY_STATUS } from "../constants/salary.constants";
import { BANK_ACCOUNT_STATUS } from "../constants/bankAccount.constants";
import { LOAN_REQUEST_STATUS } from "../constants/loanRequest.constants";
import * as salaryService from "./salary.service";
import { getStaffDefaultAllowances } from "./employee.service";
import { CreatePayrollRunInput } from "../validators/payrollRun.validator";

// ─── month_year ("YYYY-MM") ⇄ erp_staff_salaries' month_id/year_id ─────────
const splitMonthYear = (monthYear: string): { month_id: string; year_id: number } => {
  const parts = monthYear.split("-");
  const year = parts[0] ?? "";
  const month = parts[1] ?? "";
  return { month_id: month, year_id: Number(year) };
};

const parseNumericString = (value: string | null | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

// ─── Loan deduction for a payroll run ────────────────────────────────────────
// erp_staff_salaries.loan_amount/pay_loan have no dedicated "remaining
// balance" ledger anywhere in this schema — the only place a running balance
// is ever recorded is each month's own salary sheet snapshot
// (loan_amount/pay_loan/remaining_amount), and request_loan_employee (the
// consolidated Loan Requests table) has no guard preventing an employee from
// having more than one concurrently-approved loan.
//
// This computes, for one staff member:
//   pay_loan    = sum of monthly_installment across every currently-approved
//                 loan (status: APPROVED, deleted_at: null). Previously
//                 also required approved_by_ceo: APPROVED, a second-tier
//                 sign-off with no reachable UI control — meaning it could
//                 never actually be set, meaning no loan was EVER deducted
//                 from payroll, regardless of status. Removed at the
//                 user's request; `status` alone is now the single
//                 approval gate (see loanRequest.constants.ts).
//   loan_amount = their most recent salary sheet's remaining_amount, if one
//                 exists (i.e. they've already been mid-repayment) —
//                 otherwise the sum of the approved loans' principal
//                 (`amount`), for a first-month deduction.
// pay_loan is capped at loan_amount so a payroll run can never deduct more
// than is actually still owed (createSalarySheet floors remaining_amount at
// 0 regardless, but capping here keeps pay_loan itself — "amount actually
// deducted this period" — honest on the generated sheet).
//
// This is this codebase's own reasoned interpretation, not a rule the
// schema states outright — worth a human sanity-check against how Salary
// Sheet's manual loan fields are actually used in practice.
const computeLoanDeduction = async (
  staff_id: number
): Promise<{ loan_amount: number; pay_loan: number }> => {
  const [approvedLoans, latestSheet] = await Promise.all([
    prisma.requestLoanEmployee.findMany({
      where: {
        staff_id,
        status: LOAN_REQUEST_STATUS.APPROVED,
        deleted_at: null,
      },
      select: { amount: true, monthly_installment: true },
    }),
    prisma.erpStaffSalaries.findFirst({
      where: { staff_id, deleted_at: null },
      orderBy: [{ year_id: "desc" }, { id: "desc" }],
      select: { remaining_amount: true },
    }),
  ]);

  if (approvedLoans.length === 0) {
    return { loan_amount: 0, pay_loan: 0 };
  }

  const totalPrincipal = approvedLoans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalMonthlyInstallment = approvedLoans.reduce(
    (sum, loan) => sum + (loan.monthly_installment ?? 0),
    0
  );

  const loan_amount =
    latestSheet?.remaining_amount != null && latestSheet.remaining_amount > 0
      ? latestSheet.remaining_amount
      : totalPrincipal;

  const pay_loan = Math.min(totalMonthlyInstallment, loan_amount);

  return { loan_amount, pay_loan };
};

// ─── Loan completion (2026-08-22, fixes a P0 bug) ──────────────────────────
// Previously, once a loan's balance reached exactly 0, computeLoanDeduction
// above had no way to tell "fully repaid" apart from "no sheet yet" — both
// read as falsy/zero — so it fell back to totalPrincipal and started
// deducting the whole loan again on the very next run, forever (the loan
// request's `status` never left APPROVED). This closes that gap: after a
// payroll run's sheet is created, if the sheet's own remaining_amount has
// hit 0 and a loan was actually deducted this run, every currently-APPROVED
// loan for that staff member is moved to the new COMPLETED status so
// computeLoanDeduction's `approvedLoans` query (status: APPROVED) naturally
// excludes it from now on. This matches the existing combined-balance model
// (all concurrently-approved loans are already summed into one obligation,
// not tracked per-loan) rather than introducing per-loan balance tracking,
// which would be a larger, riskier change than this bug needs.
const markLoansCompletedIfPaidOff = async (staff_id: number, pay_loan: number, remaining_amount: number) => {
  if (pay_loan <= 0 || remaining_amount > 0) return;

  await prisma.requestLoanEmployee.updateMany({
    where: {
      staff_id,
      status: LOAN_REQUEST_STATUS.APPROVED,
      deleted_at: null,
    },
    data: { status: LOAN_REQUEST_STATUS.COMPLETED, updated_at: new Date() },
  });
};

// ─── Leave/attendance deduction for a payroll run (2026-08-22) ─────────────
// Fixes audit finding #3 (P0): leave and attendance previously had zero
// effect on automated payroll — erp_staff_salaries.leaves/leaves_deduction
// were always left at 0 unless a human typed a number in manually.
//
// A day within the payroll month is counted as deductible if EITHER:
//   - it falls inside an approved leave request (leave_status references a
//     row with counts_as_approved = 1) whose leave type is UNPAID
//     (pay_type = 1), or
//   - it has an attendance record whose status references a row with
//     counts_as_absent = 1
// (the same calendar day can only ever be counted once, even if both
// conditions somehow apply to it — see the Set-based union below).
//
// The per-day Rupee rate comes from whichever hr_payroll_deduction_formulas
// row has is_default = 1: base_type picks basic vs gross salary, divisor_type
// picks calendar-days-in-month vs a flat 30. If no row is marked default —
// e.g. right after the migration, before HR has configured one — this
// returns { leaves: 0, leaves_deduction: 0 }, the exact same as the old
// always-0 behavior, rather than guessing a formula.
/**
 * Fixes audit finding P-05 (2026-08-22): a day is only ever a genuine
 * deductible leave/absence day if it's also a day the employee was
 * actually expected to work. Previously every calendar day inside an
 * unpaid-leave range (or every flagged-Absent attendance record) was
 * counted, even if it fell on the employee's weekly off-day or a company
 * holiday — overstating the deduction whenever a leave request happened to
 * span a weekend or a public holiday.
 *
 * A day is excluded from the deductible set if EITHER:
 *   - it's a day-off for the employee's assigned work shift
 *     (erp_hrm_work_weeks.on_off = 0 for that day's ISO weekday), or
 *   - it falls inside an erp_holidays row applicable to the employee's
 *     branch (branch_id matching, OR branch_id null = company-wide)
 * An employee with no assigned work_shift_id has no weekly-off information
 * to exclude by — every day stays eligible in that case (same as before),
 * since assuming a work week would be a silent guess this codebase
 * shouldn't make.
 */
const getNonWorkingDates = async (
  periodStart: Date,
  periodEnd: Date,
  branch_id: number,
  work_shift_id: number | null
): Promise<Set<string>> => {
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  const nonWorkingDates = new Set<string>();

  // Weekly off-days for this employee's shift (e.g. Saturday/Sunday)
  if (work_shift_id != null) {
    const offDays = await prisma.erpHrmWorkWeeks.findMany({
      where: { work_shift_id, deleted_at: null, on_off: 0 },
      select: { day: true },
    });
    // ISO-8601: 1 = Monday … 7 = Sunday (see workShift.constants.ts).
    // JS Date#getUTCDay() is 0 = Sunday … 6 = Saturday, so convert.
    const offIsoDays = new Set(offDays.map((d: { day: number }) => d.day));
    if (offIsoDays.size > 0) {
      for (let d = new Date(periodStart); d <= periodEnd; d.setUTCDate(d.getUTCDate() + 1)) {
        const jsDay = d.getUTCDay(); // 0=Sun..6=Sat
        const isoDay = jsDay === 0 ? 7 : jsDay; // 1=Mon..7=Sun
        if (offIsoDays.has(isoDay)) nonWorkingDates.add(toIso(d));
      }
    }
  }

  // Company/branch holidays overlapping the period
  const holidays = await prisma.erpHolidays.findMany({
    where: {
      OR: [{ branch_id }, { branch_id: null }],
      start_date: { lte: periodEnd },
      end_date: { gte: periodStart },
    },
    select: { start_date: true, end_date: true },
  });
  for (const h of holidays) {
    const from = h.start_date < periodStart ? periodStart : new Date(h.start_date);
    const to = h.end_date > periodEnd ? periodEnd : new Date(h.end_date);
    for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
      nonWorkingDates.add(toIso(d));
    }
  }

  return nonWorkingDates;
};

const computeLeaveDeduction = async (
  staff_id: number,
  monthYear: string,
  basicSalary: number,
  grossSalary: number,
  branch_id: number,
  work_shift_id: number | null
): Promise<{ leaves: number; leaves_deduction: number }> => {
  const [yearStr, monthStr] = monthYear.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-indexed, e.g. "08" -> 8
  if (!year || !month) return { leaves: 0, leaves_deduction: 0 };

  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0)); // last day of the month
  const calendarDaysInMonth = periodEnd.getUTCDate();

  const formula = await (prisma as any).hrPayrollDeductionFormulas?.findFirst({
    where: { deleted_at: null, status: 1, is_default: 1 },
    select: { base_type: true, divisor_type: true },
  });
  if (!formula) return { leaves: 0, leaves_deduction: 0 };

  const nonWorkingDates = await getNonWorkingDates(periodStart, periodEnd, branch_id, work_shift_id);

  const deductibleDates = new Set<string>();
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  const clampToPeriod = (start: Date, end: Date) => {
    const from = start < periodStart ? periodStart : start;
    const to = end > periodEnd ? periodEnd : end;
    for (let d = new Date(from); d <= to; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = toIso(d);
      if (!nonWorkingDates.has(iso)) deductibleDates.add(iso);
    }
  };

  // Approved leave requests on UNPAID leave types, overlapping this period
  const approvedStatusIds = (
    await prisma.erpHrmLeaveStatuses.findMany({
      where: { deleted_at: null, counts_as_approved: 1 },
      select: { id: true },
    })
  ).map((s: { id: number }) => s.id);

  const unpaidLeaveTypeIds = (
    await prisma.erpHrmLeaveTypes.findMany({
      where: { deleted_at: null, pay_type: 1 },
      select: { id: true },
    })
  ).map((t: { id: number }) => t.id);

  if (approvedStatusIds.length > 0 && unpaidLeaveTypeIds.length > 0) {
    const unpaidLeaveRequests = await prisma.erpHrmLeaveRequests.findMany({
      where: {
        employee_id: staff_id,
        deleted_at: null,
        leave_status: { in: approvedStatusIds },
        leave_type_id: { in: unpaidLeaveTypeIds },
        start_date: { lte: periodEnd },
        end_date: { gte: periodStart },
      },
      select: { start_date: true, end_date: true },
    });
    for (const req of unpaidLeaveRequests) {
      clampToPeriod(new Date(req.start_date), new Date(req.end_date));
    }
  }

  // Attendance days recorded with a status flagged as "Absent"
  const absentStatusIds = (
    await prisma.erpAttendanceStatuses.findMany({
      where: { counts_as_absent: 1 },
      select: { id: true },
    })
  ).map((s: { id: number }) => s.id);

  if (absentStatusIds.length > 0) {
    const absentAttendance = await prisma.employeeAttendance.findMany({
      where: {
        employee_id: staff_id,
        deleted_at: null,
        status: { in: absentStatusIds },
        attendance_date: { gte: periodStart, lte: periodEnd },
      },
      select: { attendance_date: true },
    });
    for (const record of absentAttendance) {
      if (!record.attendance_date) continue;
      const iso = toIso(new Date(record.attendance_date));
      if (!nonWorkingDates.has(iso)) deductibleDates.add(iso);
    }
  }

  const leaves = deductibleDates.size;
  if (leaves === 0) return { leaves: 0, leaves_deduction: 0 };

  const baseAmount = formula.base_type === 2 /* GROSS_SALARY */ ? grossSalary : basicSalary;
  const divisor = formula.divisor_type === 2 /* FIXED_30 */ ? 30 : calendarDaysInMonth;
  const perDayRate = divisor > 0 ? baseAmount / divisor : 0;

  return { leaves, leaves_deduction: Math.round(perDayRate * leaves) };
};

interface EligibleStaffMember {
  id: number;
  name: string;
  reg_no: string | null;
  // Surfaced so GeneratePayrollRunModal/PayrollConfirmModal can warn before
  // generating — an inactive/missing bank account doesn't stop the sheet
  // from being created (see runPayrollBatch's activeBankAccount lookup),
  // it just leaves that sheet's bank_account field blank on an otherwise
  // "Paid" record, which the person approving the run should know about
  // up front rather than discover after the fact.
  has_active_bank_account: boolean;
}

// ─── Staff eligible for a run ─────────────────────────────────────────────────
// Active staff in the branch who don't already have either a payroll_employees
// entry or a Salary Sheet for this branch/month/year — everyone else has
// already been handled (via this run or the manual Salary Sheet page).
export const listEligibleStaff = async (
  branch_id: number,
  monthYear: string
): Promise<EligibleStaffMember[]> => {
  const { month_id, year_id } = splitMonthYear(monthYear);

  const [alreadyInRun, alreadyHasSheet, allActiveStaff] = await Promise.all([
    prisma.payrollEmployees.findMany({
      where: { branch_id, month_year: monthYear, deleted_at: null },
      select: { employee_id: true },
    }),
    prisma.erpStaffSalaries.findMany({
      where: { branch_id, month_id, year_id, deleted_at: null },
      select: { staff_id: true },
    }),
    prisma.staff.findMany({
      where: { branch_id, status: "Active", deleted_at: null },
      select: { id: true, reg_no: true, first_name: true, last_name: true },
      orderBy: { first_name: "asc" },
    }),
  ]);

  const excludedIds = new Set<number>([
    ...alreadyInRun.map((r) => r.employee_id),
    ...alreadyHasSheet.map((r) => r.staff_id!).filter(Boolean),
  ]);

  const eligibleStaff = allActiveStaff.filter((s) => !excludedIds.has(s.id));

  // One query for every eligible employee's active bank account, rather
  // than one query per employee (this list can be large for a whole
  // campus) — mirrors the same status check runPayrollBatch itself uses.
  const activeBankAccounts = await prisma.staffBankAccounts.findMany({
    where: { staff_id: { in: eligibleStaff.map((s) => s.id) }, status: BANK_ACCOUNT_STATUS.ACTIVE },
    select: { staff_id: true },
  });
  const staffIdsWithActiveAccount = new Set(activeBankAccounts.map((a) => a.staff_id));

  return eligibleStaff.map((s) => ({
    id: s.id,
    name: [s.first_name, s.last_name].filter(Boolean).join(" ") || `Staff #${s.id}`,
    reg_no: s.reg_no,
    has_active_bank_account: staffIdsWithActiveAccount.has(s.id),
  }));
};

export interface RunResultEntry {
  staff_id: number;
  staff_name: string;
  reason?: string;
}

export interface RunPayrollBatchResult {
  generated: RunResultEntry[];
  skipped: RunResultEntry[];
}

// ─── Run payroll for the selected staff ──────────────────────────────────────
// Each staff member is processed independently — one failure doesn't abort
// the rest of the batch. Every successful sheet is created through the exact
// same salaryService.createSalarySheet() used by the manual Salary Sheet
// page, so duplicate-checking and the net_salary/total_* computation logic
// only exists in one place.
export const runPayrollBatch = async (
  input: CreatePayrollRunInput,
  actorId: number
): Promise<RunPayrollBatchResult> => {
  const { month_id, year_id } = splitMonthYear(input.month_year);
  const result: RunPayrollBatchResult = { generated: [], skipped: [] };

  for (const staff_id of input.staff_ids) {
    const staff = await prisma.staff.findFirst({
      where: { id: staff_id, branch_id: input.branch_id, status: "Active", deleted_at: null },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        staff_type: true,
        salary: true,
        basic_salary: true,
        conveyance: true,
        house_rent: true,
        medical_allowances: true,
        epf_amount: true,
        eobi_amount: true,
        tax_percentage: true,
        exempt_amount: true,
        work_shift_id: true,
      },
    });

    const staffName = staff
      ? [staff.first_name, staff.last_name].filter(Boolean).join(" ") || `Staff #${staff_id}`
      : `Staff #${staff_id}`;

    if (!staff) {
      result.skipped.push({ staff_id, staff_name: staffName, reason: "Employee not found in this campus" });
      continue;
    }

    const alreadyInRun = await prisma.payrollEmployees.findFirst({
      where: { branch_id: input.branch_id, month_year: input.month_year, employee_id: staff_id, deleted_at: null },
      select: { id: true },
    });
    if (alreadyInRun) {
      result.skipped.push({ staff_id, staff_name: staffName, reason: "Already included in this payroll run" });
      continue;
    }

    const activeBankAccount = await prisma.staffBankAccounts.findFirst({
      where: { staff_id, status: BANK_ACCOUNT_STATUS.ACTIVE },
      select: { account_number: true },
    });

    const basicSalary = staff.basic_salary ?? parseNumericString(staff.salary) ?? 0;
    const conveyanceAllowance = parseNumericString(staff.conveyance) ?? 0;
    const houseRentAllowance = parseNumericString(staff.house_rent) ?? 0;
    const medicalAllowance = parseNumericString(staff.medical_allowances) ?? 0;
    // Default allowances configured on the employee's own Salary Structure
    // (hr_staff_allowances — see employee.service.ts) are copied onto the
    // generated sheet each run. When present, salary.service.ts derives
    // gross_salary/tax_amount from them (fiscal-year tax slabs) instead of
    // the flat calculation below — see the tax_amount comment just after.
    const staffAllowances = await getStaffDefaultAllowances(staff_id);
    const grossSalary = basicSalary + conveyanceAllowance + houseRentAllowance + medicalAllowance;
    const { loan_amount, pay_loan } = await computeLoanDeduction(staff_id);
    const { leaves, leaves_deduction } = await computeLeaveDeduction(
      staff_id,
      input.month_year,
      basicSalary,
      grossSalary,
      input.branch_id,
      staff.work_shift_id
    );

    try {
      const sheet = await salaryService.createSalarySheet({
        staff_id,
        branch_id: input.branch_id,
        ledger_id: input.ledger_id || 1,
        financial_year: input.financial_year || 2026,
        date: new Date().toISOString().slice(0, 10),
        month_id,
        year_id,
        staff_category: staff.staff_type ?? undefined,
        description: `Auto-generated via Payroll Run for ${input.month_year}`,
        bank_account: activeBankAccount?.account_number ?? undefined,
        gross_salary: grossSalary,
        basic_salary: basicSalary,
        medical_allowance: medicalAllowance,
        house_rent_allowance: houseRentAllowance,
        conveyance_allowance: conveyanceAllowance,
        // Fixes audit finding P-04: when the employee record has no
        // configured EOBI/EPF value, send `undefined` (not 0) so
        // salary.service.ts's createSalarySheet auto-calculates them from
        // hr_statutory_contribution_settings instead of silently zeroing
        // them out. A genuine manual value already on the staff record
        // (e.g. HR typed a specific number for this person) still always
        // wins — this only fills a real gap.
        eobi_amount: staff.eobi_amount || undefined,
        epf_amount: staff.epf_amount || undefined,
        // Only sent when the employee has an old-style flat tax_percentage
        // configured — that always wins as a manual override. Otherwise
        // left undefined so salary.service.ts auto-calculates tax from the
        // fiscal year's tax slabs against the taxable base instead (see
        // salary.constants.ts's "Allowances & Auto Tax Calculation" note).
        tax_amount: staff.tax_percentage ? Math.round((grossSalary * staff.tax_percentage) / 100) : undefined,
        loan_amount,
        pay_loan,
        leaves,
        leaves_deduction,
        allowances: staffAllowances.length > 0 ? staffAllowances : undefined,
        exempt_amount: staff.exempt_amount ?? undefined,
        // A Payroll Run represents the actual disbursement of salaries for
        // this branch/month — by the time this call returns, every sheet
        // it created is treated as already paid out, not as a draft
        // awaiting a separate multi-step sign-off. (A sheet created
        // manually via the Salary Sheets page still defaults to Pending,
        // same as before — this only applies to the batch-generated path.)
        salary_status: SALARY_STATUS.PAID,
      });

      await markLoansCompletedIfPaidOff(staff_id, pay_loan, sheet.remaining_amount ?? 0);

      await prisma.payrollEmployees.create({
        data: {
          branch_id: input.branch_id,
          month_year: input.month_year,
          employee_id: staff_id,
          status: PAYROLL_RUN_STATUS.GENERATED,
          created_by: actorId,
          created_at: new Date(),
        },
      });

      result.generated.push({ staff_id, staff_name: staffName });
    } catch (error) {
      // Fixes audit finding P-02 (2026-08-22): a genuine race between two
      // concurrent payroll runs (or a run racing a manual Salary Sheet
      // create for the same employee/branch/period) surfaces here as a
      // Postgres unique-violation on the partial index added in
      // manual_migrations/2026_08_22_payroll_duplicate_guard_unique_indexes.sql
      // — Prisma reports that as PrismaClientKnownRequestError code P2002,
      // regardless of whether the constraint is modeled in schema.prisma.
      // Previously this fell through to the generic "Could not generate
      // salary sheet" message, hiding the real reason. Give it the same
      // specific, accurate reason the direct manual-create endpoint already
      // returns (see salary.controller.ts's handleError) instead of a
      // catch-all.
      let reason = "Could not generate salary sheet";
      if (error instanceof AppError) {
        reason = error.message;
      } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        reason = "A salary sheet for this employee/campus/period already exists";
      }
      result.skipped.push({ staff_id, staff_name: staffName, reason });
    }
  }

  // Trigger Aggregated GL Posting for the Payroll Batch
  if (result.generated.length > 0) {
    try {
      const batchRefId = `${input.branch_id}-${input.month_year}`;
      const { month_id, year_id } = splitMonthYear(input.month_year);

      const generatedSheets = await prisma.erpStaffSalaries.findMany({
        where: {
          branch_id: input.branch_id,
          month_id,
          year_id,
        },
      });

      let totalGross = 0;
      let totalTax = 0;
      let totalLoan = 0;
      let totalNetPay = 0;

      generatedSheets.forEach((sheet) => {
        totalGross += Number(sheet.gross_salary || 0);
        totalTax += Number(sheet.tax_amount || sheet.total_tax || 0);
        totalLoan += Number(sheet.pay_loan || 0);
        totalNetPay += Number(sheet.net_salary || 0);
      });

      const salaryExpenseAcc = await prisma.accAccount.findFirst({ where: { code: "5010" } });
      const bankPayableAcc = await prisma.accAccount.findFirst({ where: { code: "1010" } });
      const taxPayableAcc = await prisma.accAccount.findFirst({ where: { code: "2020" } });
      const loanReceivableAcc = await prisma.accAccount.findFirst({ where: { code: "1050" } });

      if (!salaryExpenseAcc || !bankPayableAcc) {
        throw new Error(
          "ACCOUNT_MAPPING_MISSING: Salary Expense (code 5010) and/or Cash/Bank (code 1010) not found in Chart of Accounts. " +
          "Seed the chart of accounts before running payroll."
        );
      }

      if (totalGross > 0) {
        const netPayCredit = totalGross - totalTax - totalLoan;
        const lines = [
          { account_id: salaryExpenseAcc.id, debit: totalGross, credit: 0, description: `Payroll Gross Salary Expense (${input.month_year})` },
          { account_id: bankPayableAcc.id, debit: 0, credit: netPayCredit, description: `Net Payroll Payable / Bank Disbursement` },
        ];
        if (totalTax > 0) {
          if (!taxPayableAcc) {
            throw new Error(
              "ACCOUNT_MAPPING_MISSING: Tax Payable (code 2020) not found. " +
              "Cannot post payroll with tax deductions without this ledger."
            );
          }
          lines.push({ account_id: taxPayableAcc.id, debit: 0, credit: totalTax, description: `Tax Withholding Payable` });
        }
        if (totalLoan > 0) {
          if (!loanReceivableAcc) {
            throw new Error(
              "ACCOUNT_MAPPING_MISSING: Employee Loan Receivable (code 1050) not found. " +
              "Seed chart of accounts or create this ledger before running payroll with loan deductions."
            );
          }
          lines.push({ account_id: loanReceivableAcc.id, debit: 0, credit: totalLoan, description: `Staff Loan Installment Deduction` });
        }

        await postJournalEntry({
          sourceModule: "HR_PAYROLL",
          sourceReferenceType: "PAYROLL_RUN",
          sourceReferenceId: batchRefId,
          voucherType: "GJV",
          narration: `Payroll Batch Run (${input.month_year}) - Campus #${input.branch_id}`,
          lines,
          autoPost: true,
        });
      }
    } catch (glErr) {
      console.error("GL Posting Trigger Failed (Payroll Run):", glErr);
    }
  }

  return result;
};

export interface PayrollRunMember {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  status: number;
  created_at: string | null;
  salary_sheet_id: number | null;
  net_salary: number | null;
  salary_status: string | null;
}

interface ListRunMembersResult {
  data: PayrollRunMember[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── List a run's members (with the salary sheet each one produced) ────────
export const listRunMembers = async (
  branch_id: number,
  monthYear: string,
  page: number,
  limit: number
): Promise<ListRunMembersResult> => {
  const { month_id, year_id } = splitMonthYear(monthYear);

  const where: Prisma.PayrollEmployeesWhereInput = {
    branch_id,
    month_year: monthYear,
    deleted_at: null,
  };

  const [total, members] = await prisma.$transaction([
    prisma.payrollEmployees.count({ where }),
    prisma.payrollEmployees.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const staffIds = members.map((m) => m.employee_id);

  const [staffRows, sheetRows] = await Promise.all([
    prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, reg_no: true, first_name: true, last_name: true },
    }),
    prisma.erpStaffSalaries.findMany({
      where: { staff_id: { in: staffIds }, branch_id, month_id, year_id, deleted_at: null },
      select: { id: true, staff_id: true, net_salary: true, salary_status: true },
    }),
  ]);

  const staffById = new Map(staffRows.map((s) => [s.id, s]));
  const sheetByStaffId = new Map(sheetRows.map((s) => [s.staff_id, s]));

  const data: PayrollRunMember[] = members.map((m) => {
    const staff = staffById.get(m.employee_id);
    const sheet = sheetByStaffId.get(m.employee_id);
    return {
      id: m.id,
      employee_id: m.employee_id,
      employee_name: staff
        ? [staff.first_name, staff.last_name].filter(Boolean).join(" ") || `Staff #${m.employee_id}`
        : `Staff #${m.employee_id}`,
      reg_no: staff?.reg_no ?? null,
      status: m.status,
      created_at: m.created_at?.toISOString() ?? null,
      salary_sheet_id: sheet?.id ?? null,
      net_salary: sheet?.net_salary ?? null,
      salary_status: sheet?.salary_status ?? null,
    };
  });

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

// ─── Remove a member from a run (soft delete — doesn't touch the sheet) ────
export const removeRunMember = async (id: number): Promise<void> => {
  const existing = await prisma.payrollEmployees.findFirst({ where: { id, deleted_at: null } });
  if (!existing) {
    throw AppError.notFound(`Payroll run member with id ${id} was not found`);
  }

  await prisma.payrollEmployees.update({
    where: { id },
    data: { deleted_at: new Date(), updated_at: new Date() },
  });
};