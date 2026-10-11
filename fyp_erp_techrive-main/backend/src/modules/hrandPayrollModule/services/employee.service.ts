import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { PASSWORD_SALT_ROUNDS, EMPLOYEE_STATUS, DISABILITY_STATUS, PAYMENT_TYPE, EMPLOYEE_ID_PREFIX } from "../constants/employee.constants";
import { ALLOWANCE_CALCULATION_TYPE } from "../constants/allowanceType.constants";
import { calculateAutoEobi, calculateAutoEpf } from "../utils/statutory-calculation.util";
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "../validators/employee.validator";

// ─── Shared select — never leak password ────────────────────────────────────
const employeeSelect = {
  id: true,
  reg_no: true,
  branch_id: true,
  user_id: true,
  first_name: true,
  middle_name: true,
  last_name: true,
  father_name: true,
  email: true,
  mobile_1: true,
  mobile_2: true,
  gender: true,
  cnic: true,
  cnic_attachment: true,
  cnic_issue_date: true,
  cnic_expiry_date: true,
  address: true,
  city: true,
  country: true,
  qualification: true,
  staff_type: true,
  staff_type_id: true,
  designation: true,
  designation_id: true,
  department_id: true,
  join_date: true,
  status: true,

  // ─── Personal Details ───────────────────────────────────────────────────
  mother_name: true,
  date_of_birth: true,
  marital_status: true,
  blood_group: true,
  nationality: true,
  mother_tongue: true,
  disability: true,
  disability_description: true,

  // ─── Additional Contact ─────────────────────────────────────────────────
  home_phone: true,
  pemail: true,
  temp_address: true,
  state: true,
  temp_state: true,
  temp_country: true,

  // ─── Professional Profile ────────────────────────────────────────────────
  ntn: true,
  staff_image: true,
  skill: true,
  experience: true,
  other_info: true,
  job_status: true,
  probation: true,
  start_day_contract: true,
  end_day_contract: true,
  expiry_date: true,
  first_registration_code: true,
  reports_to: true,
  replaced_by: true,

  // ─── Salary Structure ────────────────────────────────────────────────────
  payment_type: true,
  basic_salary: true,
  salary: true,
  conveyance: true,
  house_rent: true,
  medical_allowances: true,
  tax_percentage: true,
  epf_amount: true,
  eobi_amount: true,
  bank_account: true,
  salary_per_hour: true,
  hours_worked: true,
  exempt_amount: true,

  created_at: true,
  updated_at: true,
} satisfies Prisma.StaffSelect;

export type EmployeeRecord = Prisma.StaffGetPayload<{ select: typeof employeeSelect }>;

// ─── Default allowances (hr_staff_allowances, joined against
//    hr_allowance_types for display) — same manual-join convention as
//    salary.service.ts's AppliedAllowanceView (this schema has no Prisma
//    @relation fields anywhere). ────────────────────────────────────────
export interface AppliedStaffAllowanceView {
  id: number;
  allowance_type_id: number;
  name: string;
  amount: number;
  is_taxable: boolean;
}

export type EmployeeRecordWithAllowances = EmployeeRecord & {
  allowances: AppliedStaffAllowanceView[];
  // Non-persisted, computed-on-response "how was this number calculated"
  // notes — present only when the corresponding figure was auto-calculated
  // this call (not on every GET/list). Same convention as
  // salary.service.ts's SalaryRecordWithAllowances; the frontend also
  // computes a live client-side preview of these before saving (see
  // utils/statutoryCalculation.ts), so this is mainly useful to anyone
  // calling the API directly.
  eobi_calculation_breakdown?: string | null;
  epf_calculation_breakdown?: string | null;
};

/**
 * Auto-calculates EOBI/EPF from the fixed Pakistani formulas (see
 * statutory-calculation.util.ts) whenever the caller didn't explicitly
 * provide a value — same "explicit value always wins" rule used on Salary
 * Sheets and Increments. An explicit 0 (or any other number) is always
 * respected; auto-calc only fills the gap when nothing was entered at all.
 */
const resolveAutoEmployeeStatutoryContributions = (
  basicSalary: number
): { eobi_amount: number; eobi_calculation_breakdown: string; epf_amount: number; epf_calculation_breakdown: string } => {
  const eobi = calculateAutoEobi();
  const epf = calculateAutoEpf(basicSalary);
  return {
    eobi_amount: eobi.eobi_amount,
    eobi_calculation_breakdown: eobi.calculation_breakdown,
    epf_amount: epf.epf_amount,
    epf_calculation_breakdown: epf.calculation_breakdown,
  };
};

/**
 * Computes the gross-total figure kept in sync with `salary` — the legacy
 * VarChar fallback column `payrollRun.service.ts` reads (`staff.basic_salary
 * ?? parseNumericString(staff.salary)`) when `basic_salary` is null.
 * Writing a gross total here for BOTH payment types, including Visiting
 * Faculty (whose `basic_salary` is intentionally left null), means Payroll
 * Run picks up hourly-paid staff automatically via that same fallback —
 * no changes needed to payrollRun.service.ts itself.
 *
 *  - Permanent (Fixed Salary):        basic_salary + conveyance + house_rent + medical_allowances + allowanceSum
 *  - Visiting Faculty (Per Hour Salary): (salary_per_hour x hours_worked) + allowanceSum
 *
 * allowanceSum is the total of this employee's resolved hr_staff_allowances
 * (see resolveStaffAllowances below) — 0 when none are configured, so this
 * stays fully backward compatible with employees that don't use the
 * dynamic allowance picker at all. Visiting Faculty/Per Hour Salary staff
 * can have allowances too (see resolveAllowanceBasis below), so their
 * allowanceSum is folded in here exactly the same way as Permanent/Fixed
 * Salary staff.
 */
