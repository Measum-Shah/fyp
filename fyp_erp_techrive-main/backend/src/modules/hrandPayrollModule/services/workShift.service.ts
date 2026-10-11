import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { isBranchVisible } from "../utils/branch-scope.util";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { WORK_SHIFT_STATUS } from "../constants/workShift.constants";
import { CreateWorkShiftInput, UpdateWorkShiftInput } from "../validators/workShift.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const workShiftSelect = {
  id: true,
  name: true,
  branch_id: true,
  grace_in: true,
  grace_out: true,
  status: true,
  created_by: true,
  updated_by: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpHrmWorkShiftsSelect;

type WorkShiftRow = Prisma.ErpHrmWorkShiftsGetPayload<{ select: typeof workShiftSelect }>;

const workWeekSelect = {
  id: true,
  day: true,
  on_off: true,
  work_shift_id: true,
  start_time: true,
  end_time: true,
} satisfies Prisma.ErpHrmWorkWeeksSelect;

type WorkWeekRow = Prisma.ErpHrmWorkWeeksGetPayload<{ select: typeof workWeekSelect }>;

export interface WorkWeekDayRecord {
  day: number;
  on_off: number;
  start_time: string | null;
  end_time: string | null;
}

export interface WorkShiftRecord extends WorkShiftRow {
  week: WorkWeekDayRecord[];
}

interface ListWorkShiftsParams {
  page: number;
  limit: number;
  search?: string;
  branch_id?: number;
  company_id?: number;
  status?: number;
}

interface ListWorkShiftsResult {
  data: WorkShiftRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Time <-> string helpers ─────────────────────────────────────────────────
// erp_hrm_work_weeks.start_time/end_time are @db.Time(6) columns, so Prisma
// needs a full Date on write and returns a full Date on read. Since Postgres
// TIME has no timezone/date component, both directions are anchored to the
// same fixed UTC date (1970-01-01) so the "HH:mm" round-trips exactly
// regardless of server timezone.
const timeStringToDate = (hhmm: string): Date => new Date(`1970-01-01T${hhmm}:00.000Z`);

const dateToTimeString = (value: Date | null): string | null => {
  if (!value) return null;
  return value.toISOString().slice(11, 16);
};

const toWorkWeekDayRecord = (row: WorkWeekRow): WorkWeekDayRecord => ({
  day: row.day,
  on_off: row.on_off ?? 0,
  start_time: dateToTimeString(row.start_time),
  end_time: dateToTimeString(row.end_time),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertBranchExists = async (branch_id: number) => {
  const branch = await prisma.erpBranches.findFirst({
    where: { id: branch_id, deleted_at: null },
  });

  if (!branch) {
    throw AppError.badRequest("Campus does not exist", {
      branch_id: `No campus found with id ${branch_id}`,
    });
  }
};

/**
 * erp_hrm_work_shifts has no unique constraint on `name` at the DB level, so
 * uniqueness is enforced here at the application layer, same pattern as
 * branch/company/department. Scoped per branch_id (including the "no
 * branch" / org-wide bucket, branch_id: null) since two branches may
 * reasonably both have a shift called "Morning".
 */
const assertNameIsUnique = async (
  name: string,
  branch_id: number | null | undefined,
  excludeId?: number
) => {
  const existing = await prisma.erpHrmWorkShifts.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      branch_id: branch_id ?? null,
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A shift with this name already exists for this campus", {
      name: `Shift '${name}' already exists for this campus`,
    });
  }
};

const findActiveWorkShiftOrThrow = async (id: number): Promise<WorkShiftRow> => {
  const shift = await prisma.erpHrmWorkShifts.findFirst({
    where: { id, deleted_at: null },
    select: workShiftSelect,
  });

  if (!shift) {
    throw AppError.notFound(`Work shift with id ${id} was not found`);
  }

  return shift;
};

const getWeekForShift = async (work_shift_id: number): Promise<WorkWeekDayRecord[]> => {
  const rows = await prisma.erpHrmWorkWeeks.findMany({
    where: { work_shift_id },
    select: workWeekSelect,
    orderBy: { day: "asc" },
  });

  return rows.map(toWorkWeekDayRecord);
};

/**
 * staff.work_shift_id is a real (if unenforced-at-the-DB-level) foreign key
 * onto this table, so deleting a shift while staff still reference it would
 * silently orphan those assignments — guarded the same way
 * branch.service.ts/department.service.ts guard their own in-use deletes.
 */
const assertWorkShiftNotInUse = async (id: number) => {
  const staffCount = await prisma.staff.count({
    where: { work_shift_id: id, deleted_at: null },
  });

  if (staffCount > 0) {
    throw AppError.conflict(
      `Cannot delete this shift — ${staffCount} employee(s) are still assigned to it`,
      { id: "Reassign or remove affected employees before deleting this shift" }
    );
  }
};

