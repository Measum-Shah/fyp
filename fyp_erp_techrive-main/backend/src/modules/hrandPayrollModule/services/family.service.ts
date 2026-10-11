import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { CreateFamilyInput, UpdateFamilyInput } from "../validators/family.validator";

const familySelect = {
  id: true,
  staff_id: true,
  staff_bi_id: true,
  name: true,
  relation: true,
  phone: true,
  gender: true,
  cnic: true,
  workplace: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.StaffFamiliesSelect;

export type FamilyRecord = Prisma.StaffFamiliesGetPayload<{ select: typeof familySelect }>;

interface ListFamiliesParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
}
interface ListFamiliesResult {
  data: FamilyRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertStaffExists = async (staff_id: number) => {
  const staff = await prisma.staff.findFirst({ where: { id: staff_id, deleted_at: null }, select: { id: true } });
  if (!staff) throw AppError.badRequest("Employee does not exist", { staff_id: `No active employee found with id ${staff_id}` });
};

const findFamilyOrThrow = async (id: number): Promise<FamilyRecord> => {
  const record = await prisma.staffFamilies.findFirst({ where: { id, deleted_at: null }, select: familySelect });
  if (!record) throw AppError.notFound(`Family record with id ${id} was not found`);
  return record;
};

export const listFamilies = async (
  params: ListFamiliesParams,
  scope?: RecordScope
): Promise<ListFamiliesResult> => {
  const { page, limit, search, staff_id } = params;
  const where: Prisma.StaffFamiliesWhereInput = {
    deleted_at: null,
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id
      ? { staff_id }
      : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { relation: { contains: search, mode: "insensitive" } }] } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.staffFamilies.count({ where }),
    prisma.staffFamilies.findMany({ where, select: familySelect, orderBy: { id: "desc" }, skip: (page - 1) * limit, take: limit }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

export const getFamilyById = async (id: number, scope?: RecordScope): Promise<FamilyRecord> => {
  const record = await findFamilyOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Family record with id ${id} was not found`);
  }
  return record;
};

export const createFamily = async (input: CreateFamilyInput): Promise<FamilyRecord> => {
  await assertStaffExists(input.staff_id);
  return prisma.staffFamilies.create({
    data: {
      ...input,
      // gender/cnic/workplace are optional on the form but staff_families
      // keeps them as NOT NULL columns — normalize an omitted value to ""
      // rather than requiring a schema migration to allow NULL.
      gender: input.gender ?? "",
      cnic: input.cnic ?? "",
      workplace: input.workplace ?? "",
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: familySelect,
  });
};

export const updateFamily = async (id: number, input: UpdateFamilyInput): Promise<FamilyRecord> => {
  await findFamilyOrThrow(id);
  if (input.staff_id !== undefined) await assertStaffExists(input.staff_id);
  return prisma.staffFamilies.update({
    where: { id },
    data: { ...input, updated_at: new Date() },
    select: familySelect,
  });
};

export const deleteFamily = async (id: number): Promise<void> => {
  await findFamilyOrThrow(id);
  await prisma.staffFamilies.update({ where: { id }, data: { deleted_at: new Date(), updated_at: new Date() } });
};