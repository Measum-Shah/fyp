import { prisma } from "../../../config/db";
import { AppError, slugify } from "../utils/fee.helpers";
import { ACTIVE_STATUS } from "../constants/fee.constants";

export type HeadListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string | number;
  branch_id?: number;
  session_id?: number;
  program_id?: number;
  class_id?: number;
  fee_section_id?: number;
};

export const listFeeHeads = async (params: HeadListParams) => {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.branch_id) where.branch_id = params.branch_id;
  if (params.session_id) where.session_id = params.session_id;
  if (params.program_id) where.program_id = params.program_id;
  if (params.class_id !== undefined) where.class_id = params.class_id;
  if (params.fee_section_id) where.fee_section_id = params.fee_section_id;
  if (params.status !== undefined && params.status !== "") {
    where.status = Number(params.status);
  }
  if (params.search) {
    where.OR = [
      { fee_head_title: { contains: params.search, mode: "insensitive" } },
      { fee_head_desc: { contains: params.search, mode: "insensitive" } },
      { slug: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [rawItems, total] = await Promise.all([
    prisma.feeHeads.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: limit,
    }),
    prisma.feeHeads.count({ where }),
  ]);

  const sectionIds = [
    ...new Set(
      rawItems
        .map((h) => h.fee_section_id)
        .filter((id): id is number => id != null)
    ),
  ];
  const erpHeadIds = [
    ...new Set(
      rawItems
        .map((h) => h.erp_fees_head_id)
        .filter((id): id is number => id != null)
    ),
  ];

  const [sections, erpHeads] = await Promise.all([
    sectionIds.length
      ? prisma.feeSections.findMany({
          where: { id: { in: sectionIds } },
          select: { id: true, title: true },
        })
      : [],
    erpHeadIds.length
      ? prisma.erpFeeHead.findMany({
          where: { id: { in: erpHeadIds } },
          select: { id: true, title: true },
        })
      : [],
  ]);

  const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s.title]));
  const erpHeadMap = Object.fromEntries(erpHeads.map((e) => [e.id, e.title]));

  const items = rawItems.map((h) => ({
    ...h,
    fee_section_title: h.fee_section_id
      ? sectionMap[h.fee_section_id] || null
      : null,
    erp_fees_head_title: h.erp_fees_head_id
      ? erpHeadMap[h.erp_fees_head_id] || null
      : null,
  }));

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  };
};

export const getFeeHeadById = async (id: number) => {
  const item = await prisma.feeHeads.findUnique({ where: { id } });
  if (!item) throw new AppError("Fee type not found", 404);
  return item;
};

export const createFeeHead = async (
  data: {
    fee_head_title: string;
    fee_head_desc?: string | null;
    fee_section_id?: number;
    branch_id?: number;
    board_id?: number;
    session_id?: number;
    program_id?: number;
    class_id?: number;
    intake_id?: number;
    erp_fees_head_id?: number;
    erp_branch_id?: number;
    rec_group_id?: string;
    dividable?: number | null;
    slug?: string;
    status?: number;
  },
  userId: number
) => {
  const title = data.fee_head_title.trim();
  const slug = data.slug?.trim() || slugify(title);
  const branchId = data.branch_id ?? data.erp_branch_id ?? 0;

  if (data.fee_section_id) {
    const section = await prisma.feeSections.findUnique({
      where: { id: data.fee_section_id },
    });
    if (!section) throw new AppError("Fee section not found", 404);
  }

  const duplicate = await prisma.feeHeads.findFirst({
    where: {
      fee_head_title: title,
      branch_id: data.branch_id ?? null,
      session_id: data.session_id ?? null,
      program_id: data.program_id ?? null,
      class_id: data.class_id ?? 0,
    },
  });
  if (duplicate) {
    throw new AppError(
      "A fee type with this title already exists for the selected academic context"
    );
  }

  return prisma.feeHeads.create({
    data: {
      fee_head_title: title,
      fee_head_desc: data.fee_head_desc ?? null,
      fee_section_id: data.fee_section_id ?? null,
      branch_id: data.branch_id ?? null,
      board_id: data.board_id ?? null,
      session_id: data.session_id ?? null,
      program_id: data.program_id ?? null,
      class_id: data.class_id ?? 0,
      intake_id: data.intake_id ?? null,
      erp_fees_head_id: data.erp_fees_head_id ?? null,
      erp_branch_id: data.erp_branch_id ?? branchId,
      rec_group_id: data.rec_group_id?.trim() || "0",
      dividable: data.dividable ?? 1,
      slug,
      status: data.status ?? ACTIVE_STATUS.ACTIVE,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

export const updateFeeHead = async (
  id: number,
  data: Partial<{
    fee_head_title: string;
    fee_head_desc: string | null;
    fee_section_id: number;
    branch_id: number;
    board_id: number;
    session_id: number;
    program_id: number;
    class_id: number;
    intake_id: number;
    erp_fees_head_id: number;
    erp_branch_id: number;
    rec_group_id: string;
    dividable: number | null;
    slug: string;
    status: number;
  }>,
  userId: number
) => {
  const existing = await getFeeHeadById(id);
  const title = data.fee_head_title?.trim();

  if (title) {
    const duplicate = await prisma.feeHeads.findFirst({
      where: {
        id: { not: id },
        fee_head_title: title,
        branch_id: data.branch_id ?? existing.branch_id,
        session_id: data.session_id ?? existing.session_id,
        program_id: data.program_id ?? existing.program_id,
        class_id: data.class_id ?? existing.class_id,
      },
    });
    if (duplicate) {
      throw new AppError(
        "A fee type with this title already exists for the selected academic context"
      );
    }
  }

  if (data.fee_section_id) {
    const section = await prisma.feeSections.findUnique({
      where: { id: data.fee_section_id },
    });
    if (!section) throw new AppError("Fee section not found", 404);
  }

  return prisma.feeHeads.update({
    where: { id },
    data: {
      ...data,
      ...(title
        ? {
            fee_head_title: title,
            slug: data.slug?.trim() || slugify(title),
          }
        : data.slug
          ? { slug: data.slug.trim() }
          : {}),
      last_updated_by: userId,
      updated_at: new Date(),
    },
  });
};

export const setFeeHeadStatus = async (
  id: number,
  status: number,
  userId: number
) => {
  await getFeeHeadById(id);
  return prisma.feeHeads.update({
    where: { id },
    data: { status, last_updated_by: userId, updated_at: new Date() },
  });
};

export const deleteFeeHead = async (id: number) => {
  await getFeeHeadById(id);
  const linkedStructures = await prisma.feeStructures.count({
    where: { fee_head_id: id },
  });
  if (linkedStructures > 0) {
    throw new AppError(
      `Cannot delete: ${linkedStructures} fee structure line(s) use this fee type. Deactivate it instead.`
    );
  }
  return prisma.feeHeads.delete({ where: { id } });
};
