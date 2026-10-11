import { prisma } from "../../../config/db";
import { postJournalEntry } from "../../accountsModule/services/posting.service";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { LOAN_REQUEST_STATUS } from "../constants/loanRequest.constants";
import {
  ChangeLoanRequestStatusInput,
  CreateLoanRequestInput,
  UpdateLoanRequestInput,
} from "../validators/loanRequest.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const loanRequestSelect = {
  id: true,
  staff_id: true,
  branch_id: true,
  attachment_file: true,
  effective_from: true,
  type: true,
  amount: true,
  installments: true,
  monthly_installment: true,
  reason: true,
  remarks: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.RequestLoanEmployeeSelect;

export type LoanRequestRecord = Prisma.RequestLoanEmployeeGetPayload<{
  select: typeof loanRequestSelect;
}>;

interface ListLoanRequestsParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  company_id?: number;
  status?: number;
}

interface ListLoanRequestsResult {
  data: LoanRequestRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertEmployeeExists = async (staff_id: number) => {
  const employee = await prisma.staff.findFirst({
    where: { id: staff_id, deleted_at: null },
    select: { id: true },
  });
  if (!employee) {
    throw AppError.badRequest("Employee does not exist", {
      staff_id: `No employee found with id ${staff_id}`,
    });
  }
};

const assertBranchExists = async (branch_id: number) => {
  const branch = await prisma.erpBranches.findFirst({
    where: { id: branch_id, deleted_at: null },
    select: { id: true },
  });
  if (!branch) {
    throw AppError.badRequest("Campus does not exist", {
      branch_id: `No campus found with id ${branch_id}`,
    });
  }
};

// Soft-delete-aware lookup — deleted rows should behave as if they don't
// exist, same pattern as every other findXOrThrow helper in this module.
const findLoanRequestOrThrow = async (id: number): Promise<LoanRequestRecord> => {
  const loanRequest = await prisma.requestLoanEmployee.findFirst({
    where: { id, deleted_at: null },
    select: loanRequestSelect,
  });

  if (!loanRequest) {
    throw AppError.notFound(`Loan request with id ${id} was not found`);
  }

  return loanRequest;
};

const calculateMonthlyInstallment = (amount: number, installments: number): number =>
  Math.round(amount / installments);

// ─── List loan requests ───────────────────────────────────────────────────────
export const listLoanRequests = async (
  params: ListLoanRequestsParams,
  scope?: RecordScope
): Promise<ListLoanRequestsResult> => {
  const { page, limit, search, staff_id, branch_id, company_id, status } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  // `search` matches loan type/reason/remarks directly, and the linked
  // employee's name/reg_no via a staff sub-lookup — request_loan_employee
  // has no name column of its own to search.
  const matchingStaffIds = search
    ? await prisma.staff
        .findMany({
          where: {
            deleted_at: null,
            OR: [
              { first_name: { contains: search, mode: "insensitive" } },
              { last_name: { contains: search, mode: "insensitive" } },
              { reg_no: { contains: search, mode: "insensitive" } },
            ],
          },
          select: { id: true },
        })
        .then((rows) => rows.map((r) => r.id))
    : [];

  const where: Prisma.RequestLoanEmployeeWhereInput = {
    deleted_at: null,
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id
      ? { staff_id }
      : {}),
    ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(search
      ? {
          OR: [
            { type: { contains: search, mode: "insensitive" } },
            { reason: { contains: search, mode: "insensitive" } },
            { remarks: { contains: search, mode: "insensitive" } },
            ...(matchingStaffIds.length > 0 ? [{ staff_id: { in: matchingStaffIds } }] : []),
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.requestLoanEmployee.count({ where }),
    prisma.requestLoanEmployee.findMany({
      where,
      select: loanRequestSelect,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ─── Get single loan request ──────────────────────────────────────────────────
export const getLoanRequestById = async (id: number, scope?: RecordScope): Promise<LoanRequestRecord> => {
  const record = await findLoanRequestOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Loan request with id ${id} was not found`);
  }
  return record;
};

// ─── Create loan request ──────────────────────────────────────────────────────
export const createLoanRequest = async (
  input: CreateLoanRequestInput,
  actorId?: number
): Promise<LoanRequestRecord> => {
  await assertEmployeeExists(input.staff_id);
  await assertBranchExists(input.branch_id);

  return prisma.requestLoanEmployee.create({
    data: {
      staff_id: input.staff_id,
      branch_id: input.branch_id,
      attachment_file: input.attachment_file,
      effective_from: new Date(input.effective_from),
      type: input.type,
      amount: input.amount,
      installments: input.installments,
      monthly_installment:
        input.monthly_installment ?? calculateMonthlyInstallment(input.amount, input.installments),
      reason: input.reason,
      remarks: input.remarks,
      status: input.status ?? LOAN_REQUEST_STATUS.PENDING,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: loanRequestSelect,
  });
};

// ─── Update loan request ──────────────────────────────────────────────────────
export const updateLoanRequest = async (
  id: number,
  input: UpdateLoanRequestInput,
  actorId?: number
): Promise<LoanRequestRecord> => {
  const existing = await findLoanRequestOrThrow(id);

  if (input.staff_id !== undefined) await assertEmployeeExists(input.staff_id);
  if (input.branch_id !== undefined) await assertBranchExists(input.branch_id);

  const nextAmount = input.amount ?? existing.amount;
  const nextInstallments = input.installments ?? existing.installments;
  const monthlyInstallmentChanged = input.amount !== undefined || input.installments !== undefined;

  return prisma.requestLoanEmployee.update({
    where: { id },
    data: {
      ...(input.staff_id !== undefined ? { staff_id: input.staff_id } : {}),
      ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
      ...(input.attachment_file !== undefined ? { attachment_file: input.attachment_file } : {}),
      ...(input.effective_from !== undefined
        ? { effective_from: new Date(input.effective_from) }
        : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.installments !== undefined ? { installments: input.installments } : {}),
      ...(input.monthly_installment !== undefined
        ? { monthly_installment: input.monthly_installment }
        : monthlyInstallmentChanged
          ? { monthly_installment: calculateMonthlyInstallment(nextAmount, nextInstallments) }
          : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: loanRequestSelect,
  });
};

/**
 * Dedicated status-change endpoint (Approve/Reject/back to Pending) — same
 * separation-of-concerns reasoning as leaveRequest.service.ts's
 * changeLeaveRequestStatus.
 */
export const changeLoanRequestStatus = async (
  id: number,
  input: ChangeLoanRequestStatusInput,
  actorId?: number
): Promise<LoanRequestRecord> => {
  await findLoanRequestOrThrow(id);

  const updated = await prisma.requestLoanEmployee.update({
    where: { id },
    data: {
      status: input.status,
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: loanRequestSelect,
  });

  // GL Posting Trigger on Loan Disbursement (status === 1 / Approved)
  if (input.status === 1) {
    try {
      const loanReceivableAccount = await prisma.accAccount.findFirst({ where: { code: "1050" } });
      const bankCashAccount = await prisma.accAccount.findFirst({ where: { code: "1010" } });

      if (!loanReceivableAccount || !bankCashAccount) {
        throw new Error(
          "ACCOUNT_MAPPING_MISSING: Employee Loan Receivable (code 1050) and/or Cash/Bank (code 1010) not found. " +
          "Seed chart of accounts before approving loan disbursements."
        );
      }

      if (updated.amount > 0) {
        await postJournalEntry({
          sourceModule: "HR_PAYROLL",
          sourceReferenceType: "LOAN_DISBURSEMENT",
          sourceReferenceId: updated.id,
          voucherType: "CPV",
          narration: `Staff Loan Disbursement (${updated.type || "Loan"}) - Staff ID #${updated.staff_id}`,
          lines: [
            { account_id: loanReceivableAccount.id, debit: updated.amount, credit: 0, description: `Employee Loan Receivable` },
            { account_id: bankCashAccount.id, debit: 0, credit: updated.amount, description: `Cash/Bank Disbursement` },
          ],
          autoPost: true,
        });
      }
    } catch (glErr) {
      console.error("GL Posting Trigger Failed (Loan Disbursement):", glErr);
    }
  }

  return updated;
};

/**
 * Soft-delete — sets deleted_at/deleted_by rather than removing the row.
 * No status restriction (unlike the table's original hard-delete behavior,
 * which only allowed deleting PENDING requests since it had no undo) —
 * soft-delete is reversible, so this now matches
 * leaveRequest.service.ts's deleteLeaveRequest exactly.
 */
export const deleteLoanRequest = async (id: number, deletedBy?: number): Promise<void> => {
  await findLoanRequestOrThrow(id);

  await prisma.requestLoanEmployee.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      updated_at: new Date(),
    },
  });
};

// ─── Lookup: employees (feeds the Loan Request form's Employee dropdown) ───
// Self-contained rather than reusing leaveRequest.service.ts's version, same
// small-helper-per-module convention the rest of this codebase follows.
export interface EmployeeLookupOption {
  id: number;
  name: string;
  reg_no: string | null;
}

export const listEmployeeLookup = async (): Promise<EmployeeLookupOption[]> => {
  const rows = await prisma.staff.findMany({
    where: { deleted_at: null, status: "Active" },
    select: { id: true, first_name: true, last_name: true, reg_no: true },
    orderBy: { first_name: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ") || `Employee #${row.id}`,
    reg_no: row.reg_no,
  }));
};