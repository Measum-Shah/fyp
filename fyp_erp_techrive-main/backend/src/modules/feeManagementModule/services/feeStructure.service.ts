import { prisma } from "../../../config/db";
import { AppError } from "../utils/fee.helpers";
import { ACTIVE_STATUS } from "../constants/fee.constants";

export type StructureListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string | number;
  branch_id?: number;
  session_id?: number;
  program_id?: number;
  class_id?: number;
  board_id?: number;
  fee_structure_code?: string;
};

/**
 * fee_master_basics.fee_structure_code is INTEGER while fee_structures stores VARCHAR.
 * Generate a numeric-only code so assignments can reference the same value.
 */
const generateStructureCode = async () => {
  const latest = await prisma.feeStructures.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const base = (latest?.id || 0) + 1;
  const code = `${base}${Date.now().toString().slice(-7)}`;
  return code.slice(0, 18);
};

export const listFeeStructures = async (params: StructureListParams) => {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.branch_id) where.branch_id = params.branch_id;
  if (params.session_id) where.session_id = params.session_id;
  if (params.program_id) where.program_id = params.program_id;
  if (params.class_id) where.class_id = params.class_id;
  if (params.board_id) where.board_id = params.board_id;
  if (params.fee_structure_code) {
    where.fee_structure_code = params.fee_structure_code;
  }
  if (params.status !== undefined && params.status !== "") {
    where.status = Number(params.status);
  }
  if (params.search) {
    where.OR = [
      { fee_structure_code: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [rawItems, total] = await Promise.all([
    prisma.feeStructures.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: limit,
    }),
    prisma.feeStructures.count({ where }),
  ]);

  const headIds = [...new Set(rawItems.map((i) => i.fee_head_id))];
  const heads = headIds.length
    ? await prisma.feeHeads.findMany({
        where: { id: { in: headIds } },
        select: { id: true, fee_head_title: true },
      })
    : [];
  const headMap = Object.fromEntries(
    heads.map((h) => [h.id, h.fee_head_title])
  );

  const items = rawItems.map((item) => ({
    ...item,
    fee_head_title: headMap[item.fee_head_id] || null,
  }));

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  };
};

/** Group structure lines by fee_structure_code for UI overview */
export const listStructureGroups = async (params: StructureListParams) => {
  const { items } = await listFeeStructures({ ...params, limit: 200, page: 1 });
  const groups: Record<
    string,
    {
      fee_structure_code: string;
      branch_id: number;
      program_id: number;
      class_id: number;
      session_id: number | null;
      board_id: number | null;
      term_id: number | null;
      status: number;
      line_count: number;
      total_amount: number;
      lines: typeof items;
    }
  > = {};

  for (const line of items) {
    const code = line.fee_structure_code || `LINE-${line.id}`;
    if (!groups[code]) {
      groups[code] = {
        fee_structure_code: code,
        branch_id: line.branch_id,
        program_id: line.program_id,
        class_id: line.class_id,
        session_id: line.session_id,
        board_id: line.board_id,
        term_id: line.term_id,
        status: line.status,
        line_count: 0,
        total_amount: 0,
        lines: [],
      };
    }
    groups[code].line_count += 1;
    groups[code].total_amount += Number(line.fee_amount || 0);
    groups[code].lines.push(line);
  }

  return { items: Object.values(groups) };
};

export const getFeeStructureById = async (id: number) => {
  const item = await prisma.feeStructures.findUnique({ where: { id } });
  if (!item) throw new AppError("Fee structure line not found", 404);
  return item;
};

