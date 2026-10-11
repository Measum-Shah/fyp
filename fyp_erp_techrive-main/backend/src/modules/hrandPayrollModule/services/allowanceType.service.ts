import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { ALLOWANCE_CALCULATION_TYPE } from "../constants/allowanceType.constants";
import { CreateAllowanceTypeInput, UpdateAllowanceTypeInput } from "../validators/allowanceType.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const allowanceTypeSelect = {
  id: true,
  name: true,
  code: true,
  calculation_type: true,
  default_value: true,
  is_taxable: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.HrAllowanceTypesSelect;

export type AllowanceTypeRecord = Prisma.HrAllowanceTypesGetPayload<{ select: typeof allowanceTypeSelect }>;

interface ListAllowanceTypesParams {
  page: number;
  limit: number;
  search?: string;
  status?: number;
}

interface ListAllowanceTypesResult {
  data: AllowanceTypeRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertNameIsUnique = async (name: string, excludeId?: number) => {
  const existing = await prisma.hrAllowanceTypes.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("An allowance type with this name already exists", {
      name: `Allowance type '${name}' already exists`,
    });
  }
};

const findAllowanceTypeOrThrow = async (id: number): Promise<AllowanceTypeRecord> => {
  const record = await prisma.hrAllowanceTypes.findFirst({
    where: { id, deleted_at: null },
    select: allowanceTypeSelect,
  });
  if (!record) {
    throw AppError.notFound(`Allowance type with id ${id} was not found`);
  }
  return record;
};

// ─── List allowance types ─────────────────────────────────────────────────────
export const listAllowanceTypes = async (params: ListAllowanceTypesParams): Promise<ListAllowanceTypesResult> => {
  const { page, limit, search, status } = params;

  const where: Prisma.HrAllowanceTypesWhereInput = {
    deleted_at: null,
    ...(status !== undefined ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.hrAllowanceTypes.count({ where }),
    prisma.hrAllowanceTypes.findMany({
      where,
      select: allowanceTypeSelect,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

// ─── Lookup — all active allowance types, unpaginated (Salary form picker) ─
export const listAllowanceTypeLookup = async () => {
  return prisma.hrAllowanceTypes.findMany({
    where: { deleted_at: null, status: 1 },
    select: allowanceTypeSelect,
    orderBy: { name: "asc" },
  });
};

export const getAllowanceTypeById = async (id: number): Promise<AllowanceTypeRecord> => findAllowanceTypeOrThrow(id);

export const createAllowanceType = async (input: CreateAllowanceTypeInput): Promise<AllowanceTypeRecord> => {
  await assertNameIsUnique(input.name);

  return prisma.hrAllowanceTypes.create({
    data: {
      name: input.name,
      code: input.code ?? null,
      calculation_type: input.calculation_type ?? ALLOWANCE_CALCULATION_TYPE.FIXED,
      default_value: input.default_value,
      is_taxable: input.is_taxable ?? 1,
      status: input.status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: allowanceTypeSelect,
  });
};

export const updateAllowanceType = async (
  id: number,
  input: UpdateAllowanceTypeInput
): Promise<AllowanceTypeRecord> => {
  await findAllowanceTypeOrThrow(id);

  if (input.name !== undefined) {
    await assertNameIsUnique(input.name, id);
  }

  return prisma.hrAllowanceTypes.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.calculation_type !== undefined ? { calculation_type: input.calculation_type } : {}),
      ...(input.default_value !== undefined ? { default_value: input.default_value } : {}),
      ...(input.is_taxable !== undefined ? { is_taxable: input.is_taxable } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_at: new Date(),
    },
    select: allowanceTypeSelect,
  });
};

// ─── Delete allowance type (soft delete — deleted_at exists on this table) ─
export const deleteAllowanceType = async (id: number): Promise<void> => {
  await findAllowanceTypeOrThrow(id);

  await prisma.hrAllowanceTypes.update({
    where: { id },
    data: { deleted_at: new Date(), updated_at: new Date() },
  });
};
