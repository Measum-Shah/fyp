import { prisma } from "../../../config/db";
import { AppError } from "../utils/fee.helpers";
import { ACTIVE_STATUS_STRING } from "../constants/fee.constants";

export type ListPrintParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export const listFeeSectionPrints = async (params: ListPrintParams) => {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.status !== undefined && params.status !== "") {
    where.status = params.status;
  }
  if (params.search) {
    where.title = { contains: params.search, mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    prisma.feeSectionPrintIds.findMany({
      where,
      orderBy: { id: "asc" },
      skip,
      take: limit,
    }),
    prisma.feeSectionPrintIds.count({ where }),
  ]);

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  };
};

export const getFeeSectionPrintById = async (id: number) => {
  const item = await prisma.feeSectionPrintIds.findUnique({ where: { id } });
  if (!item) throw new AppError("Fee section print ID not found", 404);
  return item;
};

export const createFeeSectionPrint = async (
  data: {
    title: string;
    status?: string;
  },
  userId?: number
) => {
  const title = data.title.trim();
  if (!title) {
    throw new AppError("Title is required", 400);
  }

  const duplicate = await prisma.feeSectionPrintIds.findFirst({
    where: {
      title: { equals: title, mode: "insensitive" },
    },
  });
  if (duplicate) {
    throw new AppError("A fee section print setup with this title already exists", 400);
  }

  return prisma.feeSectionPrintIds.create({
    data: {
      title,
      status: data.status ?? ACTIVE_STATUS_STRING.ACTIVE,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

export const updateFeeSectionPrint = async (
  id: number,
  data: Partial<{
    title: string;
    status: string;
  }>,
  userId?: number
) => {
  await getFeeSectionPrintById(id);

  const title = data.title?.trim();
  if (title) {
    const duplicate = await prisma.feeSectionPrintIds.findFirst({
      where: {
        id: { not: id },
        title: { equals: title, mode: "insensitive" },
      },
    });
    if (duplicate) {
      throw new AppError("A fee section print setup with this title already exists", 400);
    }
  }

  return prisma.feeSectionPrintIds.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      last_updated_by: userId,
      updated_at: new Date(),
    },
  });
};

export const setFeeSectionPrintStatus = async (
  id: number,
  status: "1" | "0",
  userId?: number
) => {
  await getFeeSectionPrintById(id);
  return prisma.feeSectionPrintIds.update({
    where: { id },
    data: { status, last_updated_by: userId, updated_at: new Date() },
  });
};

export const deleteFeeSectionPrint = async (id: number) => {
  await getFeeSectionPrintById(id);
  const linkedSections = await prisma.feeSections.count({
    where: { fee_section_print_id: id },
  });
  if (linkedSections > 0) {
    throw new AppError(
      `Cannot delete: ${linkedSections} fee section(s) are linked to this print ID. Deactivate it or reassign sections first.`
    );
  }
  return prisma.feeSectionPrintIds.delete({ where: { id } });
};
