import { prisma } from "../../../config/db";
import { AppError, slugify } from "../utils/fee.helpers";
import { ACTIVE_STATUS_STRING } from "../constants/fee.constants";

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branch_id?: number;
  session_id?: number;
};

export const listFeeSections = async (params: ListParams) => {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.branch_id) where.branch_id = params.branch_id;
  if (params.session_id) where.session_id = params.session_id;
  if (params.status !== undefined && params.status !== "") {
    where.status = params.status;
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { slug: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.feeSections.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: limit,
    }),
    prisma.feeSections.count({ where }),
  ]);

  const printIds = Array.from(
    new Set(items.map((i) => i.fee_section_print_id).filter((id): id is number => typeof id === "number" && id > 0))
  );
  const prints = printIds.length > 0
    ? await prisma.feeSectionPrintIds.findMany({
        where: { id: { in: printIds } },
        select: { id: true, title: true },
      })
    : [];
  const printMap = Object.fromEntries(prints.map((p) => [p.id, p.title]));

  const enrichedItems = items.map((i) => ({
    ...i,
    fee_section_print_title: i.fee_section_print_id ? printMap[i.fee_section_print_id] || null : null,
  }));

  return {
    items: enrichedItems,
    meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  };
};

export const getFeeSectionById = async (id: number) => {
  const item = await prisma.feeSections.findUnique({ where: { id } });
  if (!item) throw new AppError("Fee section not found", 404);

  let fee_section_print_title: string | null = null;
  if (item.fee_section_print_id) {
    const print = await prisma.feeSectionPrintIds.findUnique({
      where: { id: item.fee_section_print_id },
      select: { title: true },
    });
    fee_section_print_title = print?.title || null;
  }

  return {
    ...item,
    fee_section_print_title,
  };
};

export const createFeeSection = async (
  data: {
    branch_id: number;
    session_id: number;
    title: string;
    slug?: string;
    type?: number;
    fee_section_print_id?: number;
    status?: string;
  },
  userId: number
) => {
  const title = data.title.trim();
  const slug = data.slug?.trim() || slugify(title);

  const duplicate = await prisma.feeSections.findFirst({
    where: {
      branch_id: data.branch_id,
      session_id: data.session_id,
      OR: [{ title }, { slug }],
    },
  });
  if (duplicate) {
    throw new AppError(
      "A fee section with this title or slug already exists for the selected branch and session"
    );
  }

  return prisma.feeSections.create({
    data: {
      branch_id: data.branch_id,
      session_id: data.session_id,
      title,
      slug,
      type: data.type ?? 1,
      fee_section_print_id: data.fee_section_print_id ?? 0,
      status: data.status ?? ACTIVE_STATUS_STRING.ACTIVE,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

export const updateFeeSection = async (
  id: number,
  data: Partial<{
    branch_id: number;
    session_id: number;
    title: string;
    slug: string;
    type: number;
    fee_section_print_id: number;
    status: string;
  }>,
  userId: number
) => {
  const existing = await getFeeSectionById(id);
  const title = data.title?.trim();
  const slug = data.slug?.trim() || (title ? slugify(title) : undefined);

  if (title || slug) {
    const duplicate = await prisma.feeSections.findFirst({
      where: {
        id: { not: id },
        branch_id: data.branch_id ?? existing.branch_id,
        session_id: data.session_id ?? existing.session_id,
        OR: [
          ...(title ? [{ title }] : []),
          ...(slug ? [{ slug }] : []),
        ],
      },
    });
    if (duplicate) {
      throw new AppError(
        "A fee section with this title or slug already exists for the selected branch and session"
      );
    }
  }

  return prisma.feeSections.update({
    where: { id },
    data: {
      ...data,
      ...(title ? { title } : {}),
      ...(slug ? { slug } : {}),
      last_updated_by: userId,
      updated_at: new Date(),
    },
  });
};

export const setFeeSectionStatus = async (
  id: number,
  status: "1" | "0",
  userId: number
) => {
  await getFeeSectionById(id);
  return prisma.feeSections.update({
    where: { id },
    data: { status, last_updated_by: userId, updated_at: new Date() },
  });
};

export const deleteFeeSection = async (id: number) => {
  await getFeeSectionById(id);
  const linkedHeads = await prisma.feeHeads.count({
    where: { fee_section_id: id },
  });
  if (linkedHeads > 0) {
    throw new AppError(
      `Cannot delete: ${linkedHeads} fee type(s) are linked to this section. Deactivate it instead.`
    );
  }
  return prisma.feeSections.delete({ where: { id } });
};
