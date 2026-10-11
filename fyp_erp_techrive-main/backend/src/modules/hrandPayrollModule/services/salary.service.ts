import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { calculateProgressiveTax, buildTaxableBaseBreakdown, TaxableBaseComponents, TaxSlabForCalc } from "../utils/tax-calculation.util";
import { calculateAutoEobi, calculateAutoEpf } from "../utils/statutory-calculation.util";
import {
  APPROVAL_FIELDS,
  CEO_APPROVAL_NAME_FIELD,
  CEO_APPROVAL_STATUS_FIELD,
  HR_APPROVAL_STATUS_FIELD,
  HR_APPROVAL_NAME_FIELD,
  PAY_STATUS,
  SALARY_STATUS,
  APPROVAL_STATUS,
} from "../constants/salary.constants";
import { ALLOWANCE_CALCULATION_TYPE } from "../constants/allowanceType.constants";
import {
  CreateSalaryInput,
  UpdateSalaryApprovalInput,
  UpdateSalaryInput,
} from "../validators/salary.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const salarySelect = {
  id: true,
  branch_id: true,
  sheet_code: true,
  name: true,
  ledger_id: true,
  staff_id: true,
  staff_category: true,
  gross_salary: true,
  basic_salary: true,
  medical_allowance: true,
  house_rent_allowance: true,
  conveyance_allowance: true,
  training: true,
  eobi_amount: true,
  epf_amount: true,
  tax_amount: true,
  loan_amount: true,
  remaining_amount: true,
  pay_loan: true,
  description: true,
  net_salary: true,
  pay_status: true,
  other_deduction: true,
  date: true,
  year_id: true,
  month_id: true,
  leaves: true,
  leaves_deduction: true,
  gross_before_adj: true,
  total_epf: true,
  total_eobi: true,
  total_tax: true,
  total_salary: true,
  salary_status: true,
  created_at: true,
  updated_at: true,
  principal_approval_status: true,
  principal_approved_by: true,
  accountant_salary_status: true,
  dgm_salary_status: true,
  gm_salary_status: true,
  ceo_salary_status: true,
  gm_name_salary_approve: true,
  accountant_name_salary_approve: true,
  dgm_name_salary_approve: true,
  ceo_name_salary_approve: true,
  arrears: true,
  remarks: true,
  bank_account: true,
  financial_year: true,
  exempt_amount: true,
  tax_slab_id: true,
} satisfies Prisma.ErpStaffSalariesSelect;

export type SalaryRecord = Prisma.ErpStaffSalariesGetPayload<{ select: typeof salarySelect }>;

// ─── Applied allowances (hr_salary_allowances, joined against
//    hr_allowance_types for display) — this schema has no Prisma
//    @relation fields anywhere (introspected flat), so this join is done
//    manually, same "loadLookupMaps" pattern as report.service.ts /
//    user.service.ts. ─────────────────────────────────────────────────────
export interface AppliedAllowanceView {
  id: number;
  allowance_type_id: number;
  name: string;
  amount: number;
  is_taxable: boolean;
}

export type SalaryRecordWithAllowances = SalaryRecord & {
  allowances: AppliedAllowanceView[];
  // Non-persisted, computed-on-response field: true when tax was
  // auto-calculated and taxableAmount fell in a gap between configured tax
  // slabs (as opposed to no slabs being configured at all), so ₨0 tax was
  // applied silently. Surfaced so whoever creates/edits the sheet sees it
  // instead of it passing unnoticed — fixes audit finding #7 (P3).
  tax_slab_gap_warning?: boolean;
  // Non-persisted, computed-on-response "how was this number calculated"
  // notes — present only when the corresponding figure was auto-calculated
  // this call (not on every GET/list). Rendered behind an info icon next
  // to the Tax/EOBI/EPF fields on the Salary Sheet form (2026-08-22).
  tax_calculation_breakdown?: string | null;
  eobi_calculation_breakdown?: string | null;
  epf_calculation_breakdown?: string | null;
};

interface ListSalaryParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  company_id?: number;
  month_id?: string;
  year_id?: number;
  salary_status?: string;
}

