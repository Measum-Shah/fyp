import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { isBranchVisible } from "../utils/branch-scope.util";
import { assertBranchBelongsToCompany } from "../utils/company-branch.util";
import {
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "../validators/department.validator";

// ─── Shared select — internal audit columns kept out of the public response
const departmentSelect = {
  id: true,
  name: true,
  description: true,
  branch_id: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.DepartmentsSelect;

type DepartmentBase = Prisma.DepartmentsGetPayload<{
  select: typeof departmentSelect;
}>;

// The public shape adds company_id/university_name/campus_name — derived by
// joining branch_id -> erp_branches -> erp_companies (see hydrateDepartments
// below). None of these are columns on `departments` itself; erp_branches
// doesn't even carry a Prisma relation to erp_companies (just a scalar
// company_id), so this can't be expressed as a Prisma `select`/`include` and
// has to be resolved with a couple of follow-up queries, same pattern as
// AcademicModule's DepartmentService.getDepartments.
export interface DepartmentRecord extends DepartmentBase {
  company_id: number | null;
  university_name: string | null;
  campus_name: string | null;
}

interface ListDepartmentsParams {
  page: number;
  limit: number;
  search?: string;
}

interface ListDepartmentsResult {
  data: DepartmentRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolves School/Campus display info for a batch of departments in two
 * follow-up queries (not N+1 — batched by distinct branch/company ids).
 */
const hydrateDepartments = async (rows: DepartmentBase[]): Promise<DepartmentRecord[]> => {
  const branchIds = [...new Set(rows.map((r) => r.branch_id).filter((id): id is number => id != null))];

  const branches = branchIds.length
    ? await prisma.erpBranches.findMany({
        where: { id: { in: branchIds } },
        select: { id: true, name: true, company_id: true },
      })
    : [];

  const companyIds = [...new Set(branches.map((b) => b.company_id))];

  const companies = companyIds.length
    ? await prisma.erpCompanies.findMany({
        where: { id: { in: companyIds } },
        select: { id: true, name: true },
      })
    : [];

  return rows.map((row) => {
    const branch = row.branch_id != null ? branches.find((b) => b.id === row.branch_id) : undefined;
    const company = branch ? companies.find((c) => c.id === branch.company_id) : undefined;

    return {
      ...row,
      company_id: company?.id ?? null,
      university_name: company?.name ?? null,
      campus_name: branch?.name ?? null,
    };
  });
};

/** Single-row convenience wrapper around hydrateDepartments — avoids the
 * `noUncheckedIndexedAccess` `T | undefined` footgun at every call site
 * below, since hydrateDepartments always returns exactly one row when
 * given exactly one row in. */
const hydrateDepartment = async (row: DepartmentBase): Promise<DepartmentRecord> => {
  const [hydrated] = await hydrateDepartments([row]);
  return hydrated as DepartmentRecord;
};

/**
 * departments.name has no unique constraint at the DB level (confirmed
 * against the raw SQL), so uniqueness is enforced here at the application
 * layer, same pattern as employee.service.ts's reg_no/email/cnic checks.
 *
 * Scoped to branch_id — NOT global. Two different Campuses (e.g. two
 * different Schools' "Biology" department) are allowed to each have their
 * own department named "Biology"; only a duplicate *within the same
 * Campus* is rejected. This mirrors erp_branches' own name-uniqueness,
 * which is scoped in the same way but one level up (per-School, not
 * system-wide).
 */
const assertNameIsUnique = async (name: string, branchId: number | null, excludeId?: number) => {
  const existing = await prisma.departments.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      branch_id: branchId,
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A department with this name already exists for this campus", {
      name: `Department '${name}' already exists for this campus`,
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

const findActiveDepartmentOrThrow = async (id: number): Promise<DepartmentBase> => {
  const department = await prisma.departments.findFirst({
    where: { id, deleted_at: null },
    select: departmentSelect,
  });

  if (!department) {
    throw AppError.notFound(`Department with id ${id} was not found`);
  }

  return department;
};

/**
 * departments DOES have deleted_at/deleted_by columns (confirmed against the
 * live, freshly re-pulled schema.prisma — these were added via the soft-
 * delete migration you ran earlier in this project). Delete here is
 * therefore a soft delete, consistent with the project's Soft Delete
 * Policy — NOT a hard delete. The in-use guard still applies — a
 * soft-deleted department would otherwise silently vanish from the Employee
 * form's department dropdown while employees still reference it.
 */
const assertDepartmentNotInUse = async (id: number) => {
  const employeeCount = await prisma.staff.count({
    where: { department_id: id, deleted_at: null },
  });

  if (employeeCount > 0) {
    throw AppError.conflict(
      `Cannot delete this department — ${employeeCount} employee(s) are still assigned to it`,
      { id: "Reassign or remove affected employees before deleting this department" }
    );
  }
};

/**
 * Keeps branch_departments (the join table the Employee form's Department
 * dropdown actually reads through — see lookup.service.ts#listDepartments)
 * in sync with departments.branch_id. Each department belongs to exactly
 * one Campus in this UI (a brand-new `departments` row is created per
 * Campus — see createDepartment — never shared/relinked across Campuses),
 * so this is always a single replace, not a real many-to-many merge.
 */
const syncBranchDepartmentLink = async (departmentId: number, branchId: number) => {
  await prisma.branchDepartments.deleteMany({ where: { department_id: departmentId } });
  await prisma.branchDepartments.create({
    data: { branch_id: branchId, department_id: departmentId },
  });
};

// ─── List departments ────────────────────────────────────────────────────────
export const listDepartments = async (
  params: ListDepartmentsParams,
  branchIds?: number[] | null
): Promise<ListDepartmentsResult> => {
  const { page, limit, search } = params;

  const where: Prisma.DepartmentsWhereInput = {
    deleted_at: null,
    ...(branchIds ? { AND: [{ OR: [{ branch_id: null }, { branch_id: { in: branchIds } }] }] } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.departments.count({ where }),
    prisma.departments.findMany({
      where,
      select: departmentSelect,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: await hydrateDepartments(data),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

// ─── Get single department ───────────────────────────────────────────────────
export const getDepartmentById = async (id: number, branchIds?: number[] | null): Promise<DepartmentRecord> => {
  const record = await findActiveDepartmentOrThrow(id);
  if (branchIds !== undefined && !isBranchVisible(branchIds ?? null, record.branch_id)) {
    throw AppError.notFound(`Department with id ${id} was not found`);
  }
  return hydrateDepartment(record);
};

// ─── Create department ────────────────────────────────────────────────────────
export const createDepartment = async (
  input: CreateDepartmentInput
): Promise<DepartmentRecord> => {
  await assertBranchBelongsToCompany(input.branch_id, input.company_id);
  await assertNameIsUnique(input.name, input.branch_id);

  const department = await prisma.departments.create({
    data: {
      name: input.name,
      description: input.description,
      branch_id: input.branch_id,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: departmentSelect,
  });

  // Links this department into the branch_departments join table so it
  // immediately shows up in the Employee form's (and every report filter's)
  // Department dropdown for this Campus — see lookup.service.ts.
  await prisma.branchDepartments.create({
    data: { branch_id: input.branch_id, department_id: department.id },
  });

  return hydrateDepartment(department);
};

// ─── Update department ────────────────────────────────────────────────────────
export const updateDepartment = async (
  id: number,
  input: UpdateDepartmentInput
): Promise<DepartmentRecord> => {
  const current = await findActiveDepartmentOrThrow(id);

  const nextBranchId = input.branch_id !== undefined ? input.branch_id : current.branch_id;

  if (input.branch_id !== undefined) {
    if (input.company_id !== undefined) {
      await assertBranchBelongsToCompany(input.branch_id, input.company_id);
    } else {
      await assertBranchExists(input.branch_id);
    }
  }

  if (input.name !== undefined) {
    await assertNameIsUnique(input.name, nextBranchId, id);
  }

  const updated = await prisma.departments.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
      updated_at: new Date(),
    },
    select: departmentSelect,
  });

  if (input.branch_id !== undefined && input.branch_id !== current.branch_id) {
    await syncBranchDepartmentLink(id, input.branch_id);
  }

  return hydrateDepartment(updated);
};

// ─── Delete department (soft delete, guarded) ────────────────────────────────
export const deleteDepartment = async (id: number, deletedBy?: number): Promise<void> => {
  await findActiveDepartmentOrThrow(id);
  await assertDepartmentNotInUse(id);

  await prisma.$transaction([
    prisma.departments.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: deletedBy ?? null,
        updated_at: new Date(),
      },
    }),
    // Clean up the join row too — otherwise a stale branch_departments
    // link survives the soft delete (harmless today since every reader
    // filters departments by deleted_at: null too, but leaving a dangling
    // link around is asking for a bug down the line).
    prisma.branchDepartments.deleteMany({ where: { department_id: id } }),
  ]);
};
