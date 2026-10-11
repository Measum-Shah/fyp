import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { isBranchVisible } from "../utils/branch-scope.util";
import { HOLIDAY_LEGACY_DEFAULTS } from "../constants/holiday.constants";
import { CreateHolidayInput, UpdateHolidayInput } from "../validators/holiday.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const holidaySelect = {
  id: true,
  holiday_name: true,
  start_date: true,
  end_date: true,
  days: true,
  branch_id: true,
  created_by: true,
  updated_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpHolidaysSelect;

export type HolidayRecord = Prisma.ErpHolidaysGetPayload<{ select: typeof holidaySelect }>;

interface ListHolidaysParams {
  page: number;
  limit: number;
  search?: string;
  year?: number;
}

interface ListHolidaysResult {
  data: HolidayRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Inclusive day count between two YYYY-MM-DD dates, e.g. Mon-Tue = 2 days.
// Computed server-side (never trusted from the client) so `days` can never
// drift out of sync with the actual start_date/end_date range.
const inclusiveDayCount = (start: string, end: string): number => {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  const endMs = Date.parse(`${end}T00:00:00.000Z`);
  return Math.round((endMs - startMs) / MS_PER_DAY) + 1;
};

/**
 * erp_holidays has no unique constraint on `holiday_name` at the DB level,
 * so exact-duplicate ranges are caught here at the application layer —
 * same pattern as branch/company/department/work-shift name checks. Only
 * meaningful when both dates are present; a holiday saved without dates has
 * no "range" to compare, so it's exempt from this check.
 */
const assertNoExactDuplicate = async (
  holiday_name: string,
  start_date: string,
  end_date: string,
  excludeId?: number
) => {
  const existing = await prisma.erpHolidays.findFirst({
    where: {
      holiday_name: { equals: holiday_name, mode: "insensitive" },
      start_date: new Date(`${start_date}T00:00:00.000Z`),
      end_date: new Date(`${end_date}T00:00:00.000Z`),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("This holiday already exists with the same dates", {
      holiday_name: `'${holiday_name}' already exists for these dates`,
    });
  }
};

const findHolidayOrThrow = async (id: number): Promise<HolidayRecord> => {
  const holiday = await prisma.erpHolidays.findUnique({
    where: { id },
    select: holidaySelect,
  });

  if (!holiday) {
    throw AppError.notFound(`Holiday with id ${id} was not found`);
  }

  return holiday;
};

// ─── List holidays ─────────────────────────────────────────────────────────────
export const listHolidays = async (
  params: ListHolidaysParams,
  branchIds?: number[] | null
): Promise<ListHolidaysResult> => {
  const { page, limit, search, year } = params;

  const where: Prisma.ErpHolidaysWhereInput = {
    ...(branchIds ? { OR: [{ branch_id: null }, { branch_id: { in: branchIds } }] } : {}),
    ...(search ? { holiday_name: { contains: search, mode: "insensitive" } } : {}),
    // Overlap test: any holiday that touches any day of the requested year.
    // Holidays saved without dates are naturally excluded from a year
    // filter — there's no date to test against — but still appear in the
    // unfiltered list.
    ...(year !== undefined
      ? {
          start_date: { lte: new Date(`${year}-12-31T00:00:00.000Z`) },
          end_date: { gte: new Date(`${year}-01-01T00:00:00.000Z`) },
        }
      : {}),
  };

  const [total, holidays] = await prisma.$transaction([
    prisma.erpHolidays.count({ where }),
    prisma.erpHolidays.findMany({
      where,
      select: holidaySelect,
      orderBy: [{ start_date: "asc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: holidays,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

// ─── Get single holiday ──────────────────────────────────────────────────────
export const getHolidayById = async (id: number, branchIds?: number[] | null): Promise<HolidayRecord> => {
  const record = await findHolidayOrThrow(id);
  if (branchIds !== undefined && !isBranchVisible(branchIds ?? null, record.branch_id)) {
    throw AppError.notFound(`Holiday with id ${id} was not found`);
  }
  return record;
};

// ─── Create holiday ───────────────────────────────────────────────────────────
// `days` comes from the client (Number of Days field) but is only
// authoritative when start_date/end_date are absent. When both dates are
// present, `days` is recomputed from them exactly as before, so the two
// inputs can never disagree.
export const createHoliday = async (
  input: CreateHolidayInput,
  actorId?: number
): Promise<HolidayRecord> => {
  const hasDates = input.start_date !== undefined && input.end_date !== undefined;

  if (hasDates) {
    await assertNoExactDuplicate(input.holiday_name, input.start_date as string, input.end_date as string);
  }

  return prisma.erpHolidays.create({
    data: {
      holiday_name: input.holiday_name,
      start_date: hasDates ? new Date(`${input.start_date}T00:00:00.000Z`) : null,
      end_date: hasDates ? new Date(`${input.end_date}T00:00:00.000Z`) : null,
      days: hasDates ? inclusiveDayCount(input.start_date as string, input.end_date as string) : input.days,
      created_by: actorId ?? 0,
      updated_by: actorId ?? 0,
      updated_at: new Date(),
      deleted_by: HOLIDAY_LEGACY_DEFAULTS.deleted_by,
    },
    select: holidaySelect,
  });
};

// ─── Update holiday ───────────────────────────────────────────────────────────
export const updateHoliday = async (
  id: number,
  input: UpdateHolidayInput,
  actorId?: number
): Promise<HolidayRecord> => {
  const existing = await findHolidayOrThrow(id);

  const nextName = input.holiday_name ?? existing.holiday_name;
  const nextStart = input.start_date ?? (existing.start_date ? existing.start_date.toISOString().slice(0, 10) : undefined);
  const nextEnd = input.end_date ?? (existing.end_date ? existing.end_date.toISOString().slice(0, 10) : undefined);
  const nextHasDates = nextStart !== undefined && nextEnd !== undefined;

  if (
    nextHasDates &&
    (input.holiday_name !== undefined || input.start_date !== undefined || input.end_date !== undefined)
  ) {
    await assertNoExactDuplicate(nextName, nextStart as string, nextEnd as string, id);
  }

  return prisma.erpHolidays.update({
    where: { id },
    data: {
      ...(input.holiday_name !== undefined ? { holiday_name: input.holiday_name } : {}),
      ...(input.start_date !== undefined
        ? { start_date: new Date(`${input.start_date}T00:00:00.000Z`) }
        : {}),
      ...(input.end_date !== undefined ? { end_date: new Date(`${input.end_date}T00:00:00.000Z`) } : {}),
      // `days` always reflects the resulting state: recomputed from the
      // (possibly-updated) date range whenever both dates end up present,
      // otherwise taken from the client-supplied Number of Days (falling
      // back to whatever was already stored if it wasn't resent). This
      // keeps the two inputs from ever contradicting each other.
      days: nextHasDates
        ? inclusiveDayCount(nextStart as string, nextEnd as string)
        : input.days !== undefined
        ? input.days
        : existing.days,
      updated_by: actorId ?? 0,
      updated_at: new Date(),
    },
    select: holidaySelect,
  });
};

// ─── Delete holiday (hard delete — see holiday.constants.ts) ────────────────
export const deleteHoliday = async (id: number): Promise<void> => {
  await findHolidayOrThrow(id);
  await prisma.erpHolidays.delete({ where: { id } });
};