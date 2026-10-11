import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { YEAR_ACTIVE_STATUS, YEAR_STATUS } from "../constants/year.constants";
import { CreateYearInput, UpdateYearInput } from "../validators/year.validator";

const yearSelect = {
  id: true,
  title: true,
  active_status: true,
  status: true,
  created_by: true,
  last_updated_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.YearsSelect;

export type YearRecord = Prisma.YearsGetPayload<{ select: typeof yearSelect }>;

interface ListYearsParams {
  page: number;
  limit: number;
  search?: string;
  status?: number;
}

interface ListYearsResult {
  data: YearRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const findYearOrThrow = async (id: number): Promise<YearRecord> => {
  const record = await prisma.years.findUnique({ where: { id }, select: yearSelect });
  if (!record) {
    throw AppError.notFound(`Year with id ${id} was not found`);
  }
  return record;
};

const assertYearNotInUse = async (id: number) => {
  const count = await prisma.attendanceSummary.count({ where: { year_id: id } });
  if (count > 0) {
    throw AppError.conflict(`Cannot delete this year — ${count} attendance summary record(s) still use it`, {
      id: "Reassign or remove affected attendance summaries before deleting this year",
    });
  }
};

export const listYears = async (params: ListYearsParams): Promise<ListYearsResult> => {
  const { page, limit, search, status } = params;

  const where: Prisma.YearsWhereInput = {
    ...(status !== undefined ? { status } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, years] = await prisma.$transaction([
    prisma.years.count({ where }),
    prisma.years.findMany({
      where,
      select: yearSelect,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: years,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ─── Active-only lookup (for the Attendance Summary form's year dropdown) ───
export const listActiveYears = async (): Promise<YearRecord[]> => {
  return prisma.years.findMany({
    where: { status: YEAR_STATUS.ACTIVE },
    select: yearSelect,
    orderBy: { id: "desc" },
  });
};

export const getYearById = async (id: number): Promise<YearRecord> => findYearOrThrow(id);

export const createYear = async (input: CreateYearInput, actorId?: number): Promise<YearRecord> => {
  const existing = await prisma.years.findUnique({ where: { id: input.year } });
  if (existing) {
    throw AppError.conflict(`Year ${input.year} already exists`, {
      year: `${input.year} already exists`,
    });
  }

  return prisma.years.create({
    data: {
      id: input.year,
      title: String(input.year),
      status: input.status ?? YEAR_STATUS.ACTIVE,
      active_status: YEAR_ACTIVE_STATUS.NOT_CURRENT,
      created_by: actorId ?? 0,
      last_updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: yearSelect,
  });
};

export const updateYear = async (
  id: number,
  input: UpdateYearInput,
  actorId?: number
): Promise<YearRecord> => {
  await findYearOrThrow(id);

  return prisma.years.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      last_updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: yearSelect,
  });
};

/**
 * Marks exactly one year as "current" (active_status = 1), clearing the
 * flag on every other row in the same transaction — see year.constants.ts
 * for why this is a dedicated endpoint rather than part of the general
 * update.
 */
export const setCurrentYear = async (id: number, actorId?: number): Promise<YearRecord> => {
  await findYearOrThrow(id);

  const [, updated] = await prisma.$transaction([
    prisma.years.updateMany({
      where: { id: { not: id } },
      data: { active_status: YEAR_ACTIVE_STATUS.NOT_CURRENT, updated_at: new Date() },
    }),
    prisma.years.update({
      where: { id },
      data: {
        active_status: YEAR_ACTIVE_STATUS.CURRENT,
        last_updated_by: actorId ?? null,
        updated_at: new Date(),
      },
      select: yearSelect,
    }),
  ]);

  return updated;
};

export const deleteYear = async (id: number): Promise<void> => {
  await findYearOrThrow(id);
  await assertYearNotInUse(id);
  await prisma.years.delete({ where: { id } });
};
