import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { DEDUCTION_FORMULA_BASE_TYPE, DEDUCTION_FORMULA_DIVISOR_TYPE } from "../constants/payrollDeductionFormula.constants";
import {
  CreateDeductionFormulaInput,
  UpdateDeductionFormulaInput,
} from "../validators/payrollDeductionFormula.validator";

// ─── Shared select ────────────────────────────────────────────────────────
const deductionFormulaSelect = {
  id: true,
  name: true,
  base_type: true,
  divisor_type: true,
  is_default: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.HrPayrollDeductionFormulasSelect;

export type DeductionFormulaRecord = Prisma.HrPayrollDeductionFormulasGetPayload<{
  select: typeof deductionFormulaSelect;
}>;

interface ListDeductionFormulasParams {
  page: number;
  limit: number;
  search?: string;
  status?: number;
}

interface ListDeductionFormulasResult {
  data: DeductionFormulaRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertNameIsUnique = async (name: string, excludeId?: number) => {
  const existing = await prisma.hrPayrollDeductionFormulas.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A deduction formula with this name already exists", {
      name: `Deduction formula '${name}' already exists`,
    });
  }
};

const findDeductionFormulaOrThrow = async (id: number): Promise<DeductionFormulaRecord> => {
  const record = await prisma.hrPayrollDeductionFormulas.findFirst({
    where: { id, deleted_at: null },
    select: deductionFormulaSelect,
  });
  if (!record) {
    throw AppError.notFound(`Deduction formula with id ${id} was not found`);
  }
  return record;
};

// Only one row may be is_default = 1 at a time — enforced here at the app
// layer (same convention as every other uniqueness rule in this codebase,
// e.g. assertNoDuplicateSheet in salary.service.ts). Called inside the same
// create/update call that sets is_default: 1, so it's atomic with the
// write that follows.
const clearOtherDefaults = async (excludeId?: number) => {
  await prisma.hrPayrollDeductionFormulas.updateMany({
    where: { deleted_at: null, is_default: 1, ...(excludeId ? { id: { not: excludeId } } : {}) },
    data: { is_default: 0, updated_at: new Date() },
  });
};

// ─── List deduction formulas ────────────────────────────────────────────────
export const listDeductionFormulas = async (
  params: ListDeductionFormulasParams
): Promise<ListDeductionFormulasResult> => {
  const { page, limit, search, status } = params;

  const where: Prisma.HrPayrollDeductionFormulasWhereInput = {
    deleted_at: null,
    ...(status !== undefined ? { status } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.hrPayrollDeductionFormulas.count({ where }),
    prisma.hrPayrollDeductionFormulas.findMany({
      where,
      select: deductionFormulaSelect,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

export const getDeductionFormulaById = async (id: number): Promise<DeductionFormulaRecord> =>
  findDeductionFormulaOrThrow(id);

// ─── The active formula payroll actually uses ───────────────────────────────
// Returns null when no row is marked default (e.g. right after the
// migration, before HR has configured one) — computeLeaveDeduction in
// payrollRun.service.ts treats that as "skip the deduction, same as
// before" rather than guessing a formula.
export const getDefaultDeductionFormula = async (): Promise<DeductionFormulaRecord | null> => {
  return prisma.hrPayrollDeductionFormulas.findFirst({
    where: { deleted_at: null, status: 1, is_default: 1 },
    select: deductionFormulaSelect,
  });
};

export const createDeductionFormula = async (
  input: CreateDeductionFormulaInput
): Promise<DeductionFormulaRecord> => {
  await assertNameIsUnique(input.name);

  if (input.is_default === 1) {
    await clearOtherDefaults();
  }

  return prisma.hrPayrollDeductionFormulas.create({
    data: {
      name: input.name,
      base_type: input.base_type ?? DEDUCTION_FORMULA_BASE_TYPE.BASIC_SALARY,
      divisor_type: input.divisor_type ?? DEDUCTION_FORMULA_DIVISOR_TYPE.CALENDAR_DAYS_IN_MONTH,
      is_default: input.is_default ?? 0,
      status: input.status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: deductionFormulaSelect,
  });
};

export const updateDeductionFormula = async (
  id: number,
  input: UpdateDeductionFormulaInput
): Promise<DeductionFormulaRecord> => {
  await findDeductionFormulaOrThrow(id);

  if (input.name !== undefined) {
    await assertNameIsUnique(input.name, id);
  }

  if (input.is_default === 1) {
    await clearOtherDefaults(id);
  }

  return prisma.hrPayrollDeductionFormulas.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.base_type !== undefined ? { base_type: input.base_type } : {}),
      ...(input.divisor_type !== undefined ? { divisor_type: input.divisor_type } : {}),
      ...(input.is_default !== undefined ? { is_default: input.is_default } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_at: new Date(),
    },
    select: deductionFormulaSelect,
  });
};

// ─── Delete (soft delete) ───────────────────────────────────────────────────
export const deleteDeductionFormula = async (id: number): Promise<void> => {
  await findDeductionFormulaOrThrow(id);

  await prisma.hrPayrollDeductionFormulas.update({
    where: { id },
    data: { deleted_at: new Date(), updated_at: new Date() },
  });
};