interface ListSalaryResult {
  data: SalaryRecordWithAllowances[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertStaffExists = async (staff_id: number): Promise<{ fullName: string }> => {
  const staff = await prisma.staff.findFirst({
    where: { id: staff_id, deleted_at: null },
    select: { first_name: true, last_name: true },
  });

  if (!staff) {
    throw AppError.badRequest("Employee does not exist", {
      staff_id: `No active employee found with id ${staff_id}`,
    });
  }

  return { fullName: [staff.first_name, staff.last_name].filter(Boolean).join(" ") || `Staff #${staff_id}` };
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

/**
 * One salary sheet per employee per branch per month/year. This app-level
 * check is a fast, friendly pre-check (gives a clear field-level error
 * before any write); the actual guarantee against a race between two
 * concurrent requests is a PARTIAL unique index on
 * (staff_id, branch_id, month_id, year_id) WHERE deleted_at IS NULL — see
 * manual_migrations/2026_08_22_payroll_duplicate_guard_unique_indexes.sql.
 * It isn't expressed as a Prisma `@@unique` in schema.prisma (a plain
 * unique constraint would incorrectly also cover soft-deleted rows), so it
 * won't show up by searching schema.prisma for it — but Prisma still
 * reports a violation of it as a normal P2002 on create(), which the
 * callers of this function convert to a 409 (see salary.controller.ts's
 * handleError and payrollRun.service.ts's per-employee catch block).
 * IMPORTANT: that DB-level protection only exists once the migration SQL
 * file above has actually been run against the database — it is not
 * applied automatically by this codebase.
 */
const assertNoDuplicateSheet = async (
  params: { staff_id: number; branch_id: number; month_id: string; year_id: number },
  excludeId?: number
) => {
  const existing = await prisma.erpStaffSalaries.findFirst({
    where: {
      staff_id: params.staff_id,
      branch_id: params.branch_id,
      month_id: params.month_id,
      year_id: params.year_id,
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict(
      "A salary sheet for this employee, campus, month and year already exists",
      { staff_id: "Edit the existing sheet instead of creating a duplicate" }
    );
  }
};

const findSalaryOrThrow = async (id: number): Promise<SalaryRecord> => {
  const record = await prisma.erpStaffSalaries.findFirst({
    where: { id, deleted_at: null },
    select: salarySelect,
  });

  if (!record) {
    throw AppError.notFound(`Salary sheet with id ${id} was not found`);
  }

  return record;
};

/**
 * Once any approval step has moved past 'Pending', the sheet's core
 * financial fields are locked — only the approval chain itself (a separate
 * action) may still change it. Nothing in the DB enforces this; it mirrors
 * how real payroll sign-off works (numbers shouldn't shift under an
 * approver after they've acted on them).
 */
const assertSheetIsEditable = (record: SalaryRecord, input?: UpdateSalaryInput) => {
  const isLocked = APPROVAL_FIELDS.some((field) => record[field] && record[field] !== "Pending");
  if (!isLocked) return;

  // Once HR has approved/rejected, every core financial field is locked —
  // except `salary_status` itself, which still needs to move on to "Paid"
  // after approval (that's a separate, later step: HR sign-off doesn't
  // mean the money has actually gone out yet). So an update containing
  // ONLY salary_status is still allowed even on a locked sheet; anything
  // else touches the frozen figures and is rejected.
  if (input) {
    const { salary_status, ...rest } = input;
    const touchesOnlyStatus = Object.keys(rest).length === 0;
    if (touchesOnlyStatus) return;
  }

  throw AppError.conflict(
    "This salary sheet has already entered the approval workflow and its core figures can no longer be edited",
    { id: "Only the salary status can still be changed on this sheet" }
  );
};

/**
 * Computes every derived/total column on the sheet from its raw inputs.
 * erp_staff_salaries stores these as independent nullable columns with no
 * generated-column constraint in Postgres, so nothing keeps them consistent
 * except application logic — this is that logic, applied identically on
 * every create/update so the numbers can always be trusted:
 *
 *   gross_before_adj = gross_salary + arrears
 *   total_epf/eobi/tax = straight copies of the epf/eobi/tax amounts
 *     (kept as separate total_* columns because the schema has both —
 *     likely meant to support multiple contributing entries in a future
 *     version; for now there's exactly one of each per sheet)
 *   total_salary = gross_before_adj − (epf + eobi + tax + pay_loan + training
 *                  + other_deduction + leaves_deduction)
 *     (deducts pay_loan — the installment actually being repaid this
 *     period — not loan_amount, which is the outstanding balance and is
 *     purely informational/tracking on the sheet)
 *   net_salary = total_salary (single net figure paid out)
 *   remaining_amount = outstanding loan balance after this month's
 *                       repayment (loan_amount − pay_loan, floored at 0)
 */
const computeTotals = (input: {
  gross_salary: number;
  arrears: number;
  epf_amount: number;
  eobi_amount: number;
  tax_amount: number;
  loan_amount: number;
  training: number;
  other_deduction: number;
  leaves_deduction: number;
  pay_loan: number;
}) => {
  const gross_before_adj = input.gross_salary + input.arrears;
  const deductions =
    input.epf_amount +
    input.eobi_amount +
    input.tax_amount +
    input.pay_loan +
    input.training +
    input.other_deduction +
    input.leaves_deduction;
  const total_salary = gross_before_adj - deductions;
  const remaining_amount = Math.max(0, input.loan_amount - input.pay_loan);

  return {
    gross_before_adj,
    total_epf: input.epf_amount,
    total_eobi: input.eobi_amount,
    total_tax: input.tax_amount,
    total_salary,
    net_salary: total_salary,
    remaining_amount,
  };
};

// ─── Allowances & Auto Tax Calculation (2026-08-14) ─────────────────────────
// See salary.constants.ts's "Allowances & Auto Tax Calculation" note for the
// user-facing behaviour this implements.

interface ResolvedAllowance {
  allowance_type_id: number;
  name: string;
  amount: number;
  is_taxable: boolean;
}

/**
 * Resolves each `{ allowance_type_id, amount? }` entry against
 * hr_allowance_types: an explicit `amount` always wins; otherwise FIXED
 * types use the type's default_value as-is, PERCENTAGE types use
 * default_value% of basic_salary. Throws if any allowance_type_id doesn't
 * exist or is inactive/deleted.
 */
interface AllowanceTypeForResolve {
  id: number;
  name: string;
  calculation_type: string;
  default_value: number;
  is_taxable: number;
  status: number;
}

const resolveAllowances = async (
  entries: { allowance_type_id: number; amount?: number }[],
  basic_salary: number
): Promise<ResolvedAllowance[]> => {
  if (entries.length === 0) return [];

  const ids = [...new Set(entries.map((e) => e.allowance_type_id))];
  const types: AllowanceTypeForResolve[] = await prisma.hrAllowanceTypes.findMany({
    where: { id: { in: ids }, deleted_at: null },
    select: { id: true, name: true, calculation_type: true, default_value: true, is_taxable: true, status: true },
  });
  const typesById = new Map(types.map((t: AllowanceTypeForResolve) => [t.id, t] as const));

  return entries.map((entry) => {
    const type = typesById.get(entry.allowance_type_id);
    if (!type) {
      throw AppError.badRequest("Allowance type does not exist", {
        allowance_type_id: `No allowance type found with id ${entry.allowance_type_id}`,
      });
    }
    const amount =
      entry.amount ??
      (type.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE
        ? (type.default_value / 100) * basic_salary
        : type.default_value);

    return {
      allowance_type_id: type.id,
      name: type.name,
      amount,
      is_taxable: type.is_taxable === 1,
    };
  });
};

/** basic_salary + the three legacy fixed allowances + every resolved
 * dynamic allowance amount, rounded to a whole number (gross_salary is an
 * Int column). */
const computeAutoGrossSalary = (
  input: { basic_salary: number; medical_allowance: number; house_rent_allowance: number; conveyance_allowance: number },
  resolvedAllowances: ResolvedAllowance[]
): number => {
  const allowanceSum = resolvedAllowances.reduce((sum, a) => sum + a.amount, 0);
  return Math.round(
    input.basic_salary + input.medical_allowance + input.house_rent_allowance + input.conveyance_allowance + allowanceSum
  );
};

/**
 * Matches `taxableAmount` against the active hr_tax_slabs for
 * `financial_year` (== fiscal_year_id) and returns the progressive tax due.
 * Returns tax_amount: 0, tax_slab_id: null when no slabs exist yet for
 * that year — the caller's manual tax_amount (if any) is what's used in
 * that case, this function is only reached when none was given.
 * slab_gap_warning is true only when slabs DO exist for the year but none
 * of their ranges cover taxableAmount (a configuration gap) — see
 * calculateProgressiveTax's TaxCalculationResult comment.
 */
const resolveAutoTaxAmount = async (
  financial_year: number,
  taxableAmount: number,
  components: TaxableBaseComponents
): Promise<{
  tax_amount: number;
  tax_slab_id: number | null;
  slab_gap_warning: boolean;
  calculation_breakdown: string | null;
}> => {
  const slabs = await prisma.hrTaxSlabs.findMany({
    where: { fiscal_year_id: financial_year, deleted_at: null, status: 1 },
    select: { id: true, min_amount: true, max_amount: true, fixed_amount: true, tax_percent: true },
  });

  const { tax_amount, matched_slab_id, slab_gap_warning, calculation_breakdown } = calculateProgressiveTax(
    taxableAmount,
    slabs,
    components
  );
  return { tax_amount, tax_slab_id: matched_slab_id, slab_gap_warning, calculation_breakdown };
};

/**
 * Fixes audit finding P-04: auto-calculates EOBI/EPF using the fixed
 * Pakistani formulas (see statutory-calculation.util.ts). No longer reads
 * from a configurable settings table — there's nothing to leave
 * unconfigured, so this always returns real numbers (never null).
 */
const resolveAutoStatutoryContributions = (
  basicSalary: number
): {
  eobi_amount: number;
  eobi_calculation_breakdown: string;
  epf_amount: number;
  epf_calculation_breakdown: string;
} => {
  const eobi = calculateAutoEobi();
  const epf = calculateAutoEpf(basicSalary);

  return {
    eobi_amount: eobi.eobi_amount,
    eobi_calculation_breakdown: eobi.calculation_breakdown,
    epf_amount: epf.epf_amount,
    epf_calculation_breakdown: epf.calculation_breakdown,
  };
};

/** Replaces every hr_salary_allowances row for `salary_id` with
 * `resolved` — the applied set is always a full wholesale replace, never a
 * partial patch, so there's no ambiguity about which allowances are
 * currently on a sheet. Runs inside the same transaction as the sheet
 * write itself so the two never go out of sync. */
const replaceSalaryAllowances = async (
  tx: Prisma.TransactionClient,
  salary_id: number,
  resolved: ResolvedAllowance[]
): Promise<void> => {
  await tx.hrSalaryAllowances.deleteMany({ where: { salary_id } });
  if (resolved.length === 0) return;

  await tx.hrSalaryAllowances.createMany({
    data: resolved.map((a) => ({
      salary_id,
      allowance_type_id: a.allowance_type_id,
      amount: a.amount,
      is_taxable: a.is_taxable ? 1 : 0,
      created_at: new Date(),
      updated_at: new Date(),
    })),
  });
};

/** Loads hr_salary_allowances for one or more sheets, joined against
 * hr_allowance_types for display names — same manual-join convention as
 * user.service.ts's loadEmployeeNames (this schema has no @relation
 * fields). Used to attach `allowances` onto every sheet returned from
 * List/Get. */
const loadAllowancesBySalaryId = async (salaryIds: number[]): Promise<Map<number, AppliedAllowanceView[]>> => {
  if (salaryIds.length === 0) return new Map();

  interface SalaryAllowanceRow {
    id: number;
    salary_id: number;
    allowance_type_id: number;
    amount: number;
    is_taxable: number;
  }
  const rows: SalaryAllowanceRow[] = await prisma.hrSalaryAllowances.findMany({
    where: { salary_id: { in: salaryIds } },
    select: { id: true, salary_id: true, allowance_type_id: true, amount: true, is_taxable: true },
  });
  if (rows.length === 0) return new Map();

  const typeIds = [...new Set(rows.map((r: SalaryAllowanceRow) => r.allowance_type_id))];
  const types: { id: number; name: string }[] = await prisma.hrAllowanceTypes.findMany({
    where: { id: { in: typeIds } },
    select: { id: true, name: true },
  });
  const namesById = new Map(types.map((t: { id: number; name: string }) => [t.id, t.name] as const));

  const bySalaryId = new Map<number, AppliedAllowanceView[]>();
  for (const row of rows) {
    const list = bySalaryId.get(row.salary_id) ?? [];
    list.push({
      id: row.id,
      allowance_type_id: row.allowance_type_id,
      name: namesById.get(row.allowance_type_id) ?? `Allowance #${row.allowance_type_id}`,
      amount: row.amount,
      is_taxable: row.is_taxable === 1,
    });
    bySalaryId.set(row.salary_id, list);
  }
  return bySalaryId;
};

const attachAllowances = async (records: SalaryRecord[]): Promise<SalaryRecordWithAllowances[]> => {
  const map = await loadAllowancesBySalaryId(records.map((r) => r.id));
  const withAllowances = records.map((r) => ({ ...r, allowances: map.get(r.id) ?? [] }));
  return attachTaxBreakdowns(withAllowances);
};

/**
 * "Whenever we hover on tax it should show the exact calculation" —
 * tax_calculation_breakdown used to only exist transiently on the
 * response of a create/update call (see resolveAutoTaxAmount above), so
 * viewing a sheet afterward (a fresh list load, reopening the page) never
 * had anything to show. This reconstructs the exact same breakdown from
 * what's actually stored on the sheet (basic_salary, its allowances'
 * is_taxable flags, exempt_amount, and the tax_slab_id it was matched
 * against) every time a sheet is read, not just right after it's written
 * — so the popover works everywhere, not only in the same session it was
 * saved. If tax_amount was entered manually (tax_slab_id is null), this
 * still explains the taxable-income composition and says so plainly,
 * mirroring the "entered manually" note StatutoryAmountField's popover
 * already gives for EOBI/EPF.
 */
const attachTaxBreakdowns = async (
  records: SalaryRecordWithAllowances[]
): Promise<SalaryRecordWithAllowances[]> => {
  const slabIds = [...new Set(records.map((r) => r.tax_slab_id).filter((id): id is number => id != null))];
  const slabs =
    slabIds.length > 0
      ? await prisma.hrTaxSlabs.findMany({
          where: { id: { in: slabIds } },
          select: { id: true, min_amount: true, max_amount: true, fixed_amount: true, tax_percent: true },
        })
      : [];
  const slabById = new Map<number, TaxSlabForCalc>(slabs.map((s) => [s.id, s]));

  return records.map((r) => {
    if (r.tax_calculation_breakdown) return r; // already set by create/update this same call
    const taxableAllowanceSum = r.allowances.filter((a) => a.is_taxable).reduce((sum, a) => sum + a.amount, 0);
    const components: TaxableBaseComponents = {
      basic_salary: r.basic_salary ?? 0,
      taxable_allowance_sum: taxableAllowanceSum,
      exempt_amount: r.exempt_amount ?? 0,
    };
    const taxableBase = Math.max(0, components.basic_salary + components.taxable_allowance_sum - components.exempt_amount);

    if (r.tax_slab_id == null) {
      const tax_calculation_breakdown =
        taxableBase > 0 || (r.tax_amount ?? 0) > 0
          ? `${buildTaxableBaseBreakdown(components, taxableBase)} This Tax amount (₨${(r.tax_amount ?? 0).toLocaleString()}) was entered manually — no tax-slab formula was applied.`
          : null;
      return { ...r, tax_calculation_breakdown };
    }

    const slab = slabById.get(r.tax_slab_id);
    if (!slab) return { ...r, tax_calculation_breakdown: null };
    const { calculation_breakdown } = calculateProgressiveTax(taxableBase, [slab], components);
    return { ...r, tax_calculation_breakdown: calculation_breakdown };
  });
};

/** Single-record variant of attachAllowances — avoids `const [x] =
 * await attachAllowances([record])`, which TS (correctly, under this
 * project's strict settings) types as possibly undefined since it can't
 * know the array always has exactly one element. */
const attachAllowancesToOne = async (record: SalaryRecord): Promise<SalaryRecordWithAllowances> => {
  const map = await loadAllowancesBySalaryId([record.id]);
  const withAllowances = { ...record, allowances: map.get(record.id) ?? [] };
  // Same array-can-be-empty strictness as the original comment above this
  // function warned about — attachTaxBreakdowns([x]) always returns
  // exactly one element for a one-element input, but TS can't know that,
  // so fall back to the pre-breakdown record rather than asserting non-null.
  const [withTax] = await attachTaxBreakdowns([withAllowances]);
  return withTax ?? withAllowances;
};

// ─── List salary sheets ───────────────────────────────────────────────────────
export const listSalarySheets = async (
  params: ListSalaryParams,
  scope?: RecordScope
): Promise<ListSalaryResult> => {
  const { page, limit, search, staff_id, branch_id, company_id, month_id, year_id, salary_status } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.ErpStaffSalariesWhereInput = {
    deleted_at: null,
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id
      ? { staff_id }
      : {}),
    ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(month_id ? { month_id } : {}),
    ...(year_id ? { year_id } : {}),
    ...(salary_status ? { salary_status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sheet_code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpStaffSalaries.count({ where }),
    prisma.erpStaffSalaries.findMany({
      where,
      select: salarySelect,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: await attachAllowances(data),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ─── Get single salary sheet ─────────────────────────────────────────────────
export const getSalarySheetById = async (
  id: number,
  scope?: RecordScope
): Promise<SalaryRecordWithAllowances> => {
  const record = await findSalaryOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Salary sheet with id ${id} was not found`);
  }
  return attachAllowancesToOne(record);
};

// ─── Create salary sheet ─────────────────────────────────────────────────────
export const createSalarySheet = async (input: CreateSalaryInput): Promise<SalaryRecordWithAllowances> => {
  const { fullName } = await assertStaffExists(input.staff_id);
  await assertBranchExists(input.branch_id);
  await assertNoDuplicateSheet({
    staff_id: input.staff_id,
    branch_id: input.branch_id,
    month_id: input.month_id,
    year_id: input.year_id,
  });

  let basic_salary = input.basic_salary ?? 0;
  const medical_allowance = input.medical_allowance ?? 0;
  const house_rent_allowance = input.house_rent_allowance ?? 0;
  const conveyance_allowance = input.conveyance_allowance ?? 0;
  const exempt_amount = input.exempt_amount ?? 0;

  // If basic_salary is not explicitly provided (or 0) but gross_salary is provided,
  // reverse-calculate basic_salary from gross_salary and allowances (CRUD types):
  if (basic_salary <= 0 && input.gross_salary && input.gross_salary > 0) {
    if (input.allowances && input.allowances.length > 0) {
      const ids = [...new Set(input.allowances.map((e) => e.allowance_type_id))];
      const types = await prisma.hrAllowanceTypes.findMany({
        where: { id: { in: ids }, deleted_at: null },
        select: { id: true, calculation_type: true, default_value: true },
      });
      const typesById = new Map(types.map((t) => [t.id, t] as const));
      let totalPercent = 0;
      let totalFixed = medical_allowance + house_rent_allowance + conveyance_allowance + (input.arrears ?? 0);
      for (const entry of input.allowances) {
        const t = typesById.get(entry.allowance_type_id);
        if (entry.amount !== undefined) {
          totalFixed += entry.amount;
        } else if (t?.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE) {
          totalPercent += t.default_value;
        } else if (t) {
          totalFixed += t.default_value;
        }
      }
      basic_salary = Math.max(0, Math.round((input.gross_salary - totalFixed) / (1 + totalPercent / 100)));
    } else {
      basic_salary = Math.max(0, input.gross_salary - (medical_allowance + house_rent_allowance + conveyance_allowance + (input.arrears ?? 0)));
    }
  }

  // See salary.constants.ts's "Allowances & Auto Tax Calculation" note.
  const resolvedAllowances =
    input.allowances !== undefined ? await resolveAllowances(input.allowances, basic_salary) : [];

  const gross_salary =
    input.gross_salary !== undefined && input.gross_salary > 0
      ? input.gross_salary
      : input.allowances !== undefined
      ? computeAutoGrossSalary(
          { basic_salary, medical_allowance, house_rent_allowance, conveyance_allowance },
          resolvedAllowances
        )
      : input.gross_salary!; // guaranteed by createSalarySchema's refine when allowances is absent

  let tax_amount: number;
  let tax_slab_id: number | null;
  let tax_slab_gap_warning = false;
  let tax_calculation_breakdown: string | null = null;
  if (input.tax_amount !== undefined) {
    tax_amount = input.tax_amount;
    tax_slab_id = null;
  } else {
    const taxableSum = resolvedAllowances.filter((a) => a.is_taxable).reduce((sum, a) => sum + a.amount, 0);
    const taxableBase = Math.max(0, basic_salary + taxableSum - exempt_amount);
    const auto = await resolveAutoTaxAmount(input.financial_year, taxableBase, {
      basic_salary,
      taxable_allowance_sum: taxableSum,
      exempt_amount,
    });
    tax_amount = auto.tax_amount;
    tax_slab_id = auto.tax_slab_id;
    tax_slab_gap_warning = auto.slab_gap_warning;
    tax_calculation_breakdown = auto.calculation_breakdown;
  }

  // Fixes audit finding P-04: auto-calculate EOBI/EPF only when the caller
  // didn't explicitly provide a value — an explicit 0 or any other number
  // is always respected, exactly like tax_amount above. This keeps manual
  // entry fully working for anyone who wants it; auto-calc only fills the
  // gap when nothing was entered at all.
  let eobi_amount = input.eobi_amount;
  let epf_amount = input.epf_amount;
  let eobi_calculation_breakdown: string | null = null;
  let epf_calculation_breakdown: string | null = null;
  if (input.eobi_amount === undefined || input.epf_amount === undefined) {
    const auto = resolveAutoStatutoryContributions(basic_salary);
    if (input.eobi_amount === undefined) {
      eobi_amount = auto.eobi_amount;
      eobi_calculation_breakdown = auto.eobi_calculation_breakdown;
    }
    if (input.epf_amount === undefined) {
      epf_amount = auto.epf_amount;
      epf_calculation_breakdown = auto.epf_calculation_breakdown;
    }
  }

  const totals = computeTotals({
    gross_salary,
    arrears: input.arrears ?? 0,
    epf_amount: epf_amount ?? 0,
    eobi_amount: eobi_amount ?? 0,
    tax_amount,
    loan_amount: input.loan_amount ?? 0,
    training: input.training ?? 0,
    other_deduction: input.other_deduction ?? 0,
    leaves_deduction: input.leaves_deduction ?? 0,
    pay_loan: input.pay_loan ?? 0,
  });

  // sheet_code is generated, not user-entered — guarantees a stable,
  // collision-free code tied to what actually identifies a sheet.
  const sheet_code = `SAL-${input.branch_id}-${input.year_id}-${input.month_id}-${input.staff_id}`;

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.erpStaffSalaries.create({
      data: {
        branch_id: input.branch_id,
        sheet_code,
        name: fullName,
        ledger_id: input.ledger_id,
        staff_id: input.staff_id,
        staff_category: input.staff_category,
        gross_salary,
        basic_salary,
        medical_allowance: String(medical_allowance),
        house_rent_allowance: String(house_rent_allowance),
        conveyance_allowance,
        training: input.training ?? 0,
        eobi_amount: eobi_amount ?? 0,
        epf_amount: epf_amount ?? 0,
        tax_amount,
        exempt_amount,
        tax_slab_id,
        loan_amount: input.loan_amount ?? 0,
        pay_loan: input.pay_loan ?? 0,
        other_deduction: input.other_deduction ?? 0,
        description: input.description,
        pay_status: input.pay_status ?? PAY_STATUS.YES,
        date: new Date(input.date),
        year_id: input.year_id,
        month_id: input.month_id,
        leaves: input.leaves ?? 0,
        leaves_deduction: input.leaves_deduction ?? 0,
        salary_status: input.salary_status ?? SALARY_STATUS.INACTIVE,
        ceo_salary_status: APPROVAL_STATUS.PENDING,
        ceo_name_salary_approve: "Pending",
        arrears: input.arrears ?? 0,
        remarks: input.remarks,
        bank_account: input.bank_account,
        financial_year: input.financial_year,
        ...totals,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: salarySelect,
    });

    if (input.allowances !== undefined) {
      await replaceSalaryAllowances(tx, row.id, resolvedAllowances);
    }

    return row;
  });

  return {
    ...(await attachAllowancesToOne(created)),
    tax_slab_gap_warning,
    tax_calculation_breakdown,
    eobi_calculation_breakdown,
    epf_calculation_breakdown,
  };
};

// ─── Update salary sheet (core fields — locked once approvals start) ───────
export const updateSalarySheet = async (
  id: number,
  input: UpdateSalaryInput
): Promise<SalaryRecordWithAllowances> => {
  const existing = await findSalaryOrThrow(id);
  assertSheetIsEditable(existing, input);

  if (input.staff_id !== undefined && input.staff_id !== existing.staff_id) {
    await assertStaffExists(input.staff_id);
  }
  if (input.branch_id !== undefined && input.branch_id !== existing.branch_id) {
    await assertBranchExists(input.branch_id);
  }

  const nextStaffId = input.staff_id ?? existing.staff_id!;
  const nextBranchId = input.branch_id ?? existing.branch_id;
  const nextMonthId = input.month_id ?? existing.month_id!;
  const nextYearId = input.year_id ?? existing.year_id!;

  if (
    input.staff_id !== undefined ||
    input.branch_id !== undefined ||
    input.month_id !== undefined ||
    input.year_id !== undefined
  ) {
    await assertNoDuplicateSheet(
      { staff_id: nextStaffId, branch_id: nextBranchId, month_id: nextMonthId, year_id: nextYearId },
      id
    );
  }

  let basic_salary = input.basic_salary ?? existing.basic_salary ?? 0;
  const medical_allowance = input.medical_allowance ?? Number(existing.medical_allowance ?? 0);
  const house_rent_allowance = input.house_rent_allowance ?? Number(existing.house_rent_allowance ?? 0);
  const conveyance_allowance = input.conveyance_allowance ?? existing.conveyance_allowance ?? 0;
  const exempt_amount = input.exempt_amount ?? existing.exempt_amount ?? 0;
  const nextFinancialYear = input.financial_year ?? existing.financial_year;

  if (input.basic_salary === undefined && input.gross_salary !== undefined && input.gross_salary > 0) {
    const allowancesToUse = input.allowances ?? (await loadAllowancesBySalaryId([id])).get(id) ?? [];
    if (allowancesToUse.length > 0) {
      const ids = [...new Set(allowancesToUse.map((e) => e.allowance_type_id))];
      const types = await prisma.hrAllowanceTypes.findMany({
        where: { id: { in: ids }, deleted_at: null },
        select: { id: true, calculation_type: true, default_value: true },
      });
      const typesById = new Map(types.map((t) => [t.id, t] as const));
      let totalPercent = 0;
      let totalFixed = medical_allowance + house_rent_allowance + conveyance_allowance + (input.arrears ?? existing.arrears ?? 0);
      for (const entry of allowancesToUse) {
        const t = typesById.get(entry.allowance_type_id);
        if (entry.amount !== undefined) {
          totalFixed += entry.amount;
        } else if (t?.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE) {
          totalPercent += t.default_value;
        } else if (t) {
          totalFixed += t.default_value;
        }
      }
      basic_salary = Math.max(0, Math.round((input.gross_salary - totalFixed) / (1 + totalPercent / 100)));
    } else {
      basic_salary = Math.max(0, input.gross_salary - (medical_allowance + house_rent_allowance + conveyance_allowance + (input.arrears ?? existing.arrears ?? 0)));
    }
  }

  // Allowances are only touched when this request explicitly includes
  // `allowances` — omitting it leaves whatever was previously applied
  // untouched (a partial update of, say, just `remarks` must never wipe
  // out the sheet's allowance selection). See salary.constants.ts.
  const resolvedAllowances =
    input.allowances !== undefined ? await resolveAllowances(input.allowances, basic_salary) : undefined;

  const gross_salary =
    input.gross_salary !== undefined && input.gross_salary > 0
      ? input.gross_salary
      : resolvedAllowances !== undefined
      ? computeAutoGrossSalary(
          { basic_salary, medical_allowance, house_rent_allowance, conveyance_allowance },
          resolvedAllowances
        )
      : input.gross_salary ?? existing.gross_salary;

  // Tax is only auto-recalculated when tax_amount wasn't sent AND
  // something that could actually move the taxable base was — otherwise
  // an update to, say, just `remarks` would silently overwrite a
  // previously-set tax_amount with a fresh (possibly 0) auto-calc.
  const taxInputsChanged =
    input.allowances !== undefined ||
    input.exempt_amount !== undefined ||
    input.basic_salary !== undefined ||
    input.financial_year !== undefined;

  let tax_amount: number;
  let tax_slab_id: number | null;
  let tax_slab_gap_warning = false;
  let tax_calculation_breakdown: string | null = null;
  if (input.tax_amount !== undefined) {
    tax_amount = input.tax_amount;
    tax_slab_id = null;
  } else if (taxInputsChanged) {
    const taxableAllowances = resolvedAllowances ?? [];
    const taxableSum = taxableAllowances.filter((a) => a.is_taxable).reduce((sum, a) => sum + a.amount, 0);
    const taxableBase = Math.max(0, basic_salary + taxableSum - exempt_amount);
    const auto = await resolveAutoTaxAmount(nextFinancialYear, taxableBase, {
      basic_salary,
      taxable_allowance_sum: taxableSum,
      exempt_amount,
    });
    tax_amount = auto.tax_amount;
    tax_slab_id = auto.tax_slab_id;
    tax_slab_gap_warning = auto.slab_gap_warning;
    tax_calculation_breakdown = auto.calculation_breakdown;
  } else {
    tax_amount = existing.tax_amount ?? 0;
    tax_slab_id = existing.tax_slab_id ?? null;
  }

  // Fixes audit finding P-04. Same "explicit value always wins" rule as
  // tax_amount above:
  //   - eobi_amount explicitly sent -> use it verbatim.
  //   - not sent, and nothing was ever set before (existing is falsy) ->
  //     auto-calculate (this is the "employee had no value at all" case,
  //     e.g. a sheet created before this feature existed).
  //   - not sent, existing already has a real value -> leave untouched
  //     (don't silently recompute/override a value someone already set).
  // epf_amount follows the same rule, but ALSO re-auto-calculates when
  // basic_salary changes (its formula depends on it) and epf_amount itself
  // wasn't explicitly resent — same pattern as the percentage-allowance
  // staleness fix in employee.service.ts.
  let eobi_amount = input.eobi_amount ?? existing.eobi_amount ?? 0;
  let epf_amount = input.epf_amount ?? existing.epf_amount ?? 0;
  let eobi_calculation_breakdown: string | null = null;
  let epf_calculation_breakdown: string | null = null;
  const needsAutoEobi = input.eobi_amount === undefined && !existing.eobi_amount;
  const needsAutoEpf =
    input.epf_amount === undefined && (!existing.epf_amount || input.basic_salary !== undefined);
  if (needsAutoEobi || needsAutoEpf) {
    const auto = resolveAutoStatutoryContributions(basic_salary);
    if (needsAutoEobi) {
      eobi_amount = auto.eobi_amount;
      eobi_calculation_breakdown = auto.eobi_calculation_breakdown;
    }
    if (needsAutoEpf) {
      epf_amount = auto.epf_amount;
      epf_calculation_breakdown = auto.epf_calculation_breakdown;
    }
  }

  const totals = computeTotals({
    gross_salary,
    arrears: input.arrears ?? existing.arrears,
    epf_amount,
    eobi_amount,
    tax_amount,
    loan_amount: input.loan_amount ?? existing.loan_amount ?? 0,
    training: input.training ?? existing.training ?? 0,
    other_deduction: input.other_deduction ?? existing.other_deduction ?? 0,
    leaves_deduction: input.leaves_deduction ?? existing.leaves_deduction ?? 0,
    pay_loan: input.pay_loan ?? existing.pay_loan ?? 0,
  });

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.erpStaffSalaries.update({
      where: { id },
      data: {
        ...(input.staff_id !== undefined ? { staff_id: input.staff_id } : {}),
        ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
        ...(input.ledger_id !== undefined ? { ledger_id: input.ledger_id } : {}),
        ...(input.staff_category !== undefined ? { staff_category: input.staff_category } : {}),
        gross_salary,
        basic_salary,
        medical_allowance: String(medical_allowance),
        house_rent_allowance: String(house_rent_allowance),
        conveyance_allowance,
        ...(input.training !== undefined ? { training: input.training } : {}),
        ...(input.eobi_amount !== undefined || needsAutoEobi ? { eobi_amount } : {}),
        ...(input.epf_amount !== undefined || needsAutoEpf ? { epf_amount } : {}),
        tax_amount,
        exempt_amount,
        tax_slab_id,
        ...(input.loan_amount !== undefined ? { loan_amount: input.loan_amount } : {}),
        ...(input.pay_loan !== undefined ? { pay_loan: input.pay_loan } : {}),
        ...(input.other_deduction !== undefined ? { other_deduction: input.other_deduction } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.pay_status !== undefined ? { pay_status: input.pay_status } : {}),
        ...(input.date !== undefined ? { date: new Date(input.date) } : {}),
        ...(input.year_id !== undefined ? { year_id: input.year_id } : {}),
        ...(input.month_id !== undefined ? { month_id: input.month_id } : {}),
        ...(input.leaves !== undefined ? { leaves: input.leaves } : {}),
        ...(input.leaves_deduction !== undefined ? { leaves_deduction: input.leaves_deduction } : {}),
        ...(input.salary_status !== undefined ? { salary_status: input.salary_status } : {}),
        ...(input.arrears !== undefined ? { arrears: input.arrears } : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
        ...(input.bank_account !== undefined ? { bank_account: input.bank_account } : {}),
        ...(input.financial_year !== undefined ? { financial_year: input.financial_year } : {}),
        ...totals,
        updated_at: new Date(),
      },
      select: salarySelect,
    });

    if (resolvedAllowances !== undefined) {
      await replaceSalaryAllowances(tx, row.id, resolvedAllowances);
    }

    return row;
  });

  return {
    ...(await attachAllowancesToOne(updated)),
    tax_slab_gap_warning,
    tax_calculation_breakdown,
    eobi_calculation_breakdown,
    epf_calculation_breakdown,
  };
};

// ─── Update approval (CEO/HR approval step — transitions sheet from Inactive to Active) ──
export const updateSalaryApproval = async (
  id: number,
  input: UpdateSalaryApprovalInput
): Promise<SalaryRecord> => {
  await findSalaryOrThrow(id);

  // Approving here activates the sheet (moves it from Inactive to Active).
  // Rejecting keeps it Inactive/Rejected.
  const approvalStatus = input.ceo_status ?? input.hr_status;
  const approverName = input.ceo_approved_by ?? input.hr_approved_by;

  const statusSync =
    approvalStatus === APPROVAL_STATUS.APPROVED
      ? SALARY_STATUS.ACTIVE
      : approvalStatus === APPROVAL_STATUS.REJECTED
        ? SALARY_STATUS.REJECTED
        : approvalStatus === APPROVAL_STATUS.PENDING
          ? SALARY_STATUS.INACTIVE
          : undefined;

  const updated = await prisma.erpStaffSalaries.update({
    where: { id },
    data: {
      ...(input.ceo_status !== undefined ? { [CEO_APPROVAL_STATUS_FIELD]: input.ceo_status } : {}),
      ...(input.ceo_approved_by !== undefined ? { [CEO_APPROVAL_NAME_FIELD]: input.ceo_approved_by } : {}),
      ...(input.hr_status !== undefined ? { [HR_APPROVAL_STATUS_FIELD]: input.hr_status } : {}),
      ...(input.hr_approved_by !== undefined ? { [HR_APPROVAL_NAME_FIELD]: input.hr_approved_by } : {}),
      ...(approvalStatus !== undefined
        ? {
            [CEO_APPROVAL_STATUS_FIELD]: approvalStatus,
            [HR_APPROVAL_STATUS_FIELD]: approvalStatus,
          }
        : {}),
      ...(approverName !== undefined
        ? {
            [CEO_APPROVAL_NAME_FIELD]: approverName,
            [HR_APPROVAL_NAME_FIELD]: approverName,
          }
        : {}),
      ...(statusSync !== undefined ? { salary_status: statusSync } : {}),
      updated_at: new Date(),
    },
    select: salarySelect,
  });

  return updated;
};

// ─── Delete salary sheet (soft delete — deleted_at exists on this table) ───
export const deleteSalarySheet = async (id: number): Promise<void> => {
  const existing = await findSalaryOrThrow(id);
  assertSheetIsEditable(existing);

  await prisma.erpStaffSalaries.update({
    where: { id },
    data: { deleted_at: new Date(), updated_at: new Date() },
  });
};