const computeGrossSalary = (
  input: {
    payment_type?: string;
    basic_salary?: number;
    conveyance?: number;
    house_rent?: number;
    medical_allowances?: number;
    salary_per_hour?: number;
    hours_worked?: number;
  },
  allowanceSum = 0
): number | undefined => {
  if (input.payment_type === PAYMENT_TYPE.VISITING_FACULTY) {
    const { salary_per_hour, hours_worked } = input;
    if (salary_per_hour === undefined && hours_worked === undefined && allowanceSum === 0) return undefined;
    return (salary_per_hour ?? 0) * (hours_worked ?? 0) + allowanceSum;
  }

  const { basic_salary, conveyance, house_rent, medical_allowances } = input;
  if (
    basic_salary === undefined &&
    conveyance === undefined &&
    house_rent === undefined &&
    medical_allowances === undefined &&
    allowanceSum === 0
  ) {
    return undefined;
  }
  return (basic_salary ?? 0) + (conveyance ?? 0) + (house_rent ?? 0) + (medical_allowances ?? 0) + allowanceSum;
};

/**
 * The basis PERCENTAGE-type allowances resolve against (see
 * resolveStaffAllowances / recalculatePercentageAllowancesForSalaryChange
 * below): basic_salary for Permanent/Fixed Salary staff, the
 * hours_worked x salary_per_hour product for Visiting Faculty/Per Hour
 * Salary staff — mirrors the step that precedes Allowances in each payment
 * type's calculation flow (Basic Salary → Allowances, or Hours Worked x
 * Rate Per Hour → Allowances).
 */
const resolveAllowanceBasis = (input: {
  payment_type?: string;
  basic_salary?: number;
  salary_per_hour?: number;
  hours_worked?: number;
}): number =>
  input.payment_type === PAYMENT_TYPE.VISITING_FACULTY
    ? (input.salary_per_hour ?? 0) * (input.hours_worked ?? 0)
    : input.basic_salary ?? 0;

/** Parses one of the legacy VarChar-but-numeric staff columns (conveyance/house_rent/medical_allowances) back to a number, e.g. when merging a partial update with what's already stored. */
const parseNumericStringField = (value: string | null | undefined): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

// ─── Auto-generated Employee ID (2026-08-15) ───────────────────────────────
// See employee.constants.ts's note on EMPLOYEE_ID_PREFIX. No DB uniqueness
// constraint exists on reg_no (this schema enforces uniqueness at the
// application layer only, same as email/cnic — see assertUniqueFields), so
// this is a "good enough for the expected write volume" sequential
// generator rather than a DB-level guarantee; a genuine concurrent-create
// race is vanishingly unlikely for an HR onboarding flow.
const generateNextRegNo = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = `${EMPLOYEE_ID_PREFIX}-${year}-`;

  const rows = await prisma.staff.findMany({
    where: { reg_no: { startsWith: prefix } },
    select: { reg_no: true },
  });

  let maxSeq = 0;
  for (const row of rows) {
    const match = row.reg_no?.match(/^[A-Za-z]+-\d{4}-(\d+)$/);
    const captured = match?.[1];
    if (captured) {
      const num = parseInt(captured, 10);
      if (num > maxSeq) maxSeq = num;
    }
  }

  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
};

// ─── Default Allowances (hr_staff_allowances, 2026-08-15) ─────────────────
// See salary.service.ts's identically-shaped resolveAllowances /
// replaceSalaryAllowances / loadAllowancesBySalaryId for the sibling
// implementation this mirrors (per-sheet there, per-employee-default here).

interface ResolvedStaffAllowance {
  allowance_type_id: number;
  name: string;
  amount: number;
  is_taxable: boolean;
}

interface AllowanceTypeForResolve {
  id: number;
  name: string;
  calculation_type: string;
  default_value: number;
  is_taxable: number;
  status: number;
}

/**
 * Resolves each `{ allowance_type_id, amount? }` entry against
 * hr_allowance_types: an explicit `amount` always wins; otherwise FIXED
 * types use the type's default_value as-is, PERCENTAGE types use
 * default_value% of `basis` (basic_salary for Permanent/Fixed Salary
 * staff, hours_worked x salary_per_hour for Visiting Faculty/Per Hour
 * Salary staff — see resolveAllowanceBasis above). Throws if any
 * allowance_type_id doesn't exist or is inactive/deleted.
 */
const resolveStaffAllowances = async (
  entries: { allowance_type_id: number; amount?: number }[],
  basis: number
): Promise<ResolvedStaffAllowance[]> => {
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
        ? (type.default_value / 100) * basis
        : type.default_value);

    return {
      allowance_type_id: type.id,
      name: type.name,
      amount,
      is_taxable: type.is_taxable === 1,
    };
  });
};

