import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { isBranchVisible } from "../utils/branch-scope.util";
import { CreateLoanTypeInput, UpdateLoanTypeInput } from "../validators/loanType.validator";

const loanTypeSelect = {
  loan_id: true,
  loan_type: true,
  description: true,
  branch_id: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpLoansSelect;

export type LoanTypeRecord = Prisma.ErpLoansGetPayload<{ select: typeof loanTypeSelect }>;

interface ListLoanTypesParams {
  page: number;
  limit: number;
  search?: string;
}

interface ListLoanTypesResult {
  data: LoanTypeRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const findLoanTypeOrThrow = async (id: number): Promise<LoanTypeRecord> => {
  const record = await prisma.erpLoans.findUnique({ where: { loan_id: id }, select: loanTypeSelect });
  if (!record) {
    throw AppError.notFound(`Loan type with id ${id} was not found`);
  }
  return record;
};

/**
 * erp_loans.loan_id has no @default(autoincrement()) — Postgres won't
 * generate it. Computed here as MAX(loan_id) + 1. This has a small
 * race-condition window under concurrent creates; acceptable for a
 * low-traffic, admin-only master table but not safe at high concurrency —
 * see loanType.constants.ts.
 */
const nextLoanTypeId = async (): Promise<number> => {
  const top = await prisma.erpLoans.findFirst({ orderBy: { loan_id: "desc" }, select: { loan_id: true } });
  return (top?.loan_id ?? 0) + 1;
};

export const listLoanTypes = async (
  params: ListLoanTypesParams,
  branchIds?: number[] | null
): Promise<ListLoanTypesResult> => {
  const { page, limit, search } = params;

  const where: Prisma.ErpLoansWhereInput = {
    ...(branchIds ? { AND: [{ OR: [{ branch_id: null }, { branch_id: { in: branchIds } }] }] } : {}),
    ...(search
      ? {
          OR: [
            { loan_type: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpLoans.count({ where }),
    prisma.erpLoans.findMany({
      where,
      select: loanTypeSelect,
      orderBy: { loan_id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

// ─── Lookup — all loan types, unpaginated (for the Loan Request dropdown) ───
export const listLoanTypeLookup = async (): Promise<{ id: number; name: string }[]> => {
  const rows = await prisma.erpLoans.findMany({
    select: { loan_id: true, loan_type: true },
    orderBy: { loan_type: "asc" },
  });
  return rows.map((r) => ({ id: r.loan_id, name: r.loan_type }));
};

export const getLoanTypeById = async (id: number, branchIds?: number[] | null): Promise<LoanTypeRecord> => {
  const record = await findLoanTypeOrThrow(id);
  if (branchIds !== undefined && !isBranchVisible(branchIds ?? null, record.branch_id)) {
    throw AppError.notFound(`Loan type with id ${id} was not found`);
  }
  return record;
};

export const createLoanType = async (input: CreateLoanTypeInput): Promise<LoanTypeRecord> => {
  const loan_id = await nextLoanTypeId();
  const now = new Date();

  return prisma.erpLoans.create({
    data: {
      loan_id,
      loan_type: input.loan_type,
      description: input.description,
      created_at: now,
      updated_at: now,
    },
    select: loanTypeSelect,
  });
};

export const updateLoanType = async (id: number, input: UpdateLoanTypeInput): Promise<LoanTypeRecord> => {
  await findLoanTypeOrThrow(id);

  return prisma.erpLoans.update({
    where: { loan_id: id },
    data: {
      ...(input.loan_type !== undefined ? { loan_type: input.loan_type } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      updated_at: new Date(),
    },
    select: loanTypeSelect,
  });
};

/** Hard delete — no deleted_at column on this table. */
export const deleteLoanType = async (id: number): Promise<void> => {
  await findLoanTypeOrThrow(id);
  await prisma.erpLoans.delete({ where: { loan_id: id } });
};
