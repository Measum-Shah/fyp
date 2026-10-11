import { prisma } from "../../../config/db";
import { AppError } from "../utils/fee.helpers";
import { ACTIVE_STATUS } from "../constants/fee.constants";

export type ErpFeeHeadListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string | number;
};

export const listErpFeeHeads = async (params: ErpFeeHeadListParams) => {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    deleted_at: null,
  };

  if (params.status !== undefined && params.status !== "") {
    where.status = Number(params.status);
  }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.erpFeeHead.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: limit,
    }),
    prisma.erpFeeHead.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getErpFeeHeadById = async (id: number) => {
  const item = await prisma.erpFeeHead.findFirst({
    where: { id, deleted_at: null },
  });
  if (!item) throw new AppError("ERP fee head not found", 404);
  return item;
};

export const createErpFeeHead = async (
  data: {
    title: string;
    description?: string | null;
    fee_section_id?: number | null;
    status?: number;
  },
  userId?: number
) => {
  const title = data.title.trim();

  const duplicate = await prisma.erpFeeHead.findFirst({
    where: {
      title: { equals: title, mode: "insensitive" },
      deleted_at: null,
    },
  });

  if (duplicate) {
    throw new AppError("An ERP fee head with this title already exists", 400);
  }

  return prisma.erpFeeHead.create({
    data: {
      title,
      description: data.description?.trim() || "",
      fee_section_id: data.fee_section_id ?? null,
      status: data.status !== undefined ? Number(data.status) : ACTIVE_STATUS.ACTIVE,
      rec_parent_group_id: 0,
      inc_parent_group_id: 0,
      rec_group_id: 0,
      inc_group_id: 0,
      multiple_options: 0,
      created_by: userId ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

export const updateErpFeeHead = async (
  id: number,
  data: Partial<{
    title: string;
    description: string | null;
    fee_section_id: number | null;
    status: number;
  }>,
  userId?: number
) => {
  await getErpFeeHeadById(id);

  if (data.title) {
    const title = data.title.trim();
    const duplicate = await prisma.erpFeeHead.findFirst({
      where: {
        id: { not: id },
        title: { equals: title, mode: "insensitive" },
        deleted_at: null,
      },
    });

    if (duplicate) {
      throw new AppError("An ERP fee head with this title already exists", 400);
    }
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description?.trim() || "";
  if (data.fee_section_id !== undefined) updateData.fee_section_id = data.fee_section_id;
  if (data.status !== undefined) updateData.status = Number(data.status);
  if (userId) updateData.updated_by = userId;

  return prisma.erpFeeHead.update({
    where: { id },
    data: updateData,
  });
};

export const setErpFeeHeadStatus = async (
  id: number,
  status: number,
  userId?: number
) => {
  await getErpFeeHeadById(id);
  return prisma.erpFeeHead.update({
    where: { id },
    data: {
      status: Number(status),
      updated_by: userId ?? null,
      updated_at: new Date(),
    },
  });
};

export const deleteErpFeeHead = async (id: number) => {
  await getErpFeeHeadById(id);

  // Check if any Fee Types (fee_heads) link to this ERP Fee Head
  const linkedTypesCount = await prisma.feeHeads.count({
    where: { erp_fees_head_id: id },
  });

  if (linkedTypesCount > 0) {
    throw new AppError(
      `Cannot delete this ERP fee head because ${linkedTypesCount} fee type(s) are linked to it as parent.`,
      400
    );
  }

  return prisma.erpFeeHead.delete({
    where: { id },
  });
};