/**
 * When the Allowance basis changes (basic_salary for Permanent/Fixed
 * Salary staff, or salary_per_hour/hours_worked for Visiting Faculty/Per
 * Hour Salary staff) but the request doesn't resend `allowances` (a normal
 * single-field salary edit), any PERCENTAGE-type allowances already
 * configured on hr_staff_allowances would otherwise be left at their old
 * dollar amount forever — they're only ever recalculated inside
 * resolveStaffAllowances, which this update path skips whenever
 * `input.allowances` is undefined (see the comment above the `allowances`
 * handling in updateEmployee). This recomputes just the PERCENTAGE entries
 * against the new basis, leaving FIXED entries exactly as they are, so a
 * raise (or a rate/hours change) doesn't silently understate gross
 * salary/payroll every month afterward. Returns undefined (no-op) when
 * there's nothing to recompute.
 */
const recalculatePercentageAllowancesForSalaryChange = async (
  staff_id: number,
  nextBasis: number
): Promise<ResolvedStaffAllowance[] | undefined> => {
  const existing = await prisma.hrStaffAllowances.findMany({
    where: { staff_id },
    select: { allowance_type_id: true, amount: true, is_taxable: true },
  });
  if (existing.length === 0) return undefined;

  const ids = [...new Set(existing.map((e) => e.allowance_type_id))];
  const types: AllowanceTypeForResolve[] = await prisma.hrAllowanceTypes.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, calculation_type: true, default_value: true, is_taxable: true, status: true },
  });
  const typesById = new Map(types.map((t: AllowanceTypeForResolve) => [t.id, t] as const));

  const hasPercentageAllowance = existing.some(
    (e) => typesById.get(e.allowance_type_id)?.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE
  );
  if (!hasPercentageAllowance) return undefined;

  return existing.map((e) => {
    const type = typesById.get(e.allowance_type_id);
    // A type that's since been deleted/deactivated: keep the existing
    // amount/taxability as-is rather than guessing or dropping the row.
    if (!type) {
      return {
        allowance_type_id: e.allowance_type_id,
        name: "",
        amount: e.amount,
        is_taxable: e.is_taxable === 1,
      };
    }
    const amount =
      type.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE
        ? (type.default_value / 100) * nextBasis
        : e.amount;
    return {
      allowance_type_id: type.id,
      name: type.name,
      amount,
      is_taxable: type.is_taxable === 1,
    };
  });
};

/** Replaces every hr_staff_allowances row for `staff_id` with `resolved` —
 * always a full wholesale replace, never a partial patch, run inside the
 * same transaction as the staff write itself. */
const replaceStaffAllowances = async (
  tx: Prisma.TransactionClient,
  staff_id: number,
  resolved: ResolvedStaffAllowance[]
): Promise<void> => {
  await tx.hrStaffAllowances.deleteMany({ where: { staff_id } });
  if (resolved.length === 0) return;

  await tx.hrStaffAllowances.createMany({
    data: resolved.map((a) => ({
      staff_id,
      allowance_type_id: a.allowance_type_id,
      amount: a.amount,
      is_taxable: a.is_taxable ? 1 : 0,
      created_at: new Date(),
      updated_at: new Date(),
    })),
  });
};

/** Loads hr_staff_allowances for one or more employees, joined against
 * hr_allowance_types for display names. Used to attach `allowances` onto
 * every employee record returned from List/Get, and by
 * payrollRun.service.ts's getStaffDefaultAllowances. */
const loadAllowancesByStaffId = async (staffIds: number[]): Promise<Map<number, AppliedStaffAllowanceView[]>> => {
  if (staffIds.length === 0) return new Map();

  interface StaffAllowanceRow {
    id: number;
    staff_id: number;
    allowance_type_id: number;
    amount: number;
    is_taxable: number;
  }
  const rows: StaffAllowanceRow[] = await prisma.hrStaffAllowances.findMany({
    where: { staff_id: { in: staffIds } },
    select: { id: true, staff_id: true, allowance_type_id: true, amount: true, is_taxable: true },
  });
  if (rows.length === 0) return new Map();

  const typeIds = [...new Set(rows.map((r: StaffAllowanceRow) => r.allowance_type_id))];
  const types: { id: number; name: string }[] = await prisma.hrAllowanceTypes.findMany({
    where: { id: { in: typeIds } },
    select: { id: true, name: true },
  });
  const namesById = new Map(types.map((t: { id: number; name: string }) => [t.id, t.name] as const));

  const byStaffId = new Map<number, AppliedStaffAllowanceView[]>();
  for (const row of rows) {
    const list = byStaffId.get(row.staff_id) ?? [];
    list.push({
      id: row.id,
      allowance_type_id: row.allowance_type_id,
      name: namesById.get(row.allowance_type_id) ?? `Allowance #${row.allowance_type_id}`,
      amount: row.amount,
      is_taxable: row.is_taxable === 1,
    });
    byStaffId.set(row.staff_id, list);
  }
  return byStaffId;
};

const attachAllowances = async (records: EmployeeRecord[]): Promise<EmployeeRecordWithAllowances[]> => {
  const map = await loadAllowancesByStaffId(records.map((r) => r.id));
  return records.map((r) => ({ ...r, allowances: map.get(r.id) ?? [] }));
};

