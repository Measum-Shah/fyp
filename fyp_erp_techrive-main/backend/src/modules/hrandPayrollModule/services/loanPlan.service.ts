import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { isBranchVisible } from "../utils/branch-scope.util";
import { CreateLoanPlanInput, UpdateLoanPlanInput } from "../validators/loanPlan.validator";

const loanPlanSelect = {
  loan_plan_id: true,
  loan_installment: true,
  tenure: true,
  extra_pay: true,
  branch_id: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpLoanPlansSelect;

export type LoanPlanRecord = Prisma.ErpLoanPlansGetPayload<{ select: typeof loanPlanSelect }>;

interface ListLoanPlansParams {
  page: number;
  limit: number;
  search?: string;
}

interface ListLoanPlansResult {
  data: LoanPlanRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const findLoanPlanOrThrow = async (id: number): Promise<LoanPlanRecord> => {
  const record = await prisma.erpLoanPlans.findUnique({ where: { loan_plan_id: id }, select: loanPlanSelect });
  if (!record) {
    throw AppError.notFound(`Loan plan with id ${id} was not found`);
  }
  return record;
};

/** Same MAX(id)+1 approach as loanType.service.ts — see loanPlan.constants.ts. */
const nextLoanPlanId = async (): Promise<number> => {
  const top = await prisma.erpLoanPlans.findFirst({
    orderBy: { loan_plan_id: "desc" },
    select: { loan_plan_id: true },
  });
  return (top?.loan_plan_id ?? 0) + 1;
};

export const listLoanPlans = async (
  params: ListLoanPlansParams,
  branchIds?: number[] | null
): Promise<ListLoanPlansResult> => {
  const { page, limit, search } = params;

  const where: Prisma.ErpLoanPlansWhereInput = {
    ...(branchIds ? { AND: [{ OR: [{ branch_id: null }, { branch_id: { in: branchIds } }] }] } : {}),
    ...(search
      ? {
          OR: [
            { loan_installment: { contains: search, mode: "insensitive" } },
            { tenure: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpLoanPlans.count({ where }),
    prisma.erpLoanPlans.findMany({
      where,
      select: loanPlanSelect,
      orderBy: { loan_plan_id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

// ─── Lookup — all loan plans, unpaginated (for the Loan Request form) ───────
export const listLoanPlanLookup = async (): Promise<
  { id: number; loan_installment: string; tenure: string; extra_pay: string }[]
> => {
  const rows = await prisma.erpLoanPlans.findMany({
    select: { loan_plan_id: true, loan_installment: true, tenure: true, extra_pay: true },
    orderBy: { loan_plan_id: "asc" },
  });
  return rows.map((r) => ({
    id: r.loan_plan_id,
    loan_installment: r.loan_installment,
    tenure: r.tenure,
    extra_pay: r.extra_pay,
  }));
};

export const getLoanPlanById = async (id: number, branchIds?: number[] | null): Promise<LoanPlanRecord> => {
  const record = await findLoanPlanOrThrow(id);
  if (branchIds !== undefined && !isBranchVisible(branchIds ?? null, record.branch_id)) {
    throw AppError.notFound(`Loan plan with id ${id} was not found`);
  }
  return record;
};

export const createLoanPlan = async (input: CreateLoanPlanInput): Promise<LoanPlanRecord> => {
  const loan_plan_id = await nextLoanPlanId();
  const now = new Date();

  return prisma.erpLoanPlans.create({
    data: {
      loan_plan_id,
      loan_installment: input.loan_installment,
      tenure: input.tenure,
      extra_pay: input.extra_pay,
      created_at: now,
      updated_at: now,
    },
    select: loanPlanSelect,
  });
};

export const updateLoanPlan = async (id: number, input: UpdateLoanPlanInput): Promise<LoanPlanRecord> => {
  await findLoanPlanOrThrow(id);

  return prisma.erpLoanPlans.update({
    where: { loan_plan_id: id },
    data: {
      ...(input.loan_installment !== undefined ? { loan_installment: input.loan_installment } : {}),
      ...(input.tenure !== undefined ? { tenure: input.tenure } : {}),
      ...(input.extra_pay !== undefined ? { extra_pay: input.extra_pay } : {}),
      updated_at: new Date(),
    },
    select: loanPlanSelect,
  });
};

/** Hard delete — no deleted_at column on this table. */
export const deleteLoanPlan = async (id: number): Promise<void> => {
  await findLoanPlanOrThrow(id);
  await prisma.erpLoanPlans.delete({ where: { loan_plan_id: id } });
};
