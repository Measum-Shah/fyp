import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { INCREMENT_STATUS } from "../constants/increment.constants";
import {
  CreateIncrementInput,
  UpdateIncrementInput,
  UpdateIncrementStatusInput,
} from "../validators/increment.validator";

const incrementSelect = {
  id: true,
  role_id: true,
  staff_type: true,
  user_id: true,
  reason: true,
  basic_salary: true,
  New_salary_increment: true,
  Amount: true,
  increment_date: true,
  created_at: true,
  updated_at: true,
  previous_gross_salary: true,
  status: true,
  branch_id: true,
  created_by: true,
  staff_id: true,
} satisfies Prisma.IncrementPfsSelect;

export type IncrementRecord = Prisma.IncrementPfsGetPayload<{ select: typeof incrementSelect }>;

interface ListIncrementsParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  company_id?: number;
}

interface ListIncrementsResult {
  data: IncrementRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Employee salary snapshot (auto-fill for the New Increment Request form) ─
// Given a staff_id, resolves:
//   - branch_id / company_id ("Campus" / "School") from that employee's
//     actual current assignment (staff.branch_id -> erp_branches.company_id)
//     — the real Employee -> School -> Campus relationship in this schema.
//   - basic_salary / previous_gross_salary from that employee's most recent
//     salary sheet (erp_staff_salaries), falling back to staff.basic_salary
//     when no salary sheet has been generated for them yet.
// Never hardcoded — always read live from the employee's existing records.
export interface StaffSalarySnapshot {
  staff_id: number;
  branch_id: number | null;
  company_id: number | null;
  basic_salary: number;
  previous_gross_salary: number;
}

// branch_id is optional — omitted, it resolves School/Campus from the
// employee's own current assignment (the default when only an Employee has
// been picked). Passed explicitly (the user then changed Campus manually),
// the salary figures are re-derived for that campus instead, since
// erp_staff_salaries is keyed per staff *and* branch.
export const getStaffSalarySnapshot = async (
  staff_id: number,
  branch_id?: number
): Promise<StaffSalarySnapshot> => {
  const staff = await prisma.staff.findFirst({
    where: { id: staff_id, deleted_at: null },
    select: { id: true, branch_id: true, basic_salary: true },
  });

  if (!staff) {
    throw AppError.badRequest("Employee does not exist", {
      staff_id: `No active employee found with id ${staff_id}`,
    });
  }

  const resolvedBranchId = branch_id ?? staff.branch_id ?? undefined;
  const branch = resolvedBranchId
    ? await prisma.erpBranches.findFirst({
        where: { id: resolvedBranchId, deleted_at: null },
        select: { id: true, company_id: true },
      })
    : null;

  const latestSalarySheet = await prisma.erpStaffSalaries.findFirst({
    where: { staff_id, deleted_at: null, ...(branch_id ? { branch_id } : {}) },
    orderBy: [{ year_id: "desc" }, { date: "desc" }, { id: "desc" }],
    select: { basic_salary: true, gross_salary: true },
  });

  return {
    staff_id: staff.id,
    branch_id: branch?.id ?? resolvedBranchId ?? null,
    company_id: branch?.company_id ?? null,
    basic_salary: latestSalarySheet?.basic_salary ?? staff.basic_salary ?? 0,
    previous_gross_salary: latestSalarySheet?.gross_salary ?? 0,
  };
};

const assertStaffExists = async (staff_id: number) => {
  const staff = await prisma.staff.findFirst({ where: { id: staff_id, deleted_at: null }, select: { id: true } });
  if (!staff) {
    throw AppError.badRequest("Employee does not exist", {
      staff_id: `No active employee found with id ${staff_id}`,
    });
  }
};

const assertBranchExists = async (branch_id: number) => {
  const branch = await prisma.erpBranches.findFirst({
    where: { id: branch_id, deleted_at: null },
    select: { id: true },
  });
  if (!branch) {
    throw AppError.badRequest("Campus does not exist", { branch_id: `No campus found with id ${branch_id}` });
  }
};

const findIncrementOrThrow = async (id: number): Promise<IncrementRecord> => {
  const record = await prisma.incrementPfs.findUnique({ where: { id }, select: incrementSelect });
  if (!record) {
    throw AppError.notFound(`Increment request with id ${id} was not found`);
  }
  return record;
};

/** Locked once status has moved past Pending — same reasoning as Salary Sheet / Loans. */
const assertIncrementIsEditable = (record: IncrementRecord) => {
  const isLocked = record.status != null && record.status !== INCREMENT_STATUS.PENDING;
  if (isLocked) {
    throw AppError.conflict("This increment request has already been decided and can no longer be edited", {
      id: "Only Pending increment requests can be edited or deleted",
    });
  }
};

export const listIncrements = async (
  params: ListIncrementsParams,
  scope?: RecordScope
): Promise<ListIncrementsResult> => {
  const { page, limit, search, staff_id, branch_id, company_id } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.IncrementPfsWhereInput = {
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id
      ? { staff_id }
      : {}),
    ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(search ? { reason: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.incrementPfs.count({ where }),
    prisma.incrementPfs.findMany({
      where,
      select: incrementSelect,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

export const getIncrementById = async (id: number, scope?: RecordScope): Promise<IncrementRecord> => {
  const record = await findIncrementOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Increment with id ${id} was not found`);
  }
  return record;
};

export const createIncrement = async (
  input: CreateIncrementInput,
  actorId?: number
): Promise<IncrementRecord> => {
  await assertStaffExists(input.staff_id);
  await assertBranchExists(input.branch_id);

  // New Gross Salary = Previous Gross Salary + Increment Amount — always
  // derived server-side so it can never drift from the two figures it
  // depends on, regardless of what the client sends.
  const newSalaryIncrement = input.previous_gross_salary + input.Amount;

  const created = await prisma.incrementPfs.create({
    data: {
      staff_id: input.staff_id,
      branch_id: input.branch_id,
      reason: input.reason,
      increment_date: input.increment_date,
      basic_salary: input.basic_salary,
      previous_gross_salary: input.previous_gross_salary,
      New_salary_increment: newSalaryIncrement,
      Amount: input.Amount,
      staff_type: input.staff_type,
      role_id: input.role_id,
      user_id: input.user_id,
      status: INCREMENT_STATUS.PENDING,
      // ceo_approval/principal_approval columns still exist on the table
      // (see increment-status-schema-alter.sql) but are no longer driven by
      // the application — left at their DB default.
      created_by: actorId ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: incrementSelect,
  });

  return created;
};

export const updateIncrement = async (
  id: number,
  input: UpdateIncrementInput
): Promise<IncrementRecord> => {
  const existing = await findIncrementOrThrow(id);
  assertIncrementIsEditable(existing);

  if (input.staff_id !== undefined) await assertStaffExists(input.staff_id);
  if (input.branch_id !== undefined) await assertBranchExists(input.branch_id);

  // Recompute New Gross Salary whenever either figure it depends on changes
  // (or neither did, in which case the existing stored value is kept).
  const nextPreviousGross = input.previous_gross_salary ?? existing.previous_gross_salary ?? 0;
  const nextAmount = input.Amount ?? existing.Amount ?? 0;
  const needsRecompute = input.previous_gross_salary !== undefined || input.Amount !== undefined;
  const newSalaryIncrement = needsRecompute ? nextPreviousGross + nextAmount : existing.New_salary_increment;

  const updated = await prisma.incrementPfs.update({
    where: { id },
    data: {
      ...(input.staff_id !== undefined ? { staff_id: input.staff_id } : {}),
      ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      ...(input.increment_date !== undefined ? { increment_date: input.increment_date } : {}),
      ...(input.basic_salary !== undefined ? { basic_salary: input.basic_salary } : {}),
      ...(input.previous_gross_salary !== undefined ? { previous_gross_salary: input.previous_gross_salary } : {}),
      ...(needsRecompute ? { New_salary_increment: newSalaryIncrement } : {}),
      ...(input.Amount !== undefined ? { Amount: input.Amount } : {}),
      ...(input.staff_type !== undefined ? { staff_type: input.staff_type } : {}),
      ...(input.role_id !== undefined ? { role_id: input.role_id } : {}),
      ...(input.user_id !== undefined ? { user_id: input.user_id } : {}),
      updated_at: new Date(),
    },
    select: incrementSelect,
  });

  return updated;
};

export const updateIncrementStatus = async (
  id: number,
  input: UpdateIncrementStatusInput
): Promise<IncrementRecord> => {
  await findIncrementOrThrow(id);

  return prisma.incrementPfs.update({
    where: { id },
    data: {
      status: input.status,
      updated_at: new Date(),
    },
    select: incrementSelect,
  });
};

/** Hard delete (no deleted_at column on this table) — only while status is still Pending. */
export const deleteIncrement = async (id: number): Promise<void> => {
  const existing = await findIncrementOrThrow(id);
  assertIncrementIsEditable(existing);
  await prisma.incrementPfs.delete({ where: { id } });
};