import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { isBranchVisible } from "../utils/branch-scope.util";
import { CreateDesignationInput, UpdateDesignationInput } from "../validators/designation.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const designationSelect = {
  id: true,
  name: true,
  description: true,
  branch_id: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.DesignationSelect;

export type DesignationRecord = Prisma.DesignationGetPayload<{
  select: typeof designationSelect;
}>;

interface ListDesignationsParams {
  page: number;
  limit: number;
  search?: string;
}

interface ListDesignationsResult {
  data: DesignationRecord[];
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
 * the Employee form's designation suggestion list — two rows with the same
 * name would just show a confusing duplicate suggestion, so uniqueness is
 * enforced here at the application layer, same pattern as
 * staffType.service.ts's assertNameIsUnique.
 */
const assertNameIsUnique = async (name: string, excludeId?: number) => {
  const existing = await prisma.designation.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A designation with this name already exists", {
      name: `Designation '${name}' already exists`,
    });
  }
};

const findDesignationOrThrow = async (id: number): Promise<DesignationRecord> => {
  const designation = await prisma.designation.findFirst({
    where: { id, deleted_at: null },
    select: designationSelect,
  });

  if (!designation) {
    throw AppError.notFound(`Designation with id ${id} was not found`);
  }

  return designation;
};

// ─── List designations ────────────────────────────────────────────────────────
export const listDesignations = async (
  params: ListDesignationsParams,
  branchIds?: number[] | null
): Promise<ListDesignationsResult> => {
  const { page, limit, search } = params;

  const where: Prisma.DesignationWhereInput = {
    deleted_at: null,
    ...(branchIds ? { OR: [{ branch_id: null }, { branch_id: { in: branchIds } }] } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.designation.count({ where }),
    prisma.designation.findMany({
      where,
      select: designationSelect,
      orderBy: { name: "asc" },
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

// ─── Get single designation ───────────────────────────────────────────────────
export const getDesignationById = async (id: number, branchIds?: number[] | null): Promise<DesignationRecord> => {
  const record = await findDesignationOrThrow(id);
  if (branchIds !== undefined && !isBranchVisible(branchIds ?? null, record.branch_id)) {
    throw AppError.notFound(`Designation with id ${id} was not found`);
  }
  return record;
};

// ─── Create designation ────────────────────────────────────────────────────────
// actorId is required (not optional) — designation.created_by/updated_by
// have no default and aren't nullable, unlike most other lookup tables in
// this schema (e.g. erp_hrm_leave_types), so there's no null fallback to
// fall back to here; a missing actor id is a genuine error, not a detail
// to silently paper over.
export const createDesignation = async (
  input: CreateDesignationInput,
  actorId: number | undefined
): Promise<DesignationRecord> => {
  if (!actorId) {
    throw AppError.badRequest("Unable to determine the current user for this action");
  }

  await assertNameIsUnique(input.name);

  return prisma.designation.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      created_by: actorId,
      updated_by: actorId,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: designationSelect,
  });
};

// ─── Update designation ────────────────────────────────────────────────────────
export const updateDesignation = async (
  id: number,
  input: UpdateDesignationInput,
  actorId: number | undefined
): Promise<DesignationRecord> => {
  if (!actorId) {
    throw AppError.badRequest("Unable to determine the current user for this action");
  }

  await findDesignationOrThrow(id);

  if (input.name !== undefined) {
    await assertNameIsUnique(input.name, id);
  }

  return prisma.designation.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      updated_by: actorId,
      updated_at: new Date(),
    },
    select: designationSelect,
  });
};

// ─── Delete designation (soft delete) ───────────────────────────────────────
// Always safe — see the module-level note in designation.constants.ts.
export const deleteDesignation = async (id: number, actorId: number | undefined): Promise<void> => {
  if (!actorId) {
    throw AppError.badRequest("Unable to determine the current user for this action");
  }

  await findDesignationOrThrow(id);

  await prisma.designation.update({
    where: { id },
    data: { deleted_at: new Date(), deleted_by: actorId, updated_at: new Date() },
  });
};