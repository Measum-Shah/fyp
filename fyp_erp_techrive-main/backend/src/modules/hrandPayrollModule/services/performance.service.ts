import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { PERFORMANCE_STATUS } from "../constants/performance.constants";
import { CreatePerformanceInput, UpdatePerformanceInput } from "../validators/performance.validator";

// staff_performances has 5 separate NOT NULL rating columns (lecture_deliver,
// confidence, punctuality, moral_values, student_feedback) but no single
// "Performance" column. Rather than add one via a schema migration, the
// simplified form's single rating is written into ALL 5 columns (keeping
// them in sync and satisfying their NOT NULL constraint) and read back off
// student_feedback — no schema/migration step required at all.
const performanceSelect = {
  id: true,
  user_id: true,
  lecture_deliver: true,
  confidence: true,
  punctuality: true,
  moral_values: true,
  student_feedback: true,
  date: true,
  month: true,
  status: true,
  created_by: true,
  updated_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.StaffPerformancesSelect;

type PerformanceRow = Prisma.StaffPerformancesGetPayload<{ select: typeof performanceSelect }>;

export type PerformanceRecord = PerformanceRow & { performance: string | null };

const toPerformanceRecord = (row: PerformanceRow): PerformanceRecord => ({
  ...row,
  performance: row.student_feedback,
});

interface ListPerformancesParams {
  page: number;
  limit: number;
  staff_id?: number;
  month?: string;
}
interface ListPerformancesResult {
  data: PerformanceRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertStaffExists = async (staff_id: number) => {
  const staff = await prisma.staff.findFirst({ where: { id: staff_id, deleted_at: null }, select: { id: true } });
  if (!staff) throw AppError.badRequest("Employee does not exist", { staff_id: `No active employee found with id ${staff_id}` });
};

const findPerformanceOrThrow = async (id: number): Promise<PerformanceRow> => {
  const record = await prisma.staffPerformances.findFirst({ where: { id, deleted_at: null }, select: performanceSelect });
  if (!record) throw AppError.notFound(`Performance record with id ${id} was not found`);
  return record;
};

export const listPerformances = async (
  params: ListPerformancesParams,
  scope?: RecordScope
): Promise<ListPerformancesResult> => {
  const { page, limit, staff_id, month } = params;
  const where: Prisma.StaffPerformancesWhereInput = {
    deleted_at: null,
    ...(scope && scope.restrictToEmployeeId !== null
      ? { user_id: scope.restrictToEmployeeId }
      : staff_id
      ? { user_id: staff_id }
      : {}),
    ...(month ? { month } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.staffPerformances.count({ where }),
    prisma.staffPerformances.findMany({ where, select: performanceSelect, orderBy: { id: "desc" }, skip: (page - 1) * limit, take: limit }),
  ]);

  return {
    data: rows.map(toPerformanceRecord),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

export const getPerformanceById = async (id: number, scope?: RecordScope): Promise<PerformanceRecord> => {
  const row = await findPerformanceOrThrow(id);
  if (scope && !isWithinScope(scope, row.user_id)) {
    throw AppError.notFound(`Performance review with id ${id} was not found`);
  }
  return toPerformanceRecord(row);
};

export const createPerformance = async (
  input: CreatePerformanceInput,
  actorId?: number
): Promise<PerformanceRecord> => {
  await assertStaffExists(input.staff_id);
  const row = await prisma.staffPerformances.create({
    data: {
      user_id: input.staff_id,
      // The 5 legacy rating columns are NOT NULL and no longer exposed on
      // the form individually — mirror the single Performance rating into
      // all of them so inserts keep working with the existing schema.
      lecture_deliver: input.performance,
      confidence: input.performance,
      punctuality: input.performance,
      moral_values: input.performance,
      student_feedback: input.performance,
      month: input.month,
      date: input.date,
      status: input.status ?? PERFORMANCE_STATUS.ACTIVE,
      created_by: actorId,
      updated_by: actorId,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: performanceSelect,
  });
  return toPerformanceRecord(row);
};

export const updatePerformance = async (
  id: number,
  input: UpdatePerformanceInput,
  actorId?: number
): Promise<PerformanceRecord> => {
  await findPerformanceOrThrow(id);
  if (input.staff_id !== undefined) await assertStaffExists(input.staff_id);

  const row = await prisma.staffPerformances.update({
    where: { id },
    data: {
      ...(input.staff_id !== undefined ? { user_id: input.staff_id } : {}),
      ...(input.performance !== undefined
        ? {
            lecture_deliver: input.performance,
            confidence: input.performance,
            punctuality: input.performance,
            moral_values: input.performance,
            student_feedback: input.performance,
          }
        : {}),
      ...(input.month !== undefined ? { month: input.month } : {}),
      ...(input.date !== undefined ? { date: input.date } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_by: actorId,
      updated_at: new Date(),
    },
    select: performanceSelect,
  });
  return toPerformanceRecord(row);
};

export const deletePerformance = async (id: number, actorId?: number): Promise<void> => {
  await findPerformanceOrThrow(id);
  await prisma.staffPerformances.update({
    where: { id },
    data: { deleted_at: new Date(), deleted_by: actorId, updated_at: new Date() },
  });
};