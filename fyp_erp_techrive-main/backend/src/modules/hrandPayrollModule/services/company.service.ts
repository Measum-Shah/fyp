import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { COMPANY_STATUS } from "../constants/company.constants";
import { CreateCompanyInput, UpdateCompanyInput } from "../validators/company.validator";

// ─── Shared select — never leak internal audit columns ──────────────────────
const companySelect = {
  id: true,
  name: true,
  description: true,
  ntn: true,
  gst: true,
  gst_type: true,
  vat: true,
  phone: true,
  fax: true,
  address: true,
  logo: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.ErpCompaniesSelect;

export type CompanyRecord = Prisma.ErpCompaniesGetPayload<{ select: typeof companySelect }>;

interface ListCompaniesParams {
  page: number;
  limit: number;
  search?: string;
  status?: number;
}

interface ListCompaniesResult {
  data: CompanyRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * erp_companies has no unique constraint on `name` at the DB level (confirmed
 * against the raw SQL schema), so uniqueness is enforced here at the
 * application layer, same pattern as branch.service.ts/department.service.ts.
 */
const assertNameIsUnique = async (name: string, excludeId?: number) => {
  const existing = await prisma.erpCompanies.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A school / university with this name already exists", {
      name: `School / University '${name}' already exists`,
    });
  }
};

const findActiveCompanyOrThrow = async (id: number): Promise<CompanyRecord> => {
  const company = await prisma.erpCompanies.findFirst({
    where: { id, deleted_at: null },
    select: companySelect,
  });

  if (!company) {
    throw AppError.notFound(`School / University with id ${id} was not found`);
  }

  return company;
};

/**
 * erp_companies has a real deleted_at column, so Delete here is a soft
 * delete, same as Branch (unlike Departments' hard delete). Guarded because
 * erp_branches.company_id is NOT NULL — a soft-deleted company would
 * otherwise silently vanish from the Branch form's company dropdown
 * (branch.service.ts's listCompanies lookup filters deleted_at: null) while
 * branches still reference it.
 */
const assertCompanyNotInUse = async (id: number) => {
  const branchCount = await prisma.erpBranches.count({
    where: { company_id: id, deleted_at: null },
  });

  if (branchCount > 0) {
    throw AppError.conflict(
      `Cannot delete this school / university — ${branchCount} campus(es) are still linked to it`,
      { id: "Reassign or remove affected branches before deleting this company" }
    );
  }
};

// ─── List companies ──────────────────────────────────────────────────────────
export const listCompanies = async (params: ListCompaniesParams): Promise<ListCompaniesResult> => {
  const { page, limit, search, status } = params;

  const where: Prisma.ErpCompaniesWhereInput = {
    deleted_at: null,
    ...(status !== undefined ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { ntn: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpCompanies.count({ where }),
    prisma.erpCompanies.findMany({
      where,
      select: companySelect,
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

// ─── Get single company ──────────────────────────────────────────────────────
export const getCompanyById = async (id: number): Promise<CompanyRecord> => {
  return findActiveCompanyOrThrow(id);
};

// ─── Create company ──────────────────────────────────────────────────────────
export const createCompany = async (
  input: CreateCompanyInput,
  actorId?: number
): Promise<CompanyRecord> => {
  await assertNameIsUnique(input.name);

  return prisma.erpCompanies.create({
    data: {
      name: input.name,
      description: input.description,
      ntn: input.ntn,
      gst: input.gst,
      gst_type: input.gst_type,
      vat: input.vat,
      phone: input.phone,
      fax: input.fax,
      address: input.address,
      logo: input.logo,
      status: input.status ?? COMPANY_STATUS.ACTIVE,
      created_by: actorId ?? null,
      updated_by: actorId ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: companySelect,
  });
};

// ─── Update company ───────────────────────────────────────────────────────────
export const updateCompany = async (
  id: number,
  input: UpdateCompanyInput,
  actorId?: number
): Promise<CompanyRecord> => {
  await findActiveCompanyOrThrow(id);

  if (input.name !== undefined) {
    await assertNameIsUnique(input.name, id);
  }

  return prisma.erpCompanies.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.ntn !== undefined ? { ntn: input.ntn } : {}),
      ...(input.gst !== undefined ? { gst: input.gst } : {}),
      ...(input.gst_type !== undefined ? { gst_type: input.gst_type } : {}),
      ...(input.vat !== undefined ? { vat: input.vat } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.fax !== undefined ? { fax: input.fax } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.logo !== undefined ? { logo: input.logo } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_by: actorId ?? null,
      updated_at: new Date(),
    },
    select: companySelect,
  });
};

// ─── Delete company (soft delete, guarded) ───────────────────────────────────
export const deleteCompany = async (id: number, deletedBy?: number): Promise<void> => {
  await findActiveCompanyOrThrow(id);
  await assertCompanyNotInUse(id);

  await prisma.erpCompanies.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by: deletedBy ?? null,
      status: COMPANY_STATUS.INACTIVE,
      updated_at: new Date(),
    },
  });
};