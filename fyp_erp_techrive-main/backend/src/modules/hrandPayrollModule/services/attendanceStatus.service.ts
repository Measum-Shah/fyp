import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { ATTENDANCE_STATUS_STATUS } from "../constants/attendanceStatus.constants";
import {
  CreateAttendanceStatusInput,
  UpdateAttendanceStatusInput,
} from "../validators/attendanceStatus.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const attendanceStatusSelect = {
  id: true,
  title: true,
  display_class: true,
  counts_as_absent: true,
  status: true,
  created_by: true,
  last_updated_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpAttendanceStatusesSelect;

export type AttendanceStatusRecord = Prisma.ErpAttendanceStatusesGetPayload<{
  select: typeof attendanceStatusSelect;
}>;

interface ListAttendanceStatusesParams {
  page: number;
  limit: number;
  search?: string;
  status?: number;
}

interface ListAttendanceStatusesResult {
  data: AttendanceStatusRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * erp_attendance_statuses has no unique constraint on `title` at the DB
 * level, so uniqueness is enforced here at the application layer — same
 * pattern as branch/company/department/work-shift/holiday name checks.
 */
const assertTitleIsUnique = async (title: string, excludeId?: number) => {
  const existing = await prisma.erpAttendanceStatuses.findFirst({
    where: {
      title: { equals: title, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("An attendance status with this title already exists", {
      title: `'${title}' already exists`,
    });
  }
};

const findAttendanceStatusOrThrow = async (id: number): Promise<AttendanceStatusRecord> => {
  const record = await prisma.erpAttendanceStatuses.findUnique({
    where: { id },
    select: attendanceStatusSelect,
  });

  if (!record) {
    throw AppError.notFound(`Attendance status with id ${id} was not found`);
  }

  return record;
};

/**
 * employee_attendance.status is not a DB-level foreign key (this schema
 * enforces none), but it conceptually references this table's id, so
 * deleting a status still in use by attendance records would silently
 * orphan them — guarded the same way branch/work-shift guard their deletes.
 */
const assertAttendanceStatusNotInUse = async (id: number) => {
  const count = await prisma.employeeAttendance.count({
    where: { status: id, deleted_at: null },
  });

  if (count > 0) {
    throw AppError.conflict(
      `Cannot delete this status — ${count} attendance record(s) still use it`,
      { id: "Reassign or remove affected attendance records before deleting this status" }
    );
  }
};

// ─── List attendance statuses ─────────────────────────────────────────────────
export const listAttendanceStatuses = async (
  params: ListAttendanceStatusesParams
): Promise<ListAttendanceStatusesResult> => {
  const { page, limit, search, status } = params;

  const where: Prisma.ErpAttendanceStatusesWhereInput = {
    ...(status !== undefined ? { status } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, statuses] = await prisma.$transaction([
    prisma.erpAttendanceStatuses.count({ where }),
    prisma.erpAttendanceStatuses.findMany({
      where,
      select: attendanceStatusSelect,
      orderBy: { title: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: statuses,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

// ─── Active-only lookup (for the Attendance form's status dropdown) ─────────
export const listActiveAttendanceStatuses = async (): Promise<AttendanceStatusRecord[]> => {
  return prisma.erpAttendanceStatuses.findMany({
    where: { status: ATTENDANCE_STATUS_STATUS.ACTIVE },
    select: attendanceStatusSelect,
    orderBy: { title: "asc" },
  });
};

// ─── Get single attendance status ────────────────────────────────────────────
export const getAttendanceStatusById = async (id: number): Promise<AttendanceStatusRecord> => {
  return findAttendanceStatusOrThrow(id);
};

// ─── Create attendance status ─────────────────────────────────────────────────
export const createAttendanceStatus = async (
  input: CreateAttendanceStatusInput,
  actorId?: number
): Promise<AttendanceStatusRecord> => {
  await assertTitleIsUnique(input.title);

  return prisma.erpAttendanceStatuses.create({
    data: {
      title: input.title,
      display_class: input.display_class ?? null,
      counts_as_absent: input.counts_as_absent ?? 0,
      status: input.status ?? ATTENDANCE_STATUS_STATUS.ACTIVE,
      // created_by has no default and isn't nullable at the DB level — 0 is
      // this codebase's placeholder for "no authenticated actor id available"
      // (same convention as HOLIDAY_LEGACY_DEFAULTS in holiday.constants.ts).
      created_by: actorId ?? 0,
      last_updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: attendanceStatusSelect,
  });
};

// ─── Update attendance status ─────────────────────────────────────────────────
export const updateAttendanceStatus = async (
  id: number,
  input: UpdateAttendanceStatusInput,
  actorId?: number
): Promise<AttendanceStatusRecord> => {
  await findAttendanceStatusOrThrow(id);

  if (input.title !== undefined) {
    await assertTitleIsUnique(input.title, id);
  }

  return prisma.erpAttendanceStatuses.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.display_class !== undefined ? { display_class: input.display_class } : {}),
      ...(input.counts_as_absent !== undefined ? { counts_as_absent: input.counts_as_absent } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      last_updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: attendanceStatusSelect,
  });
};

// ─── Delete attendance status (hard delete — no deleted_at on this table) ───
export const deleteAttendanceStatus = async (id: number): Promise<void> => {
  await findAttendanceStatusOrThrow(id);
  await assertAttendanceStatusNotInUse(id);
  await prisma.erpAttendanceStatuses.delete({ where: { id } });
};