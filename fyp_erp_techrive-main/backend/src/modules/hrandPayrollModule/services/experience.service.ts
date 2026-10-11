import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { CreateExperienceInput, UpdateExperienceInput } from "../validators/experience.validator";

const experienceSelect = {
  id: true,
  staff_id: true,
  staff_bi_id: true,
  name: true,
  designation: true,
  from_date: true,
  to_date: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.StaffExperiencesSelect;

export type ExperienceRecord = Prisma.StaffExperiencesGetPayload<{ select: typeof experienceSelect }>;

interface ListExperiencesParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
}
interface ListExperiencesResult {
  data: ExperienceRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertStaffExists = async (staff_id: number) => {
  const staff = await prisma.staff.findFirst({ where: { id: staff_id, deleted_at: null }, select: { id: true } });
  if (!staff) {
    throw AppError.badRequest("Employee does not exist", { staff_id: `No active employee found with id ${staff_id}` });
  }
};

const findExperienceOrThrow = async (id: number): Promise<ExperienceRecord> => {
  const record = await prisma.staffExperiences.findFirst({ where: { id, deleted_at: null }, select: experienceSelect });
  if (!record) throw AppError.notFound(`Experience record with id ${id} was not found`);
  return record;
};

export const listExperiences = async (
  params: ListExperiencesParams,
  scope?: RecordScope
): Promise<ListExperiencesResult> => {
  const { page, limit, search, staff_id } = params;
  const where: Prisma.StaffExperiencesWhereInput = {
    deleted_at: null,
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id
      ? { staff_id }
      : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { designation: { contains: search, mode: "insensitive" } }] } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.staffExperiences.count({ where }),
    prisma.staffExperiences.findMany({ where, select: experienceSelect, orderBy: { id: "desc" }, skip: (page - 1) * limit, take: limit }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

export const getExperienceById = async (id: number, scope?: RecordScope): Promise<ExperienceRecord> => {
  const record = await findExperienceOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Experience record with id ${id} was not found`);
  }
  return record;
};

export const createExperience = async (input: CreateExperienceInput): Promise<ExperienceRecord> => {
  await assertStaffExists(input.staff_id);
  return prisma.staffExperiences.create({
    data: {
      staff_id: input.staff_id,
      name: input.name,
      designation: input.designation,
      from_date: new Date(input.from_date),
      to_date: new Date(input.to_date),
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: experienceSelect,
  });
};

export const updateExperience = async (id: number, input: UpdateExperienceInput): Promise<ExperienceRecord> => {
  await findExperienceOrThrow(id);
  if (input.staff_id !== undefined) await assertStaffExists(input.staff_id);

  return prisma.staffExperiences.update({
    where: { id },
    data: {
      ...(input.staff_id !== undefined ? { staff_id: input.staff_id } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.designation !== undefined ? { designation: input.designation } : {}),
      ...(input.from_date !== undefined ? { from_date: new Date(input.from_date) } : {}),
      ...(input.to_date !== undefined ? { to_date: new Date(input.to_date) } : {}),
      updated_at: new Date(),
    },
    select: experienceSelect,
  });
};

export const deleteExperience = async (id: number): Promise<void> => {
  await findExperienceOrThrow(id);
  await prisma.staffExperiences.update({ where: { id }, data: { deleted_at: new Date(), updated_at: new Date() } });
};