export const createFeeStructure = async (
  data: {
    branch_id: number;
    session_id?: number;
    program_id: number;
    class_id: number;
    board_id?: number;
    intake_id?: number;
    term_id?: number;
    fee_head_id: number;
    fee_amount: number;
    fee_structure_code?: string;
    annual_minimum?: number | null;
    monthly_minimum?: number | null;
    description?: string | null;
    status?: number;
    generate_code?: boolean;
  },
  userId: number
) => {
  const head = await prisma.feeHeads.findUnique({
    where: { id: data.fee_head_id },
  });
  if (!head) throw new AppError("Fee type not found", 404);
  if (head.status !== ACTIVE_STATUS.ACTIVE) {
    throw new AppError("Cannot add an inactive fee type to a structure");
  }

  if (data.term_id) {
    const term = await prisma.feeTerms.findUnique({
      where: { id: data.term_id },
    });
    if (!term) throw new AppError("Fee cycle / term not found", 404);
  }

  let code = data.fee_structure_code?.trim();
  if (!code || data.generate_code) {
    code = await generateStructureCode();
  }
  if (!/^\d+$/.test(code)) {
    throw new AppError(
      "fee_structure_code must be numeric so it can be assigned via fee_master_basics"
    );
  }

  const duplicateLine = await prisma.feeStructures.findFirst({
    where: {
      fee_structure_code: code,
      fee_head_id: data.fee_head_id,
      class_id: data.class_id,
      program_id: data.program_id,
      branch_id: data.branch_id,
    },
  });
  if (duplicateLine) {
    throw new AppError(
      "This fee type is already included in the selected fee structure"
    );
  }

  return prisma.feeStructures.create({
    data: {
      branch_id: data.branch_id,
      session_id: data.session_id ?? null,
      program_id: data.program_id,
      class_id: data.class_id,
      board_id: data.board_id ?? null,
      intake_id: data.intake_id ?? null,
      term_id: data.term_id ?? null,
      fee_head_id: data.fee_head_id,
      fee_amount: data.fee_amount,
      fee_structure_code: code,
      annual_minimum: data.annual_minimum ?? 0,
      monthly_minimum: data.monthly_minimum ?? 0,
      description: data.description ?? null,
      status: data.status ?? ACTIVE_STATUS.ACTIVE,
      last_updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

export const createFeeStructureBulk = async (
  data: {
    branch_id: number;
    session_id?: number;
    program_id: number;
    class_id: number;
    board_id?: number;
    intake_id?: number;
    term_id?: number;
    fee_structure_code?: string;
    description?: string | null;
    status?: number;
    lines: Array<{
      fee_head_id: number;
      fee_amount: number;
      annual_minimum?: number | null;
      monthly_minimum?: number | null;
    }>;
  },
  userId: number
) => {
  const headIds = data.lines.map((l) => l.fee_head_id);
  if (new Set(headIds).size !== headIds.length) {
    throw new AppError("Duplicate fee types are not allowed in one structure");
  }

  const heads = await prisma.feeHeads.findMany({
    where: { id: { in: headIds } },
  });
  if (heads.length !== headIds.length) {
    throw new AppError("One or more fee types were not found");
  }
  if (heads.some((h) => h.status !== ACTIVE_STATUS.ACTIVE)) {
    throw new AppError("All fee types in a structure must be active");
  }

  const code =
    data.fee_structure_code?.trim() || (await generateStructureCode());
  if (!/^\d+$/.test(code)) {
    throw new AppError(
      "fee_structure_code must be numeric so it can be assigned via fee_master_basics"
    );
  }

  const created = await prisma.$transaction(
    data.lines.map((line) =>
      prisma.feeStructures.create({
        data: {
          branch_id: data.branch_id,
          session_id: data.session_id ?? null,
          program_id: data.program_id,
          class_id: data.class_id,
          board_id: data.board_id ?? null,
          intake_id: data.intake_id ?? null,
          term_id: data.term_id ?? null,
          fee_head_id: line.fee_head_id,
          fee_amount: line.fee_amount,
          fee_structure_code: code,
          annual_minimum: line.annual_minimum ?? 0,
          monthly_minimum: line.monthly_minimum ?? 0,
          description: data.description ?? null,
          status: data.status ?? ACTIVE_STATUS.ACTIVE,
          last_updated_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      })
    )
  );

  return { fee_structure_code: code, lines: created };
};

export const updateFeeStructure = async (
  id: number,
  data: Partial<{
    branch_id: number;
    session_id: number;
    program_id: number;
    class_id: number;
    board_id: number;
    intake_id: number;
    term_id: number;
    fee_head_id: number;
    fee_amount: number;
    fee_structure_code: string;
    annual_minimum: number | null;
    monthly_minimum: number | null;
    description: string | null;
    status: number;
  }>,
  userId: number
) => {
  await getFeeStructureById(id);

  if (data.fee_head_id) {
    const head = await prisma.feeHeads.findUnique({
      where: { id: data.fee_head_id },
    });
    if (!head) throw new AppError("Fee type not found", 404);
  }

  return prisma.feeStructures.update({
    where: { id },
    data: {
      ...data,
      last_updated_by: userId,
      updated_at: new Date(),
    },
  });
};

export const setFeeStructureStatus = async (
  id: number,
  status: number,
  userId: number
) => {
  await getFeeStructureById(id);
  return prisma.feeStructures.update({
    where: { id },
    data: { status, last_updated_by: userId, updated_at: new Date() },
  });
};

export const setStructureGroupStatus = async (
  feeStructureCode: string,
  status: number,
  userId: number
) => {
  const result = await prisma.feeStructures.updateMany({
    where: { fee_structure_code: feeStructureCode },
    data: { status, last_updated_by: userId, updated_at: new Date() },
  });
  if (result.count === 0) {
    throw new AppError("Fee structure not found", 404);
  }
  return result;
};

export const deleteFeeStructure = async (id: number) => {
  const item = await getFeeStructureById(id);
  if (item.fee_structure_code) {
    const numericCode = Number(item.fee_structure_code);
    if (!Number.isNaN(numericCode)) {
      const assigned = await prisma.feeMasterBasics.count({
        where: { fee_structure_code: numericCode },
      });
      if (assigned > 0) {
        throw new AppError(
          `Cannot delete: structure is assigned to ${assigned} master record(s). Deactivate instead.`
        );
      }
    }
  }
  return prisma.feeStructures.delete({ where: { id } });
};