const attachAllowancesToOne = async (record: EmployeeRecord): Promise<EmployeeRecordWithAllowances> => {
  const map = await loadAllowancesByStaffId([record.id]);
  return { ...record, allowances: map.get(record.id) ?? [] };
};

/** Read-only accessor for payrollRun.service.ts — the resolved amounts
 * are already persisted on hr_staff_allowances (no re-resolution needed),
 * just returned in the shape createSalarySheet's `allowances` input
 * expects. Returns [] for an employee with no default allowances
 * configured, letting the caller fall back to its own flat calculation. */
export const getStaffDefaultAllowances = async (
  staff_id: number
): Promise<{ allowance_type_id: number; amount: number }[]> => {
  const map = await loadAllowancesByStaffId([staff_id]);
  const rows = map.get(staff_id) ?? [];
  return rows.map((r) => ({ allowance_type_id: r.allowance_type_id, amount: r.amount }));
};

interface ListEmployeesParams {
  page: number;
  limit: number;
  search?: string;
  department_id?: number;
  status?: string;
}

interface ListEmployeesResult {
  data: EmployeeRecordWithAllowances[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Ensures the given department_id exists before we let it be attached to a Staff row. */
const assertDepartmentExists = async (department_id: number) => {
  const department = await prisma.departments.findUnique({
    where: { id: department_id },
  });

  if (!department) {
    throw AppError.badRequest("Department does not exist", {
      department_id: `No department found with id ${department_id}`,
    });
  }
};

// ─── designation_id / staff_type_id resolution (added alongside the real FK
//    migration — see backend/prisma_migrations/001_add_hr_payroll_foreign_keys.sql).
//    The Employee form still submits `designation` / `staff_type` as free-text
//    (matching the `designation` and `staff_type` lookup tables' `name` /
//    `staff_type_code` columns), so every create/update resolves the matching
//    row's id here and stores BOTH the string (unchanged, for any code or
//    report that still reads the string column) and the new id (for the real
//    FK — see fk_staff_designation / fk_staff_staff_type). This mirrors,
//    field-for-field, the case-insensitive/trimmed matching the migration's
//    one-time backfill used, so newly created/edited staff rows resolve
//    exactly the same way the historical backfill did. If no lookup row
//    matches, the id is left undefined (NULL) rather than blocking the
//    save — an unmatched designation/staff_type string is a data-quality
//    issue to flag for cleanup, not a reason to reject an otherwise-valid
//    employee record. ────────────────────────────────────────────────────

/** Resolves a free-text designation name to designation.id via a
 * case-insensitive, trimmed match — same rule the migration's backfill used.
 * Returns undefined (leaves designation_id untouched/NULL) if there's no
 * match or no name was given. */
const resolveDesignationId = async (name?: string | null): Promise<number | undefined> => {
  if (!name || !name.trim()) return undefined;
  const match = await prisma.designation.findFirst({
    where: { deleted_at: null, name: { equals: name.trim(), mode: "insensitive" } },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  return match?.id;
};

/** Resolves a free-text staff_type value to staff_type.id, matching against
 * either staff_type.name or staff_type.staff_type_code (case-insensitive,
 * trimmed) — same two-column rule the migration's backfill used. Returns
 * undefined if there's no match. */
const resolveStaffTypeId = async (staffType?: string | null): Promise<number | undefined> => {
  if (!staffType || !staffType.trim()) return undefined;
  const trimmed = staffType.trim();
  const match = await prisma.staffType.findFirst({
    where: {
      deleted_at: null,
      OR: [
        { name: { equals: trimmed, mode: "insensitive" } },
        { staff_type_code: { equals: trimmed, mode: "insensitive" } },
      ],
    },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  return match?.id;
};

/** Ensures reg_no / email / cnic are not already used by another active employee. */
const assertUniqueFields = async (
  fields: { reg_no?: string; email?: string; cnic?: string },
  excludeId?: number
) => {
  const orConditions: Prisma.StaffWhereInput[] = [];

  if (fields.reg_no) orConditions.push({ reg_no: fields.reg_no });
  if (fields.email) orConditions.push({ email: fields.email });
  if (fields.cnic) orConditions.push({ cnic: fields.cnic });

  if (orConditions.length === 0) return;

  const existing = await prisma.staff.findFirst({
    where: {
      deleted_at: null,
      OR: orConditions,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, reg_no: true, email: true, cnic: true },
  });

  if (!existing) return;

  if (fields.reg_no && existing.reg_no === fields.reg_no) {
    throw AppError.conflict("Employee ID is already in use", {
      reg_no: `Employee ID '${fields.reg_no}' already exists`,
    });
  }
  if (fields.email && existing.email === fields.email) {
    throw AppError.conflict("Email is already in use", {
      email: `Email '${fields.email}' already exists`,
    });
  }
  if (fields.cnic && existing.cnic === fields.cnic) {
    throw AppError.conflict("CNIC is already in use", {
      cnic: `CNIC '${fields.cnic}' already exists`,
    });
  }
};

const findActiveEmployeeOrThrow = async (id: number) => {
  const employee = await prisma.staff.findFirst({
    where: { id, deleted_at: null },
    select: employeeSelect,
  });

  if (!employee) {
    throw AppError.notFound(`Employee with id ${id} was not found`);
  }

  return employee;
};

// ─── List employees ──────────────────────────────────────────────────────────
export const listEmployees = async (
  params: ListEmployeesParams,
  scope?: RecordScope
): Promise<ListEmployeesResult> => {
  const { page, limit, search, department_id, status } = params;

  const where: Prisma.StaffWhereInput = {
    deleted_at: null,
    // A self-scoped caller's own id — not the query's department_id/status
    // filters, which still apply on top (an "Employee" role member gets
    // {id: their own id} intersected with whatever else they searched for,
    // which in practice just means their one record either matches or the
    // list comes back empty).
    ...(scope && scope.restrictToEmployeeId !== null ? { id: scope.restrictToEmployeeId } : {}),
    ...(department_id ? { department_id } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { reg_no: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.staff.count({ where }),
    prisma.staff.findMany({
      where,
      select: employeeSelect,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: await attachAllowances(data),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

// ─── Get single employee ─────────────────────────────────────────────────────
export const getEmployeeById = async (id: number, scope?: RecordScope): Promise<EmployeeRecordWithAllowances> => {
  const employee = await findActiveEmployeeOrThrow(id);

  if (scope && !isWithinScope(scope, employee.id)) {
    // 404, not 403 — a self-scoped caller shouldn't be able to tell "this
    // id doesn't exist" apart from "this id exists but isn't yours" by
    // probing status codes.
    throw AppError.notFound(`Employee with id ${id} was not found`);
  }

  return attachAllowancesToOne(employee);
};

// ─── Create employee ──────────────────────────────────────────────────────────
export const createEmployee = async (
  input: CreateEmployeeInput
): Promise<EmployeeRecordWithAllowances> => {
  await assertDepartmentExists(input.department_id);
  await assertUniqueFields({
    // reg_no intentionally omitted — it's server-generated below, so
    // there's nothing client-supplied left to collide with.
    email: input.email,
    cnic: input.cnic,
  });

  // Account Access (Linked ERP User ID + Password) is no longer part of
  // this form — creating/linking a login is done exclusively via the
  // Users page (Sessions & Activity), which syncs staff.user_id back onto
  // this record itself once a login is actually linked (see
  // user.service.ts's createUser/updateUser). Both staff.user_id and
  // staff.password are NOT NULL columns with no default, so something
  // still has to go in them at creation time:
  //   user_id: 0 means "not yet linked to any login" — a genuine login's
  //            erp_users.id is always >= 1 (auto-increment), so 0 can
  //            never collide with a real account and every lookup that
  //            matches on staff.user_id already only matches positive ids.
  //   password: a random value nothing ever reads back out — every actual
  //            login check goes through erp_users' own password (see
  //            auth.controller.ts's login()), never this column. It's
  //            hashed the same way regardless, purely so a stray future
  //            read of it can't recover anything meaningful.
  const reg_no = await generateNextRegNo();

  // Resolve the real FK ids alongside the free-text strings — see the note
  // above resolveDesignationId/resolveStaffTypeId.
  const [designation_id, staff_type_id] = await Promise.all([
    resolveDesignationId(input.designation),
    resolveStaffTypeId(input.staff_type),
  ]);

  // See salary.constants.ts's "Allowances & Auto Tax Calculation" note for
  // the sibling behaviour on a Salary Sheet — this is the same idea one
  // level up, on the employee's default Salary Structure.
  const resolvedAllowances =
    input.allowances !== undefined
      ? await resolveStaffAllowances(input.allowances, resolveAllowanceBasis(input))
      : [];
  const allowanceSum = resolvedAllowances.reduce((sum, a) => sum + a.amount, 0);

  // Auto-calculate EOBI/EPF from Basic Salary whenever they weren't
  // explicitly provided — see resolveAutoEmployeeStatutoryContributions.
  let eobi_amount = input.eobi_amount;
  let epf_amount = input.epf_amount;
  let eobi_calculation_breakdown: string | null = null;
  let epf_calculation_breakdown: string | null = null;
  if (input.eobi_amount === undefined || input.epf_amount === undefined) {
    const auto = resolveAutoEmployeeStatutoryContributions(input.basic_salary ?? 0);
    if (input.eobi_amount === undefined) {
      eobi_amount = auto.eobi_amount;
      eobi_calculation_breakdown = auto.eobi_calculation_breakdown;
    }
    if (input.epf_amount === undefined) {
      epf_amount = auto.epf_amount;
      epf_calculation_breakdown = auto.epf_calculation_breakdown;
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.staff.create({
      data: {
        reg_no,
        first_name: input.first_name,
        last_name: input.last_name,
        father_name: input.father_name,
        email: input.email,
        mobile_1: input.mobile_1,
        mobile_2: input.mobile_2,
        gender: input.gender,
        cnic: input.cnic,
        cnic_attachment: input.cnic_attachment,
        cnic_issue_date: input.cnic_issue_date ? new Date(input.cnic_issue_date) : undefined,
        cnic_expiry_date: input.cnic_expiry_date ? new Date(input.cnic_expiry_date) : undefined,
        address: input.address,
        city: input.city,
        country: input.country,
        qualification: input.qualification,
        staff_type: input.staff_type,
        staff_type_id,
        designation: input.designation,
        designation_id,
        department_id: input.department_id,
        join_date: new Date(input.join_date),
        branch_id: input.branch_id,
        user_id: 0,
        password: await bcrypt.hash(crypto.randomUUID(), PASSWORD_SALT_ROUNDS),
        status: input.status ?? EMPLOYEE_STATUS.ACTIVE,

        mother_name: input.mother_name,
        date_of_birth: input.date_of_birth,
        marital_status: input.marital_status,
        blood_group: input.blood_group,
        nationality: input.nationality,
        mother_tongue: input.mother_tongue,
        disability: input.disability ?? DISABILITY_STATUS.NO,
        disability_description: input.disability_description,

        home_phone: input.home_phone,
        pemail: input.pemail,
        temp_address: input.temp_address,
        state: input.state,
        temp_state: input.temp_state,
        temp_country: input.temp_country,

        ntn: input.ntn,
        staff_image: input.staff_image,
        skill: input.skill,
        experience: input.experience,
        other_info: input.other_info,
        job_status: input.job_status,
        probation: input.probation,
        start_day_contract: input.start_day_contract,
        end_day_contract: input.end_day_contract,
        expiry_date: input.expiry_date ? new Date(input.expiry_date) : undefined,
        first_registration_code: input.first_registration_code,
        reports_to: input.reports_to,
        replaced_by: input.replaced_by,

        // ─── Salary Structure ───────────────────────────────────────────────
        payment_type: input.payment_type,
        basic_salary: input.basic_salary,
        conveyance: input.conveyance !== undefined ? String(input.conveyance) : undefined,
        house_rent: input.house_rent !== undefined ? String(input.house_rent) : undefined,
        medical_allowances: input.medical_allowances !== undefined ? String(input.medical_allowances) : undefined,
        tax_percentage: input.tax_percentage,
        epf_amount,
        eobi_amount,
        bank_account: input.bank_account,
        // Visiting Faculty pay — rate/hour x hours worked.
        salary_per_hour: input.salary_per_hour !== undefined ? String(input.salary_per_hour) : undefined,
        hours_worked: input.hours_worked,
        exempt_amount: input.exempt_amount ?? 0,
        // `salary` is a legacy VarChar fallback Payroll Run only reads when
        // basic_salary is null (see payrollRun.service.ts) — kept in sync as
        // the gross total (Permanent: sum of allowances; Visiting Faculty:
        // rate x hours) so the two never disagree.
        salary:
          computeGrossSalary(input, allowanceSum) !== undefined
            ? String(computeGrossSalary(input, allowanceSum))
            : undefined,

        created_at: new Date(),
        updated_at: new Date(),
        // Legacy, non-nullable columns on `staff` with no equivalent in the
        // Employee Management or Payroll UI yet — defaulted here only because
        // the schema forbids NULL and cannot be redesigned.
        epf_description: "",
        epf_opening_amount: 0,
        eobi_opening_amount: 0,
      },
      select: employeeSelect,
    });

    if (input.allowances !== undefined) {
      await replaceStaffAllowances(tx, row.id, resolvedAllowances);
    }

    return row;
  });

  return {
    ...(await attachAllowancesToOne(created)),
    eobi_calculation_breakdown,
    epf_calculation_breakdown,
  };
};

// ─── Update employee ──────────────────────────────────────────────────────────
export const updateEmployee = async (
  id: number,
  input: UpdateEmployeeInput
): Promise<EmployeeRecordWithAllowances> => {
  const existingEmployee = await findActiveEmployeeOrThrow(id);

  if (input.department_id !== undefined) {
    await assertDepartmentExists(input.department_id);
  }

  await assertUniqueFields(
    {
      reg_no: input.reg_no,
      email: input.email,
      cnic: input.cnic,
    },
    id
  );

  const data: Prisma.StaffUpdateInput & Record<string, unknown> = {
    ...(input.reg_no !== undefined ? { reg_no: input.reg_no } : {}),
    ...(input.first_name !== undefined ? { first_name: input.first_name } : {}),
    ...(input.last_name !== undefined ? { last_name: input.last_name } : {}),
    ...(input.father_name !== undefined ? { father_name: input.father_name } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.mobile_1 !== undefined ? { mobile_1: input.mobile_1 } : {}),
    ...(input.mobile_2 !== undefined ? { mobile_2: input.mobile_2 } : {}),
    ...(input.gender !== undefined ? { gender: input.gender } : {}),
    ...(input.cnic !== undefined ? { cnic: input.cnic } : {}),
    ...(input.cnic_attachment !== undefined ? { cnic_attachment: input.cnic_attachment } : {}),
    ...(input.cnic_issue_date !== undefined
      ? { cnic_issue_date: input.cnic_issue_date ? new Date(input.cnic_issue_date) : null }
      : {}),
    ...(input.cnic_expiry_date !== undefined
      ? { cnic_expiry_date: input.cnic_expiry_date ? new Date(input.cnic_expiry_date) : null }
      : {}),
    ...(input.address !== undefined ? { address: input.address } : {}),
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.country !== undefined ? { country: input.country } : {}),
    ...(input.qualification !== undefined ? { qualification: input.qualification } : {}),
    ...(input.staff_type !== undefined ? { staff_type: input.staff_type } : {}),
    ...(input.designation !== undefined ? { designation: input.designation } : {}),
    ...(input.department_id !== undefined ? { department_id: input.department_id } : {}),
    ...(input.join_date !== undefined ? { join_date: new Date(input.join_date) } : {}),
    ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
    // user_id intentionally has no branch here — it's no longer editable
    // via this form (see createEmployee's comment above); it only ever
    // changes through user.service.ts's create/update/delete User sync.
    ...(input.status !== undefined ? { status: input.status } : {}),

    ...(input.mother_name !== undefined ? { mother_name: input.mother_name } : {}),
    ...(input.date_of_birth !== undefined ? { date_of_birth: input.date_of_birth } : {}),
    ...(input.marital_status !== undefined ? { marital_status: input.marital_status } : {}),
    ...(input.blood_group !== undefined ? { blood_group: input.blood_group } : {}),
    ...(input.nationality !== undefined ? { nationality: input.nationality } : {}),
    ...(input.mother_tongue !== undefined ? { mother_tongue: input.mother_tongue } : {}),
    ...(input.disability !== undefined ? { disability: input.disability } : {}),
    ...(input.disability_description !== undefined
      ? { disability_description: input.disability_description }
      : {}),

    ...(input.home_phone !== undefined ? { home_phone: input.home_phone } : {}),
    ...(input.pemail !== undefined ? { pemail: input.pemail } : {}),
    ...(input.temp_address !== undefined ? { temp_address: input.temp_address } : {}),
    ...(input.state !== undefined ? { state: input.state } : {}),
    ...(input.temp_state !== undefined ? { temp_state: input.temp_state } : {}),
    ...(input.temp_country !== undefined ? { temp_country: input.temp_country } : {}),

    ...(input.ntn !== undefined ? { ntn: input.ntn } : {}),
    ...(input.staff_image !== undefined ? { staff_image: input.staff_image } : {}),
    ...(input.skill !== undefined ? { skill: input.skill } : {}),
    ...(input.experience !== undefined ? { experience: input.experience } : {}),
    ...(input.other_info !== undefined ? { other_info: input.other_info } : {}),
    ...(input.job_status !== undefined ? { job_status: input.job_status } : {}),
    ...(input.probation !== undefined ? { probation: input.probation } : {}),
    ...(input.start_day_contract !== undefined
      ? { start_day_contract: input.start_day_contract }
      : {}),
    ...(input.end_day_contract !== undefined ? { end_day_contract: input.end_day_contract } : {}),
    ...(input.expiry_date !== undefined ? { expiry_date: new Date(input.expiry_date) } : {}),
    ...(input.first_registration_code !== undefined
      ? { first_registration_code: input.first_registration_code }
      : {}),
    ...(input.reports_to !== undefined ? { reports_to: input.reports_to } : {}),
    ...(input.replaced_by !== undefined ? { replaced_by: input.replaced_by } : {}),

    // ─── Salary Structure ───────────────────────────────────────────────
    ...(input.payment_type !== undefined ? { payment_type: input.payment_type } : {}),
    ...(input.basic_salary !== undefined ? { basic_salary: input.basic_salary } : {}),
    ...(input.conveyance !== undefined ? { conveyance: String(input.conveyance) } : {}),
    ...(input.house_rent !== undefined ? { house_rent: String(input.house_rent) } : {}),
    ...(input.medical_allowances !== undefined ? { medical_allowances: String(input.medical_allowances) } : {}),
    ...(input.tax_percentage !== undefined ? { tax_percentage: input.tax_percentage } : {}),
    ...(input.bank_account !== undefined ? { bank_account: input.bank_account } : {}),
    ...(input.salary_per_hour !== undefined ? { salary_per_hour: String(input.salary_per_hour) } : {}),
    ...(input.hours_worked !== undefined ? { hours_worked: input.hours_worked } : {}),
    ...(input.exempt_amount !== undefined ? { exempt_amount: input.exempt_amount } : {}),

    updated_at: new Date(),
  };

  // Auto-calculate EOBI/EPF the same way as createEmployee, but only when
  // nothing usable exists yet — same "explicit value always wins, else
  // fill the gap" rule as Salary Sheets. epf_amount additionally
  // re-auto-calculates when basic_salary changes and epf_amount itself
  // wasn't explicitly resent, since its formula depends on it.
  const nextBasicSalaryForStatutory = input.basic_salary ?? existingEmployee.basic_salary ?? 0;
  const needsAutoEobi = input.eobi_amount === undefined && !existingEmployee.eobi_amount;
  const needsAutoEpf =
    input.epf_amount === undefined && (!existingEmployee.epf_amount || input.basic_salary !== undefined);

  let eobi_calculation_breakdown: string | null = null;
  let epf_calculation_breakdown: string | null = null;
  if (needsAutoEobi || needsAutoEpf) {
    const auto = resolveAutoEmployeeStatutoryContributions(nextBasicSalaryForStatutory);
    if (needsAutoEobi) {
      data.eobi_amount = auto.eobi_amount;
      eobi_calculation_breakdown = auto.eobi_calculation_breakdown;
    }
    if (needsAutoEpf) {
      data.epf_amount = auto.epf_amount;
      epf_calculation_breakdown = auto.epf_calculation_breakdown;
    }
  }
  if (input.eobi_amount !== undefined) data.eobi_amount = input.eobi_amount;
  if (input.epf_amount !== undefined) data.epf_amount = input.epf_amount;

  // Keep designation_id / staff_type_id in sync with the free-text columns
  // whenever they change — same resolution rule as createEmployee (and the
  // one-time migration backfill). If the string is being cleared, the id is
  // cleared too so a stale mismatched id can never persist.
  if (input.designation !== undefined) {
    data.designation_id = input.designation ? (await resolveDesignationId(input.designation)) ?? null : null;
  }
  if (input.staff_type !== undefined) {
    data.staff_type_id = (await resolveStaffTypeId(input.staff_type)) ?? null;
  }

  // Allowances are only touched when this request explicitly includes
  // `allowances` — omitting it leaves whatever was previously configured
  // untouched (a partial update of, say, just `bank_account` must never
  // wipe out the employee's default allowance selection). See
  // salary.constants.ts's identical note for the Salary Sheet form.
  let resolvedAllowances: ResolvedStaffAllowance[] | undefined;

  // `salary` (legacy gross-total fallback) only needs recomputing when one
  // of its relevant inputs actually changed — merged with whatever's
  // already on the row so a partial update (e.g. just `basic_salary`)
  // doesn't zero out allowances/hours that weren't part of this request.
  if (
    input.payment_type !== undefined ||
    input.basic_salary !== undefined ||
    input.conveyance !== undefined ||
    input.house_rent !== undefined ||
    input.medical_allowances !== undefined ||
    input.salary_per_hour !== undefined ||
    input.hours_worked !== undefined ||
    input.allowances !== undefined
  ) {
    const existing = await prisma.staff.findUnique({
      where: { id },
      select: {
        payment_type: true,
        basic_salary: true,
        conveyance: true,
        house_rent: true,
        medical_allowances: true,
        salary_per_hour: true,
        hours_worked: true,
      },
    });

    const nextBasicSalary = input.basic_salary ?? existing?.basic_salary ?? undefined;
    const nextPaymentType = input.payment_type ?? existing?.payment_type ?? undefined;
    const nextSalaryPerHour = input.salary_per_hour ?? parseNumericStringField(existing?.salary_per_hour);
    const nextHoursWorked = input.hours_worked ?? existing?.hours_worked ?? undefined;
    const nextAllowanceBasis = resolveAllowanceBasis({
      payment_type: nextPaymentType,
      basic_salary: nextBasicSalary,
      salary_per_hour: nextSalaryPerHour,
      hours_worked: nextHoursWorked,
    });

    if (input.allowances !== undefined) {
      resolvedAllowances = await resolveStaffAllowances(input.allowances, nextAllowanceBasis);
    } else if (
      input.basic_salary !== undefined ||
      input.salary_per_hour !== undefined ||
      input.hours_worked !== undefined
    ) {
      // The Allowance basis changed but this request didn't resend
      // `allowances` — re-resolve any PERCENTAGE-type allowances already
      // on file against the new basis so they don't go stale (see the
      // function's comment).
      resolvedAllowances = await recalculatePercentageAllowancesForSalaryChange(id, nextAllowanceBasis);
    }
    const allowanceSum = resolvedAllowances?.reduce((sum, a) => sum + a.amount, 0) ?? 0;

    const gross = computeGrossSalary(
      {
        payment_type: input.payment_type ?? existing?.payment_type ?? undefined,
        basic_salary: nextBasicSalary,
        conveyance: input.conveyance ?? parseNumericStringField(existing?.conveyance),
        house_rent: input.house_rent ?? parseNumericStringField(existing?.house_rent),
        medical_allowances: input.medical_allowances ?? parseNumericStringField(existing?.medical_allowances),
        salary_per_hour: input.salary_per_hour ?? parseNumericStringField(existing?.salary_per_hour),
        hours_worked: input.hours_worked ?? existing?.hours_worked ?? undefined,
      },
      allowanceSum
    );
    if (gross !== undefined) {
      data.salary = String(gross);
    }
  }

  // Password is no longer settable from this form either — see
  // createEmployee's comment above; it's a dead column that no login
  // check ever reads, and the real login password lives on erp_users,
  // managed exclusively via the Users page.

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.staff.update({
      where: { id },
      data,
      select: employeeSelect,
    });

    if (resolvedAllowances !== undefined) {
      await replaceStaffAllowances(tx, row.id, resolvedAllowances);
    }

    return row;
  });

  return {
    ...(await attachAllowancesToOne(updated)),
    eobi_calculation_breakdown,
    epf_calculation_breakdown,
  };
};

// ─── Delete (soft-delete) employee ─────────────────────────────────────────────
export const deleteEmployee = async (
  id: number,
  deletedBy?: number
): Promise<void> => {
  await findActiveEmployeeOrThrow(id);

  await prisma.staff.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      status: EMPLOYEE_STATUS.INACTIVE,
      updated_at: new Date(),
    },
  });
};