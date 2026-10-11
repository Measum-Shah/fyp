import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { STAFF_QUALIFICATION_STATUS } from "../constants/staffQualification.constants";
import {
  CreateStaffQualificationInput,
  UpdateStaffQualificationInput,
} from "../validators/staffQualification.validator";

// ─── Shared select — internal audit columns kept out of the public response
const staffQualificationSelect = {
  id: true,
  staff_id: true,
  degree: true,
  institute: true,
  board_or_university: true,
  passing_year: true,
  grade_or_cgpa: true,
  attachment: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.StaffQualificationsSelect;

export type StaffQualificationRecord = Prisma.StaffQualificationsGetPayload<{
  select: typeof staffQualificationSelect;
}>;

interface ListStaffQualificationsParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
  status?: number;
}

interface ListStaffQualificationsResult {
  data: StaffQualificationRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertEmployeeExists = async (staff_id: number) => {
  const emp = await prisma.staff.findFirst({
    where: { id: staff_id, deleted_at: null },
    select: { id: true },
  });

  if (!emp) {
    throw AppError.badRequest("Selected employee does not exist or is inactive", {
      staff_id: `No active employee found with id ${staff_id}`,
    });
  }
};

const findActiveStaffQualificationOrThrow = async (id: number): Promise<StaffQualificationRecord> => {
  const record = await prisma.staffQualifications.findFirst({
    where: { id, deleted_at: null },
    select: staffQualificationSelect,
  });

  if (!record) {
    throw AppError.notFound(`Qualification with id ${id} was not found`);
  }

  return record;
};

// ─── List staff qualifications ────────────────────────────────────────────────
export const listStaffQualifications = async (
  params: ListStaffQualificationsParams,
  scope?: RecordScope
): Promise<ListStaffQualificationsResult> => {
  const { page, limit, search, staff_id, status } = params;

  const where: Prisma.StaffQualificationsWhereInput = {
    deleted_at: null,
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id
      ? { staff_id }
      : {}),
    ...(status !== undefined ? { status } : {}),
    ...(search
      ? {
          OR: [
            { degree: { contains: search, mode: "insensitive" } },
            { institute: { contains: search, mode: "insensitive" } },
            { board_or_university: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.staffQualifications.count({ where }),
    prisma.staffQualifications.findMany({
      where,
      select: staffQualificationSelect,
      orderBy: [{ passing_year: "desc" }, { id: "desc" }],
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

// ─── Get single qualification ─────────────────────────────────────────────────
export const getStaffQualificationById = async (id: number, scope?: RecordScope): Promise<StaffQualificationRecord> => {
  const record = await findActiveStaffQualificationOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Staff qualification with id ${id} was not found`);
  }
  return record;
};

// ─── Create qualification ─────────────────────────────────────────────────────
export const createStaffQualification = async (
  input: CreateStaffQualificationInput,
  actorId?: number
): Promise<StaffQualificationRecord> => {
  await assertEmployeeExists(input.staff_id);

  return prisma.staffQualifications.create({
    data: {
      staff_id: input.staff_id,
      degree: input.degree,
      institute: input.institute,
      board_or_university: input.board_or_university,
      passing_year: input.passing_year,
      grade_or_cgpa: input.grade_or_cgpa,
      attachment: input.attachment,
      status: input.status ?? STAFF_QUALIFICATION_STATUS.ACTIVE,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: staffQualificationSelect,
  });
};

// ─── Update qualification ─────────────────────────────────────────────────────
export const updateStaffQualification = async (
  id: number,
  input: UpdateStaffQualificationInput,
  actorId?: number
): Promise<StaffQualificationRecord> => {
  await findActiveStaffQualificationOrThrow(id);

  if (input.staff_id !== undefined) {
    await assertEmployeeExists(input.staff_id);
  }

  return prisma.staffQualifications.update({
    where: { id },
    data: {
      ...(input.staff_id !== undefined ? { staff_id: input.staff_id } : {}),
      ...(input.degree !== undefined ? { degree: input.degree } : {}),
      ...(input.institute !== undefined ? { institute: input.institute } : {}),
      ...(input.board_or_university !== undefined
        ? { board_or_university: input.board_or_university }
        : {}),
      ...(input.passing_year !== undefined ? { passing_year: input.passing_year } : {}),
      ...(input.grade_or_cgpa !== undefined ? { grade_or_cgpa: input.grade_or_cgpa } : {}),
      ...(input.attachment !== undefined ? { attachment: input.attachment } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: staffQualificationSelect,
  });
};

// ─── Delete qualification (soft delete) ───────────────────────────────────────
export const deleteStaffQualification = async (id: number, deletedBy?: number): Promise<void> => {
  await findActiveStaffQualificationOrThrow(id);

  await prisma.staffQualifications.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      status: STAFF_QUALIFICATION_STATUS.INACTIVE,
      updated_at: new Date(),
    },
  });
};
