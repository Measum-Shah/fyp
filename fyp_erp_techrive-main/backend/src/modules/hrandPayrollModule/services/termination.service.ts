import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { ACKNOWLEDGE_STATUS } from "../constants/termination.constants";
import { CreateTerminationInput, UpdateTerminationInput } from "../validators/termination.validator";

const terminationSelect = {
  id: true,
  user_id: true,
  reason: true,
  warnings: true,
  acknowledge: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.TerminationsSelect;

export type TerminationRecord = Prisma.TerminationsGetPayload<{ select: typeof terminationSelect }>;

interface ListTerminationsParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
}

interface ListTerminationsResult {
  data: TerminationRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertStaffExists = async (staff_id: number) => {
  const staff = await prisma.staff.findFirst({ where: { id: staff_id, deleted_at: null }, select: { id: true } });
  if (!staff) {
    throw AppError.badRequest("Employee does not exist", {
      staff_id: `No active employee found with id ${staff_id}`,
    });
  }
};

const findTerminationOrThrow = async (id: number): Promise<TerminationRecord> => {
  const record = await prisma.terminations.findUnique({ where: { id }, select: terminationSelect });
  if (!record) {
    throw AppError.notFound(`Termination with id ${id} was not found`);
  }
  return record;
};

export const listTerminations = async (
  params: ListTerminationsParams,
  scope?: RecordScope
): Promise<ListTerminationsResult> => {
  const { page, limit, search, staff_id } = params;

  const where: Prisma.TerminationsWhereInput = {
    ...(scope && scope.restrictToEmployeeId !== null
      ? { user_id: scope.restrictToEmployeeId }
      : staff_id
      ? { user_id: staff_id }
      : {}),
    ...(search ? { reason: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.terminations.count({ where }),
    prisma.terminations.findMany({
      where,
      select: terminationSelect,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

export const getTerminationById = async (id: number, scope?: RecordScope): Promise<TerminationRecord> => {
  const record = await findTerminationOrThrow(id);
  if (scope && !isWithinScope(scope, record.user_id)) {
    throw AppError.notFound(`Termination with id ${id} was not found`);
  }
  return record;
};

/**
 * The only side effect this feature has, but it's immediate: creating a
 * termination record flips the employee's staff.status to Inactive right
 * away (no approval step — see termination.constants.ts for why this
 * differs from Resignations).
 */
export const createTermination = async (input: CreateTerminationInput): Promise<TerminationRecord> => {
  await assertStaffExists(input.staff_id);

  const [record] = await prisma.$transaction([
    prisma.terminations.create({
      data: {
        user_id: input.staff_id,
        reason: input.reason,
        warnings: input.warnings,
        acknowledge: input.acknowledge ?? ACKNOWLEDGE_STATUS.NO,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: terminationSelect,
    }),
    prisma.staff.update({
      where: { id: input.staff_id },
      data: { status: "Inactive", updated_at: new Date() },
    }),
  ]);

  return record;
};

/**
 * staff_id is not accepted here — see updateTerminationSchema for why
 * (it's the record's identity and the thing createTermination's Inactive
 * side effect is keyed on; reassigning it after the fact would desync the
 * two employees' statuses from what the termination record actually says).
 */
export const updateTermination = async (
  id: number,
  input: UpdateTerminationInput
): Promise<TerminationRecord> => {
  await findTerminationOrThrow(id);

  return prisma.terminations.update({
    where: { id },
    data: {
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      ...(input.warnings !== undefined ? { warnings: input.warnings } : {}),
      ...(input.acknowledge !== undefined ? { acknowledge: input.acknowledge } : {}),
      updated_at: new Date(),
    },
    select: terminationSelect,
  });
};

/**
 * Hard delete — no deleted_at column on this table. Does NOT reinstate the
 * employee's staff.status; that's a deliberate, separate HR decision to be
 * made from the Employee record itself, not an automatic side effect of
 * deleting this history row.
 */
export const deleteTermination = async (id: number): Promise<void> => {
  await findTerminationOrThrow(id);
  await prisma.terminations.delete({ where: { id } });
};