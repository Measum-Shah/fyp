import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { isBranchVisible } from "../utils/branch-scope.util";
import { CreateStaffTypeInput, UpdateStaffTypeInput } from "../validators/staffType.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const staffTypeSelect = {
  id: true,
  name: true,
  staff_type_code: true,
  description: true,
  sequence_id: true,
  branch_id: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.StaffTypeSelect;

export type StaffTypeRecord = Prisma.StaffTypeGetPayload<{
  select: typeof staffTypeSelect;
}>;

interface ListStaffTypesParams {
  page: number;
  limit: number;
  search?: string;
}

interface ListStaffTypesResult {
  data: StaffTypeRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * name has no unique constraint at the DB level, but it's what populates
 * the Employee form's staff-type suggestion list — two rows with the same
 * name would just show a confusing duplicate suggestion, so uniqueness is
 * enforced here at the application layer, same pattern as
 * department.service.ts's assertNameIsUnique.
 */
const assertNameIsUnique = async (name: string, excludeId?: number) => {
  const existing = await prisma.staffType.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A staff type with this name already exists", {
      name: `Staff type '${name}' already exists`,
    });
  }
};

const findStaffTypeOrThrow = async (id: number): Promise<StaffTypeRecord> => {
  const staffType = await prisma.staffType.findFirst({
    where: { id, deleted_at: null },
    select: staffTypeSelect,
  });

  if (!staffType) {
    throw AppError.notFound(`Staff type with id ${id} was not found`);
  }

  return staffType;
};

/** Next sequence_id = current max + 1, so new rows append to the end of the
 * ordering by default rather than all landing on the same value. */
const nextSequenceId = async (): Promise<number> => {
  const top = await prisma.staffType.findFirst({
    where: { deleted_at: null },
    orderBy: { sequence_id: "desc" },
    select: { sequence_id: true },
  });
  return (top?.sequence_id ?? 0) + 1;
};

// ─── List staff types ────────────────────────────────────────────────────────
export const listStaffTypes = async (
  params: ListStaffTypesParams,
  branchIds?: number[] | null
): Promise<ListStaffTypesResult> => {
  const { page, limit, search } = params;

  const where: Prisma.StaffTypeWhereInput = {
    deleted_at: null,
    ...(branchIds ? { AND: [{ OR: [{ branch_id: null }, { branch_id: { in: branchIds } }] }] } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { staff_type_code: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.staffType.count({ where }),
    prisma.staffType.findMany({
      where,
      select: staffTypeSelect,
      orderBy: [{ sequence_id: "asc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

// ─── Get single staff type ────────────────────────────────────────────────────
export const getStaffTypeById = async (id: number, branchIds?: number[] | null): Promise<StaffTypeRecord> => {
  const record = await findStaffTypeOrThrow(id);
  if (branchIds !== undefined && !isBranchVisible(branchIds ?? null, record.branch_id)) {
    throw AppError.notFound(`Staff type with id ${id} was not found`);
  }
  return record;
};

// ─── Create staff type ────────────────────────────────────────────────────────
export const createStaffType = async (
  input: CreateStaffTypeInput
): Promise<StaffTypeRecord> => {
  await assertNameIsUnique(input.name);

  return prisma.staffType.create({
    data: {
      name: input.name,
      staff_type_code: input.staff_type_code,
      description: input.description,
      sequence_id: input.sequence_id ?? (await nextSequenceId()),
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: staffTypeSelect,
  });
};

// ─── Update staff type ────────────────────────────────────────────────────────
export const updateStaffType = async (
  id: number,
  input: UpdateStaffTypeInput
): Promise<StaffTypeRecord> => {
  await findStaffTypeOrThrow(id);

  if (input.name !== undefined) {
    await assertNameIsUnique(input.name, id);
  }

  return prisma.staffType.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.staff_type_code !== undefined ? { staff_type_code: input.staff_type_code } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.sequence_id !== undefined ? { sequence_id: input.sequence_id } : {}),
      updated_at: new Date(),
    },
    select: staffTypeSelect,
  });
};

// ─── Delete staff type (soft delete — see the "always safe" note above) ────
export const deleteStaffType = async (id: number): Promise<void> => {
  await findStaffTypeOrThrow(id);

  await prisma.staffType.update({
    where: { id },
    data: { deleted_at: new Date(), updated_at: new Date() },
  });
};
