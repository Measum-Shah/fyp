import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { BRANCH_LEGACY_DEFAULTS, BRANCH_STATUS } from "../constants/branch.constants";
import { CreateBranchInput, UpdateBranchInput } from "../validators/branch.validator";

// ─── Shared select — never leak internal legacy columns ─────────────────────
// city_name is intentionally excluded — see branch.constants.ts for why
// (looks like a stale duplicate of city_id, not a distinct field).
const branchSelect = {
  id: true,
  company_id: true,
  name: true,
  branch_code: true,
  short_name: true,
  phone: true,
  fax: true,
  cell: true,
  email: true,
  website: true,
  address: true,
  city_id: true,
  country_id: true,
  bank_id: true,
  other_bank: true,
  voucher_id: true,
  logo: true,
  ip: true,
  port: true,
  cambridge_acc: true,
  optional_acc: true,
  one_bill_prefix: true,
  exam_center_no: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpBranchesSelect;

export type BranchRecord = Prisma.ErpBranchesGetPayload<{ select: typeof branchSelect }>;

export interface CompanyLookupOption {
  id: number;
  name: string;
}

interface ListBranchesParams {
  page: number;
  limit: number;
  search?: string;
  status?: number;
}

interface ListBranchesResult {
  data: BranchRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Companies lookup (feeds the Branch form's Company dropdown) ────────────
export const listCompanies = async (): Promise<CompanyLookupOption[]> => {
  return prisma.erpCompanies.findMany({
    where: { deleted_at: null, status: 1 },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertCompanyExists = async (company_id?: number | null) => {
  if (company_id == null) {
    throw AppError.badRequest("School / University id is required", { company_id: "company_id is required" });
  }

  const company = await prisma.erpCompanies.findUnique({ where: { id: company_id } });

  if (!company) {
    throw AppError.badRequest("School / University does not exist", {
      company_id: `No school / university found with id ${company_id}`,
    });
  }
};

/**
 * erp_branches has no unique constraint on `name` at the DB level, so
 * uniqueness is enforced here at the application layer, same pattern as
 * employee.service.ts and department.service.ts.
 */
const assertNameIsUnique = async (name: string, excludeId?: number) => {
  const existing = await prisma.erpBranches.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A campus with this name already exists", {
      name: `Campus '${name}' already exists`,
    });
  }
};

const findActiveBranchOrThrow = async (id: number): Promise<BranchRecord> => {
  const branch = await prisma.erpBranches.findFirst({
    where: { id, deleted_at: null },
    select: branchSelect,
  });

  if (!branch) {
    throw AppError.notFound(`Campus with id ${id} was not found`);
  }

  return branch;
};

/**
 * Unlike departments, erp_branches has a real deleted_at column, so Delete
 * here is a proper soft delete (matching staff's convention) rather than a
 * hard delete. The in-use guard still applies — a soft-deleted branch would
 * otherwise silently vanish from the Employee form's branch dropdown
 * (employee.service.ts's lookup filters deleted_at: null) while employees
 * still reference it.
 */
const assertBranchNotInUse = async (id: number) => {
  const employeeCount = await prisma.staff.count({
    where: { branch_id: id, deleted_at: null },
  });

  if (employeeCount > 0) {
    throw AppError.conflict(
      `Cannot delete this campus — ${employeeCount} employee(s) are still assigned to it`,
      { id: "Reassign or remove affected employees before deleting this branch" }
    );
  }
};

// ─── List branches ────────────────────────────────────────────────────────────
export const listBranches = async (params: ListBranchesParams): Promise<ListBranchesResult> => {
  const { page, limit, search, status } = params;

  const where: Prisma.ErpBranchesWhereInput = {
    deleted_at: null,
    ...(status !== undefined ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { branch_code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpBranches.count({ where }),
    prisma.erpBranches.findMany({
      where,
      select: branchSelect,
      orderBy: { name: "asc" },
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

// ─── Get single branch ────────────────────────────────────────────────────────
export const getBranchById = async (id: number): Promise<BranchRecord> => {
  return findActiveBranchOrThrow(id);
};

// ─── Create branch ─────────────────────────────────────────────────────────────
export const createBranch = async (
  input: CreateBranchInput,
  actorId?: number
): Promise<BranchRecord> => {
  await assertCompanyExists(input.company_id);
  await assertNameIsUnique(input.name);

  return prisma.erpBranches.create({
    data: {
      company_id: input.company_id!,
      name: input.name,
      phone: input.phone,
      cell: input.cell,
      email: input.email,
      address: input.address,
      website: input.website ?? "",
      status: input.status ?? BRANCH_STATUS.ACTIVE,

      branch_code: input.branch_code,
      short_name: input.short_name,
      fax: input.fax,
      city_id: input.city_id,
      country_id: input.country_id,
      bank_id: input.bank_id,
      other_bank: input.other_bank,
      voucher_id: input.voucher_id,
      logo: input.logo,
      ip: input.ip,
      port: input.port,
      cambridge_acc: input.cambridge_acc,
      optional_acc: input.optional_acc,
      one_bill_prefix: input.one_bill_prefix,
      exam_center_no: input.exam_center_no,

      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      created_at: new Date(),
      updated_at: new Date(),

      // Legacy, non-nullable columns unrelated to basic branch management —
      // see branch.constants.ts for why these are defaulted rather than
      // exposed.
      provisional_details: BRANCH_LEGACY_DEFAULTS.provisional_details,
      tel_no: BRANCH_LEGACY_DEFAULTS.tel_no,
      main_logo: BRANCH_LEGACY_DEFAULTS.main_logo,
      second_logo: BRANCH_LEGACY_DEFAULTS.second_logo,
    },
    select: branchSelect,
  });
};

// ─── Update branch ─────────────────────────────────────────────────────────────
export const updateBranch = async (
  id: number,
  input: UpdateBranchInput,
  actorId?: number
): Promise<BranchRecord> => {
  await findActiveBranchOrThrow(id);

  if (input.company_id != null) {
    await assertCompanyExists(input.company_id);
  }
  if (input.name !== undefined) {
    await assertNameIsUnique(input.name, id);
  }

  return prisma.erpBranches.update({
    where: { id },
    data: {
      ...(input.company_id != null ? { company_id: input.company_id } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.cell !== undefined ? { cell: input.cell } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),

      ...(input.branch_code !== undefined ? { branch_code: input.branch_code } : {}),
      ...(input.short_name !== undefined ? { short_name: input.short_name } : {}),
      ...(input.fax !== undefined ? { fax: input.fax } : {}),
      ...(input.city_id !== undefined ? { city_id: input.city_id } : {}),
      ...(input.country_id !== undefined ? { country_id: input.country_id } : {}),
      ...(input.bank_id !== undefined ? { bank_id: input.bank_id } : {}),
      ...(input.other_bank !== undefined ? { other_bank: input.other_bank } : {}),
      ...(input.voucher_id !== undefined ? { voucher_id: input.voucher_id } : {}),
      ...(input.logo !== undefined ? { logo: input.logo } : {}),
      ...(input.ip !== undefined ? { ip: input.ip } : {}),
      ...(input.port !== undefined ? { port: input.port } : {}),
      ...(input.cambridge_acc !== undefined ? { cambridge_acc: input.cambridge_acc } : {}),
      ...(input.optional_acc !== undefined ? { optional_acc: input.optional_acc } : {}),
      ...(input.one_bill_prefix !== undefined ? { one_bill_prefix: input.one_bill_prefix } : {}),
      ...(input.exam_center_no !== undefined ? { exam_center_no: input.exam_center_no } : {}),

      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: branchSelect,
  });
};

// ─── Delete branch (soft delete, guarded) ──────────────────────────────────────
export const deleteBranch = async (id: number, deletedBy?: number): Promise<void> => {
  await findActiveBranchOrThrow(id);
  await assertBranchNotInUse(id);

  await prisma.erpBranches.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      status: BRANCH_STATUS.INACTIVE,
      updated_at: new Date(),
    },
  });
};