// ─── List work shifts ─────────────────────────────────────────────────────────
export const listWorkShifts = async (
  params: ListWorkShiftsParams,
  roleBranchIds?: number[] | null
): Promise<ListWorkShiftsResult> => {
  const { page, limit, search, branch_id, company_id, status } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  // Org-wide shifts (branch_id: null) stay visible regardless of the
  // selected company — same "null bucket" reasoning as the roleBranchIds
  // OR below, just for the Company→Branch scoping filter instead.
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.ErpHrmWorkShiftsWhereInput = {
    deleted_at: null,
    // A role-scoped caller's assigned branches are ANDed with whatever
    // branch_id they explicitly searched for (same intersect-not-replace
    // reasoning as the employee-scoping modules) — if they asked for a
    // branch outside their own scope, they correctly get nothing back
    // rather than silently seeing another branch's shifts.
    ...(roleBranchIds
      ? { AND: [{ OR: [{ branch_id: null }, { branch_id: { in: roleBranchIds } }] }] }
      : {}),
    ...(companyBranchIds
      ? { AND: [{ OR: [{ branch_id: null }, { branch_id: { in: companyBranchIds } }] }] }
      : {}),
    ...(branch_id !== undefined ? { branch_id } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, shifts] = await prisma.$transaction([
    prisma.erpHrmWorkShifts.count({ where }),
    prisma.erpHrmWorkShifts.findMany({
      where,
      select: workShiftSelect,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // No relation declared in the (flat, relation-less) Prisma schema, so the
  // weekly schedule is fetched per shift and merged in — the list page is
  // paginated to at most 100 rows, so this stays a handful of extra queries.
  const data: WorkShiftRecord[] = await Promise.all(
    shifts.map(async (shift) => ({ ...shift, week: await getWeekForShift(shift.id) }))
  );

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

// ─── Get single work shift ───────────────────────────────────────────────────
export const getWorkShiftById = async (id: number, roleBranchIds?: number[] | null): Promise<WorkShiftRecord> => {
  const shift = await findActiveWorkShiftOrThrow(id);
  if (roleBranchIds !== undefined && !isBranchVisible(roleBranchIds ?? null, shift.branch_id)) {
    throw AppError.notFound(`Work shift with id ${id} was not found`);
  }
  const week = await getWeekForShift(id);
  return { ...shift, week };
};

// ─── Create work shift ────────────────────────────────────────────────────────
export const createWorkShift = async (
  input: CreateWorkShiftInput,
  actorId?: number
): Promise<WorkShiftRecord> => {
  if (input.branch_id != null) {
    await assertBranchExists(input.branch_id);
  }
  await assertNameIsUnique(input.name, input.branch_id ?? null);

  const created = await prisma.$transaction(async (tx) => {
    const shift = await tx.erpHrmWorkShifts.create({
      data: {
        name: input.name,
        branch_id: input.branch_id ?? null,
        grace_in: input.grace_in ?? null,
        grace_out: input.grace_out ?? null,
        status: input.status ?? WORK_SHIFT_STATUS.ACTIVE,
        created_by: actorId ?? null,
        updated_by: actorId ?? null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: workShiftSelect,
    });

    await tx.erpHrmWorkWeeks.createMany({
      data: input.week.map((d) => ({
        work_shift_id: shift.id,
        day: d.day,
        on_off: d.on_off,
        start_time: d.start_time ? timeStringToDate(d.start_time) : null,
        end_time: d.end_time ? timeStringToDate(d.end_time) : null,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    });

    return shift;
  });

  return { ...created, week: await getWeekForShift(created.id) };
};

// ─── Update work shift ────────────────────────────────────────────────────────
export const updateWorkShift = async (
  id: number,
  input: UpdateWorkShiftInput,
  actorId?: number
): Promise<WorkShiftRecord> => {
  const existing = await findActiveWorkShiftOrThrow(id);

  const nextBranchId = input.branch_id !== undefined ? input.branch_id : existing.branch_id;
  if (nextBranchId != null) {
    await assertBranchExists(nextBranchId);
  }
  if (input.name !== undefined) {
    await assertNameIsUnique(input.name, nextBranchId, id);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const shift = await tx.erpHrmWorkShifts.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
        ...(input.grace_in !== undefined ? { grace_in: input.grace_in } : {}),
        ...(input.grace_out !== undefined ? { grace_out: input.grace_out } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updated_by: actorId ?? null,
        updated_at: new Date(),
      },
      select: workShiftSelect,
    });

    if (input.week) {
      // Full replace rather than per-day upsert — simpler and avoids stale
      // rows, and a schedule update always submits the complete 7-day set
      // (enforced by workShift.validator.ts).
      await tx.erpHrmWorkWeeks.deleteMany({ where: { work_shift_id: id } });
      await tx.erpHrmWorkWeeks.createMany({
        data: input.week.map((d) => ({
          work_shift_id: id,
          day: d.day,
          on_off: d.on_off,
          start_time: d.start_time ? timeStringToDate(d.start_time) : null,
          end_time: d.end_time ? timeStringToDate(d.end_time) : null,
          created_at: new Date(),
          updated_at: new Date(),
        })),
      });
    }

    return shift;
  });

  return { ...updated, week: await getWeekForShift(id) };
};

// ─── Delete work shift (soft delete, guarded) ─────────────────────────────────
export const deleteWorkShift = async (id: number, deletedBy?: number): Promise<void> => {
  await findActiveWorkShiftOrThrow(id);
  await assertWorkShiftNotInUse(id);

  await prisma.erpHrmWorkShifts.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      status: WORK_SHIFT_STATUS.INACTIVE,
      updated_at: new Date(),
    },
  });
};