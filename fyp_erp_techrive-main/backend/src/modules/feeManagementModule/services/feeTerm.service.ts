import { prisma } from "../../../config/db";
import { AppError, parseDateOnly } from "../utils/fee.helpers";

export type TermListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branch_id?: number;
  session_id?: number;
  program_id?: number;
  class_id?: number;
  group_id?: number;
  board_id?: number;
};

export const listFeeTerms = async (params: TermListParams) => {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.branch_id) where.branch_id = params.branch_id;
  if (params.session_id) where.session_id = params.session_id;
  if (params.program_id) where.program_id = params.program_id;
  if (params.class_id) where.class_id = params.class_id;
  if (params.group_id !== undefined) where.group_id = params.group_id;
  if (params.board_id) where.board_id = params.board_id;
  if (params.status !== undefined && params.status !== "") {
    where.status = params.status;
  }
  if (params.search) {
    where.term_title = { contains: params.search, mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    prisma.feeTerms.findMany({
      where,
      orderBy: [{ term_number: "asc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    prisma.feeTerms.count({ where }),
  ]);

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  };
};

export const getFeeTermById = async (id: number) => {
  const item = await prisma.feeTerms.findUnique({ where: { id } });
  if (!item) throw new AppError("Fee cycle / term not found", 404);
  return item;
};

export const createFeeTerm = async (
  data: {
    branch_id: number;
    session_id?: number;
    program_id: number;
    board_id: number;
    class_id: number;
    group_id?: number;
    intake_id?: number;
    term_number: number;
    term_title: string;
    term_date?: string | null;
    starting_date: string;
    ending_date: string;
    status?: string;
  },
  userId: number
) => {
  const starting = parseDateOnly(data.starting_date);
  const ending = parseDateOnly(data.ending_date);
  if (ending < starting) {
    throw new AppError("Ending date must be on or after starting date");
  }

  const duplicate = await prisma.feeTerms.findFirst({
    where: {
      branch_id: data.branch_id,
      program_id: data.program_id,
      class_id: data.class_id,
      board_id: data.board_id,
      session_id: data.session_id ?? null,
      term_number: data.term_number,
      term_title: data.term_title.trim(),
      group_id: data.group_id ?? 0,
    },
  });
  if (duplicate) {
    throw new AppError(
      "A fee cycle with this term number and title already exists for the selected context"
    );
  }

  return prisma.feeTerms.create({
    data: {
      branch_id: data.branch_id,
      session_id: data.session_id ?? null,
      program_id: data.program_id,
      board_id: data.board_id,
      class_id: data.class_id,
      group_id: data.group_id ?? 0,
      intake_id: data.intake_id ?? null,
      term_number: data.term_number,
      term_title: data.term_title.trim(),
      term_date: data.term_date ? parseDateOnly(data.term_date) : starting,
      starting_date: starting,
      ending_date: ending,
      status: data.status ?? "1",
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

export const updateFeeTerm = async (
  id: number,
  data: Partial<{
    branch_id: number;
    session_id: number;
    program_id: number;
    board_id: number;
    class_id: number;
    group_id: number;
    intake_id: number;
    term_number: number;
    term_title: string;
    term_date: string | null;
    starting_date: string;
    ending_date: string;
    status: string;
  }>,
  userId: number
) => {
  const existing = await getFeeTermById(id);
  const starting = data.starting_date
    ? parseDateOnly(data.starting_date)
    : existing.starting_date;
  const ending = data.ending_date
    ? parseDateOnly(data.ending_date)
    : existing.ending_date;
  if (ending < starting) {
    throw new AppError("Ending date must be on or after starting date");
  }

  return prisma.feeTerms.update({
    where: { id },
    data: {
      branch_id: data.branch_id,
      session_id: data.session_id,
      program_id: data.program_id,
      board_id: data.board_id,
      class_id: data.class_id,
      group_id: data.group_id,
      intake_id: data.intake_id,
      term_number: data.term_number,
      term_title: data.term_title?.trim(),
      term_date:
        data.term_date === null
          ? null
          : data.term_date
            ? parseDateOnly(data.term_date)
            : undefined,
      starting_date: data.starting_date ? starting : undefined,
      ending_date: data.ending_date ? ending : undefined,
      status: data.status,
      last_updated_by: userId,
      updated_at: new Date(),
    },
  });
};

export const setFeeTermStatus = async (
  id: number,
  status: string,
  userId: number
) => {
  await getFeeTermById(id);
  return prisma.feeTerms.update({
    where: { id },
    data: { status, last_updated_by: userId, updated_at: new Date() },
  });
};

export const deleteFeeTerm = async (id: number) => {
  await getFeeTermById(id);
  const [installments, structures] = await Promise.all([
    prisma.installmentPlans.count({ where: { fee_term_id: id } }),
    prisma.feeStructures.count({ where: { term_id: id } }),
  ]);
  if (installments > 0 || structures > 0) {
    throw new AppError(
      `Cannot delete: linked to ${installments} installment(s) and ${structures} structure line(s). Deactivate instead.`
    );
  }
  return prisma.feeTerms.delete({ where: { id } });
};
