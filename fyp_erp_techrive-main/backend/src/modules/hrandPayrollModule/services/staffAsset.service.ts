import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { STAFF_ASSET_STATUS } from "../constants/staffAsset.constants";
import { CreateStaffAssetInput, UpdateStaffAssetInput } from "../validators/staffAsset.validator";

const staffAssetSelect = {
  id: true,
  staff_id: true,
  asset_id: true,
  asset_name: true,
  asset_type: true,
  serial_number: true,
  asset_code: true,
  issue_date: true,
  return_date: true,
  condition: true,
  remarks: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.StaffAssetsSelect;

export type StaffAssetRecord = Prisma.StaffAssetsGetPayload<{ select: typeof staffAssetSelect }>;

interface ListStaffAssetsParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
  status?: number;
}

interface ListStaffAssetsResult {
  data: StaffAssetRecord[];
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

const findActiveStaffAssetOrThrow = async (id: number): Promise<StaffAssetRecord> => {
  const record = await prisma.staffAssets.findFirst({
    where: { id, deleted_at: null },
    select: staffAssetSelect,
  });

  if (!record) {
    throw AppError.notFound(`Asset record with id ${id} was not found`);
  }

  return record;
};

// ─── List staff assets ────────────────────────────────────────────────────────
export const listStaffAssets = async (
  params: ListStaffAssetsParams,
  scope?: RecordScope
): Promise<ListStaffAssetsResult> => {
  const { page, limit, search, staff_id, status } = params;

  const where: Prisma.StaffAssetsWhereInput = {
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
            { asset_name: { contains: search, mode: "insensitive" } },
            { asset_type: { contains: search, mode: "insensitive" } },
            { serial_number: { contains: search, mode: "insensitive" } },
            { asset_code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.staffAssets.count({ where }),
    prisma.staffAssets.findMany({
      where,
      select: staffAssetSelect,
      orderBy: { id: "desc" },
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

// ─── Get single asset record ──────────────────────────────────────────────────
export const getStaffAssetById = async (id: number, scope?: RecordScope): Promise<StaffAssetRecord> => {
  const record = await findActiveStaffAssetOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Staff asset with id ${id} was not found`);
  }
  return record;
};

// ─── Create asset record ──────────────────────────────────────────────────────
export const createStaffAsset = async (
  input: CreateStaffAssetInput,
  actorId?: number
): Promise<StaffAssetRecord> => {
  await assertEmployeeExists(input.staff_id);

  return prisma.staffAssets.create({
    data: {
      staff_id: input.staff_id,
      asset_id: input.asset_id,
      asset_name: input.asset_name,
      asset_type: input.asset_type,
      serial_number: input.serial_number,
      asset_code: input.asset_code,
      issue_date: input.issue_date ? new Date(input.issue_date) : null,
      return_date: input.return_date ? new Date(input.return_date) : null,
      condition: input.condition,
      remarks: input.remarks,
      status: input.status ?? STAFF_ASSET_STATUS.ACTIVE,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: staffAssetSelect,
  });
};

// ─── Update asset record ──────────────────────────────────────────────────────
export const updateStaffAsset = async (
  id: number,
  input: UpdateStaffAssetInput,
  actorId?: number
): Promise<StaffAssetRecord> => {
  await findActiveStaffAssetOrThrow(id);

  if (input.staff_id !== undefined) {
    await assertEmployeeExists(input.staff_id);
  }

  return prisma.staffAssets.update({
    where: { id },
    data: {
      ...(input.staff_id !== undefined ? { staff_id: input.staff_id } : {}),
      ...(input.asset_id !== undefined ? { asset_id: input.asset_id } : {}),
      ...(input.asset_name !== undefined ? { asset_name: input.asset_name } : {}),
      ...(input.asset_type !== undefined ? { asset_type: input.asset_type } : {}),
      ...(input.serial_number !== undefined ? { serial_number: input.serial_number } : {}),
      ...(input.asset_code !== undefined ? { asset_code: input.asset_code } : {}),
      ...(input.issue_date !== undefined
        ? { issue_date: input.issue_date ? new Date(input.issue_date) : null }
        : {}),
      ...(input.return_date !== undefined
        ? { return_date: input.return_date ? new Date(input.return_date) : null }
        : {}),
      ...(input.condition !== undefined ? { condition: input.condition } : {}),
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: staffAssetSelect,
  });
};

// ─── Delete asset record (soft delete) ────────────────────────────────────────
export const deleteStaffAsset = async (id: number, deletedBy?: number): Promise<void> => {
  await findActiveStaffAssetOrThrow(id);

  await prisma.staffAssets.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      status: STAFF_ASSET_STATUS.INACTIVE,
      updated_at: new Date(),
    },
  });
};
