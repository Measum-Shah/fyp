import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { BANK_ACCOUNT_STATUS } from "../constants/bankAccount.constants";
import {
  CreateBankAccountInput,
  UpdateBankAccountInput,
} from "../validators/bankAccount.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const bankAccountSelect = {
  id: true,
  staff_id: true,
  staff_reg_no: true,
  staff_bi_id: true,
  account_title: true,
  account_number: true,
  bank_branch: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.StaffBankAccountsSelect;

export type BankAccountRecord = Prisma.StaffBankAccountsGetPayload<{
  select: typeof bankAccountSelect;
}>;

interface ListBankAccountsParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
  status?: string;
}

interface ListBankAccountsResult {
  data: BankAccountRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertStaffExists = async (staff_id: number): Promise<{ reg_no: string | null }> => {
  const staff = await prisma.staff.findFirst({
    where: { id: staff_id, deleted_at: null },
    select: { reg_no: true },
  });

  if (!staff) {
    throw AppError.badRequest("Employee does not exist", {
      staff_id: `No active employee found with id ${staff_id}`,
    });
  }

  return staff;
};

const findBankAccountOrThrow = async (id: number): Promise<BankAccountRecord> => {
  const record = await prisma.staffBankAccounts.findUnique({
    where: { id },
    select: bankAccountSelect,
  });

  if (!record) {
    throw AppError.notFound(`Bank account with id ${id} was not found`);
  }

  return record;
};

/**
 * Business rule (not enforced by any DB constraint — staff_bank_accounts has
 * no unique index at all): an employee should only have one Active
 * disbursement account at a time, since erp_staff_salaries.bank_account is a
 * single free-text field, not a list. Whenever a record is saved as Active,
 * every other Active account for that staff_id is flipped to InActive.
 */
const deactivateOtherAccounts = async (staff_id: number, excludeId?: number) => {
  await prisma.staffBankAccounts.updateMany({
    where: {
      staff_id,
      status: BANK_ACCOUNT_STATUS.ACTIVE,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    data: { status: BANK_ACCOUNT_STATUS.INACTIVE, updated_at: new Date() },
  });
};

// ─── List bank accounts ───────────────────────────────────────────────────────
export const listBankAccounts = async (
  params: ListBankAccountsParams,
  scope?: RecordScope
): Promise<ListBankAccountsResult> => {
  const { page, limit, search, staff_id, status } = params;

  const where: Prisma.StaffBankAccountsWhereInput = {
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id
      ? { staff_id }
      : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { account_title: { contains: search, mode: "insensitive" } },
            { account_number: { contains: search, mode: "insensitive" } },
            { bank_branch: { contains: search, mode: "insensitive" } },
            { staff_reg_no: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.staffBankAccounts.count({ where }),
    prisma.staffBankAccounts.findMany({
      where,
      select: bankAccountSelect,
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

// ─── Get single bank account ─────────────────────────────────────────────────
export const getBankAccountById = async (id: number, scope?: RecordScope): Promise<BankAccountRecord> => {
  const record = await findBankAccountOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Bank account with id ${id} was not found`);
  }
  return record;
};

// ─── Create bank account ─────────────────────────────────────────────────────
export const createBankAccount = async (
  input: CreateBankAccountInput
): Promise<BankAccountRecord> => {
  const staff = await assertStaffExists(input.staff_id);
  const status = input.status ?? BANK_ACCOUNT_STATUS.INACTIVE;

  const created = await prisma.staffBankAccounts.create({
    data: {
      staff_id: input.staff_id,
      // Denormalized copy of staff.reg_no, matching this table's existing
      // design (it stores staff_reg_no directly rather than joining staff).
      staff_reg_no: staff.reg_no,
      staff_bi_id: input.staff_bi_id ?? null,
      account_title: input.account_title,
      account_number: input.account_number,
      bank_branch: input.bank_branch,
      status,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: bankAccountSelect,
  });

  if (status === BANK_ACCOUNT_STATUS.ACTIVE) {
    await deactivateOtherAccounts(input.staff_id, created.id);
  }

  return created;
};

// ─── Update bank account ─────────────────────────────────────────────────────
export const updateBankAccount = async (
  id: number,
  input: UpdateBankAccountInput
): Promise<BankAccountRecord> => {
  const existing = await findBankAccountOrThrow(id);

  let staffRegNo = existing.staff_reg_no;
  if (input.staff_id !== undefined && input.staff_id !== existing.staff_id) {
    const staff = await assertStaffExists(input.staff_id);
    staffRegNo = staff.reg_no;
  }

  const updated = await prisma.staffBankAccounts.update({
    where: { id },
    data: {
      ...(input.staff_id !== undefined ? { staff_id: input.staff_id, staff_reg_no: staffRegNo } : {}),
      ...(input.staff_bi_id !== undefined ? { staff_bi_id: input.staff_bi_id } : {}),
      ...(input.account_title !== undefined ? { account_title: input.account_title } : {}),
      ...(input.account_number !== undefined ? { account_number: input.account_number } : {}),
      ...(input.bank_branch !== undefined ? { bank_branch: input.bank_branch } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_at: new Date(),
    },
    select: bankAccountSelect,
  });

  if (input.status === BANK_ACCOUNT_STATUS.ACTIVE) {
    await deactivateOtherAccounts(updated.staff_id ?? existing.staff_id!, id);
  }

  return updated;
};

// ─── Delete bank account (hard delete — no deleted_at column exists) ───────
export const deleteBankAccount = async (id: number): Promise<void> => {
  await findBankAccountOrThrow(id);
  await prisma.staffBankAccounts.delete({ where: { id } });
};
