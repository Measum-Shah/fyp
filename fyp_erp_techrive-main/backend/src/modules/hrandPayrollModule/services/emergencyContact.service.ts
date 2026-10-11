import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { CreateEmergencyContactInput, UpdateEmergencyContactInput } from "../validators/emergencyContact.validator";

const contactSelect = {
  id: true,
  staff_id: true,
  staff_bi_id: true,
  name: true,
  relation: true,
  phone: true,
  email: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.StaffEmergencyContactsSelect;

export type EmergencyContactRecord = Prisma.StaffEmergencyContactsGetPayload<{ select: typeof contactSelect }>;

interface ListEmergencyContactsParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
}
interface ListEmergencyContactsResult {
  data: EmergencyContactRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertStaffExists = async (staff_id: number) => {
  const staff = await prisma.staff.findFirst({ where: { id: staff_id, deleted_at: null }, select: { id: true } });
  if (!staff) throw AppError.badRequest("Employee does not exist", { staff_id: `No active employee found with id ${staff_id}` });
};

const findContactOrThrow = async (id: number): Promise<EmergencyContactRecord> => {
  const record = await prisma.staffEmergencyContacts.findFirst({ where: { id, deleted_at: null }, select: contactSelect });
  if (!record) throw AppError.notFound(`Emergency contact with id ${id} was not found`);
  return record;
};

export const listEmergencyContacts = async (
  params: ListEmergencyContactsParams,
  scope?: RecordScope
): Promise<ListEmergencyContactsResult> => {
  const { page, limit, search, staff_id } = params;
  const where: Prisma.StaffEmergencyContactsWhereInput = {
    deleted_at: null,
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id
      ? { staff_id }
      : {}),
    ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search, mode: "insensitive" } }] } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.staffEmergencyContacts.count({ where }),
    prisma.staffEmergencyContacts.findMany({ where, select: contactSelect, orderBy: { id: "desc" }, skip: (page - 1) * limit, take: limit }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

export const getEmergencyContactById = async (id: number, scope?: RecordScope): Promise<EmergencyContactRecord> => {
  const record = await findContactOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Emergency contact with id ${id} was not found`);
  }
  return record;
};

export const createEmergencyContact = async (input: CreateEmergencyContactInput): Promise<EmergencyContactRecord> => {
  await assertStaffExists(input.staff_id);
  return prisma.staffEmergencyContacts.create({
    data: { ...input, created_at: new Date(), updated_at: new Date() },
    select: contactSelect,
  });
};

export const updateEmergencyContact = async (
  id: number,
  input: UpdateEmergencyContactInput
): Promise<EmergencyContactRecord> => {
  await findContactOrThrow(id);
  if (input.staff_id !== undefined) await assertStaffExists(input.staff_id);
  return prisma.staffEmergencyContacts.update({
    where: { id },
    data: { ...input, updated_at: new Date() },
    select: contactSelect,
  });
};

export const deleteEmergencyContact = async (id: number): Promise<void> => {
  await findContactOrThrow(id);
  await prisma.staffEmergencyContacts.update({ where: { id }, data: { deleted_at: new Date(), updated_at: new Date() } });
};
