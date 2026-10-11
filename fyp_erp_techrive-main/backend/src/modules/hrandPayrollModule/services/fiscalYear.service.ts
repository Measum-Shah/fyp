import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { CreateFiscalYearInput, UpdateFiscalYearInput } from "../validators/fiscalYear.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const fiscalYearSelect = {
  id: true,
  name: true,
  start_date: true,
  end_date: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpFinancialYearsSelect;

export type FiscalYearRecord = Prisma.ErpFinancialYearsGetPayload<{ select: typeof fiscalYearSelect }>;

interface ListFiscalYearsParams {
  page: number;
  limit: number;
  search?: string;
  status?: number;
}

interface ListFiscalYearsResult {
  data: FiscalYearRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const findFiscalYearOrThrow = async (id: number): Promise<FiscalYearRecord> => {
  const record = await prisma.erpFinancialYears.findFirst({
    where: { id, deleted_at: null },
    select: fiscalYearSelect,
  });
  if (!record) {
    throw AppError.notFound(`Fiscal year with id ${id} was not found`);
  }
  return record;
};

/**
 * Overlapping fiscal years would make "which fiscal year is this salary
 * sheet under" ambiguous for the Salary form's dropdown — enforced here at
 * the application layer, no DB constraint exists for it.
 */
const assertNoOverlap = async (start_date: Date, end_date: Date, excludeId?: number) => {
  const overlapping = await prisma.erpFinancialYears.findFirst({
    where: {
      deleted_at: null,
      start_date: { lte: end_date },
      end_date: { gte: start_date },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, name: true },
  });

  if (overlapping) {
    throw AppError.conflict(`This date range overlaps with the existing fiscal year "${overlapping.name}"`, {
      start_date: "Fiscal year date ranges cannot overlap",
    });
  }
};

// ─── List fiscal years ────────────────────────────────────────────────────────
export const listFiscalYears = async (params: ListFiscalYearsParams): Promise<ListFiscalYearsResult> => {
  const { page, limit, search, status } = params;

  const where: Prisma.ErpFinancialYearsWhereInput = {
    deleted_at: null,
    ...(status !== undefined ? { status } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpFinancialYears.count({ where }),
    prisma.erpFinancialYears.findMany({
      where,
      select: fiscalYearSelect,
      orderBy: { start_date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

// ─── Lookup — all active fiscal years, unpaginated (dropdowns) ─────────────
export const listFiscalYearLookup = async (): Promise<{ id: number; name: string }[]> => {
  const rows = await prisma.erpFinancialYears.findMany({
    where: { deleted_at: null, status: 1 },
    select: { id: true, name: true },
    orderBy: { start_date: "desc" },
  });
  return rows;
};

export const getFiscalYearById = async (id: number): Promise<FiscalYearRecord> => findFiscalYearOrThrow(id);

export const createFiscalYear = async (input: CreateFiscalYearInput): Promise<FiscalYearRecord> => {
  const start_date = new Date(input.start_date);
  const end_date = new Date(input.end_date);
  await assertNoOverlap(start_date, end_date);

  return prisma.erpFinancialYears.create({
    data: {
      name: input.name,
      start_date,
      end_date,
      status: input.status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: fiscalYearSelect,
  });
};

export const updateFiscalYear = async (id: number, input: UpdateFiscalYearInput): Promise<FiscalYearRecord> => {
  const existing = await findFiscalYearOrThrow(id);

  const nextStart = input.start_date ? new Date(input.start_date) : existing.start_date;
  const nextEnd = input.end_date ? new Date(input.end_date) : existing.end_date;
  if (input.start_date !== undefined || input.end_date !== undefined) {
    await assertNoOverlap(nextStart, nextEnd, id);
  }

  return prisma.erpFinancialYears.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.start_date !== undefined ? { start_date: nextStart } : {}),
      ...(input.end_date !== undefined ? { end_date: nextEnd } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_at: new Date(),
    },
    select: fiscalYearSelect,
  });
};

// ─── Delete fiscal year (soft delete — deleted_at exists on this table) ────
export const deleteFiscalYear = async (id: number): Promise<void> => {
  await findFiscalYearOrThrow(id);

  await prisma.erpFinancialYears.update({
    where: { id },
    data: { deleted_at: new Date(), updated_at: new Date() },
  });
};
