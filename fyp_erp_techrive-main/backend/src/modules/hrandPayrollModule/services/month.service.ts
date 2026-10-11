import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { MONTH_STATUS } from "../constants/month.constants";
import { CreateMonthInput, UpdateMonthInput } from "../validators/month.validator";

const monthSelect = {
  id: true,
  title: true,
  status: true,
  created_by: true,
  last_updated_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.MonthsSelect;

export type MonthRecord = Prisma.MonthsGetPayload<{ select: typeof monthSelect }>;

interface ListMonthsParams {
  page: number;
  limit: number;
  search?: string;
  status?: number;
}

interface ListMonthsResult {
  data: MonthRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/**
 * months has no unique constraint on `title` at the DB level, so
 * uniqueness is enforced here at the application layer — same pattern as
 * every other master-data table in this codebase.
 */
const assertTitleIsUnique = async (title: string, excludeId?: number) => {
  const existing = await prisma.months.findFirst({
    where: {
      title: { equals: title, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A month with this title already exists", {
      title: `'${title}' already exists`,
    });
  }
};

const findMonthOrThrow = async (id: number): Promise<MonthRecord> => {
  const record = await prisma.months.findUnique({ where: { id }, select: monthSelect });
  if (!record) {
    throw AppError.notFound(`Month with id ${id} was not found`);
  }
  return record;
};

/**
 * attendance_summary.month_id is not a DB-level foreign key (this schema
 * enforces none), but it conceptually references this table's id, so
 * deleting a month still in use would silently orphan those summaries.
 */
const assertMonthNotInUse = async (id: number) => {
  const count = await prisma.attendanceSummary.count({ where: { month_id: id } });
  if (count > 0) {
    throw AppError.conflict(`Cannot delete this month — ${count} attendance summary record(s) still use it`, {
      id: "Reassign or remove affected attendance summaries before deleting this month",
    });
  }
};

export const listMonths = async (params: ListMonthsParams): Promise<ListMonthsResult> => {
  const { page, limit, search, status } = params;

  const where: Prisma.MonthsWhereInput = {
    ...(status !== undefined ? { status } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, months] = await prisma.$transaction([
    prisma.months.count({ where }),
    prisma.months.findMany({
      where,
      select: monthSelect,
      orderBy: { id: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: months,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ─── Active-only lookup (for the Attendance Summary form's month dropdown) ──
export const listActiveMonths = async (): Promise<MonthRecord[]> => {
  return prisma.months.findMany({
    where: { status: MONTH_STATUS.ACTIVE },
    select: monthSelect,
    orderBy: { id: "asc" },
  });
};

export const getMonthById = async (id: number): Promise<MonthRecord> => findMonthOrThrow(id);

export const createMonth = async (input: CreateMonthInput, actorId?: number): Promise<MonthRecord> => {
  await assertTitleIsUnique(input.title);

  return prisma.months.create({
    data: {
      title: input.title,
      status: input.status ?? MONTH_STATUS.ACTIVE,
      created_by: actorId ?? 0,
      last_updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: monthSelect,
  });
};

export const updateMonth = async (
  id: number,
  input: UpdateMonthInput,
  actorId?: number
): Promise<MonthRecord> => {
  await findMonthOrThrow(id);
  if (input.title !== undefined) {
    await assertTitleIsUnique(input.title, id);
  }

  return prisma.months.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      last_updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: monthSelect,
  });
};

export const deleteMonth = async (id: number): Promise<void> => {
  await findMonthOrThrow(id);
  await assertMonthNotInUse(id);
  await prisma.months.delete({ where: { id } });
};
