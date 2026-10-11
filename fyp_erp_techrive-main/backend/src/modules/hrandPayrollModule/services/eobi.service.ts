import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { EOBI_STATUS } from "../constants/eobi.constants";
import { CreateEobiEntryInput, UpdateEobiEntryInput } from "../validators/eobi.validator";

const eobiSelect = {
  id: true,
  staff_id: true,
  branch_id: true,
  company_id: true,
  eobi_amount: true,
  epf_amount: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.EobiEpfRegisterSelect;

export type EobiEntryRecord = Prisma.EobiEpfRegisterGetPayload<{ select: typeof eobiSelect }>;

interface ListEobiParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  company_id?: number;
  status?: string;
}

interface ListEobiResult {
  data: EobiEntryRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertStaffExists = async (staff_id: number) => {
  const staff = await prisma.staff.findFirst({ where: { id: staff_id, deleted_at: null }, select: { id: true } });
  if (!staff) {
    throw AppError.badRequest("Employee does not exist", {
      staff_id: `No active employee found with id ${staff_id}`,
    });
  }
};

const assertBranchExists = async (branch_id: number) => {
  const branch = await prisma.erpBranches.findFirst({
    where: { id: branch_id, deleted_at: null },
    select: { id: true },
  });
  if (!branch) {
    throw AppError.badRequest("Campus does not exist", { branch_id: `No campus found with id ${branch_id}` });
  }
};

const assertCompanyExists = async (company_id: number) => {
  const company = await prisma.erpCompanies.findFirst({
    where: { id: company_id, deleted_at: null, status: 1 },
    select: { id: true },
  });
  if (!company) {
    throw AppError.badRequest("School does not exist", { company_id: `No school found with id ${company_id}` });
  }
};

const findEobiEntryOrThrow = async (id: number): Promise<EobiEntryRecord> => {
  const record = await prisma.eobiEpfRegister.findUnique({ where: { id }, select: eobiSelect });
  if (!record) {
    throw AppError.notFound(`EOBI/EPF register entry with id ${id} was not found`);
  }
  return record;
};

export const listEobiEntries = async (
  params: ListEobiParams,
  scope?: RecordScope
): Promise<ListEobiResult> => {
  const { page, limit, search, staff_id, branch_id, company_id, status } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.EobiEpfRegisterWhereInput = {
    ...(scope && scope.restrictToEmployeeId !== null
      ? { staff_id: scope.restrictToEmployeeId }
      : staff_id
      ? { staff_id }
      : {}),
    ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(status ? { status } : {}),
  };

  // No text columns worth full-text searching here (eobi_amount/epf_amount
  // are handled as explicit filters above) — `search` is accepted for
  // interface consistency with the other 4 features but currently a no-op filter.
  void search;

  const [total, data] = await prisma.$transaction([
    prisma.eobiEpfRegister.count({ where }),
    prisma.eobiEpfRegister.findMany({
      where,
      select: eobiSelect,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

export const getEobiEntryById = async (id: number, scope?: RecordScope): Promise<EobiEntryRecord> => {
  const record = await findEobiEntryOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`EOBI/EPF entry with id ${id} was not found`);
  }
  return record;
};

export const createEobiEntry = async (input: CreateEobiEntryInput): Promise<EobiEntryRecord> => {
  await assertStaffExists(input.staff_id);
  if (input.branch_id !== undefined) await assertBranchExists(input.branch_id);
  if (input.company_id !== undefined) await assertCompanyExists(input.company_id);

  return prisma.eobiEpfRegister.create({
    data: {
      staff_id: input.staff_id,
      branch_id: input.branch_id,
      company_id: input.company_id,
      amount: (input.eobi_amount ?? 0) + (input.epf_amount ?? 0),
      eobi_amount: input.eobi_amount,
      epf_amount: input.epf_amount,
      status: input.status ?? EOBI_STATUS.PENDING,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: eobiSelect,
  });
};

export const updateEobiEntry = async (
  id: number,
  input: UpdateEobiEntryInput
): Promise<EobiEntryRecord> => {
  await findEobiEntryOrThrow(id);

  if (input.staff_id !== undefined) await assertStaffExists(input.staff_id);
  if (input.branch_id !== undefined) await assertBranchExists(input.branch_id);
  if (input.company_id !== undefined) await assertCompanyExists(input.company_id);

  return prisma.eobiEpfRegister.update({
    where: { id },
    data: {
      ...(input.staff_id !== undefined ? { staff_id: input.staff_id } : {}),
      ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
      ...(input.company_id !== undefined ? { company_id: input.company_id } : {}),
      ...(input.eobi_amount !== undefined ? { eobi_amount: input.eobi_amount } : {}),
      ...(input.epf_amount !== undefined ? { epf_amount: input.epf_amount } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_at: new Date(),
    },
    select: eobiSelect,
  });
};

/** Hard delete — no deleted_at column on this table. */
export const deleteEobiEntry = async (id: number): Promise<void> => {
  await findEobiEntryOrThrow(id);
  await prisma.eobiEpfRegister.delete({ where: { id } });
};