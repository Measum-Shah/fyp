import { prisma } from "../../../config/db";

// ─── Lookup Service ──────────────────────────────────────────────────────────
// Read-only lookups that feed dropdowns on the Employee Add/Edit form.
// Kept inside the Employee Management feature (not a separate module) since
// their only purpose is letting HR pick a valid value for an employee record.
//
// department_id / branch_id are real foreign-key style integer columns on
// `staff`, so those lookups return { id, name } and the FORM SUBMITS THE id.
//
// designation / staff_type are plain VARCHAR columns on `staff` (not FK ids —
// confirmed against the raw SQL schema), so those lookups return { id, name }
// only so the UI has a stable React key, but the FORM SUBMITS THE NAME
// (`name`, falling back to `staff_type_code` for staff types) as the string
// value — no change needed to the already-approved employee.validator.ts.

export interface LookupOption {
  id: number;
  name: string;
}

// Staff lookup rows also carry designation_id — the real FK described above
// (kept in sync with the free-text `designation` column by
// employee.service.ts#resolveDesignationId on every create/update) — so
// that the Resignation/Branch Transfer/Attendance Summary "Approver Name"
// dropdowns can auto-populate "Approver Designation" from the selected
// employee's own designation. This is a strict extension of LookupOption
// (all existing consumers that only destructure {id, name} — Bank
// Accounts, Salary Sheet, Loans, Increments, EOBI/EPF Register — are
// unaffected), not a breaking change.
export interface StaffLookupOption extends LookupOption {
  designation_id: number | null;
}

// ─── Staff lookup ────────────────────────────────────────────────────────────
// Shared across every Payroll & Salary feature (Bank Accounts, Salary Sheet,
// Loans, Increments, EOBI/EPF Register) — each of those tables references a
// staff_id with no DB-level relation (this schema has none anywhere), so all
// of them need the same "pick an employee" dropdown. Kept here rather than
// duplicated per-module, same reasoning as listBranches()/listDepartments().
// reg_no is folded into the display name (not returned separately) so callers
// can disambiguate staff with identical names without changing the shared
// LookupOption shape.
export const listStaff = async (): Promise<StaffLookupOption[]> => {
  const rows = await prisma.staff.findMany({
    where: { deleted_at: null },
    select: { id: true, reg_no: true, first_name: true, last_name: true, designation_id: true },
    orderBy: { first_name: "asc" },
  });

  return rows.map((row) => {
    const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ") || `Staff #${row.id}`;
    return {
      id: row.id,
      name: row.reg_no ? `${fullName} (${row.reg_no})` : fullName,
      designation_id: row.designation_id ?? null,
    };
  });
};

// Departments are scoped to a Campus (erp_branches) via the branch_departments
// join table — the same many-to-many relationship the Academic Module's own
// department picker already uses (see department.service.ts's getDepartments),
// not the Departments.branch_id column, which is a separate, mostly-unused
// "home branch" field. Passing branch_id narrows the list to only the
// departments actually offered at that campus; omitting it returns every
// department system-wide (unscoped), for any caller that doesn't have a
// School/Campus selection to scope by yet.
export const listDepartments = async (branch_id?: number): Promise<LookupOption[]> => {
  if (branch_id != null) {
    const links = await prisma.branchDepartments.findMany({
      where: { branch_id },
      select: { department_id: true },
    });
    const departmentIds = links.map((l) => l.department_id);
    if (departmentIds.length === 0) return [];
    return prisma.departments.findMany({
      where: { id: { in: departmentIds }, deleted_at: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  return prisma.departments.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};

// company_id is optional so existing callers that haven't been updated yet
// keep working (system-wide list), but every call site is expected to pass
// it going forward — see the Company→Branch scoping task for the full list.
// When provided, only branches belonging to that company are returned.
export const listBranches = async (company_id?: number): Promise<LookupOption[]> => {
  return prisma.erpBranches.findMany({
    where: {
      deleted_at: null,
      status: 1,
      ...(company_id != null ? { company_id } : {}),
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};

export const listDesignations = async (): Promise<LookupOption[]> => {
  return prisma.designation.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
};

export const listStaffTypes = async (): Promise<LookupOption[]> => {
  const rows = await prisma.staffType.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true, staff_type_code: true },
    orderBy: { sequence_id: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? row.staff_type_code,
  }));
};

// ─── Employee search (Attendance module) ────────────────────────────────────
// Feeds the Attendance form's employee picker. Unlike the lookups above,
// the employee list can be large, so this is a search-as-you-type endpoint
// (capped results) rather than a dump of every employee.
export interface EmployeeLookupOption extends LookupOption {
  reg_no: string | null;
  branch_id: number;
}

const EMPLOYEE_LOOKUP_RESULT_LIMIT = 20;

export const searchEmployees = async (query?: string): Promise<EmployeeLookupOption[]> => {
  const rows = await prisma.staff.findMany({
    where: {
      deleted_at: null,
      ...(query
        ? {
            OR: [
              { first_name: { contains: query, mode: "insensitive" } },
              { last_name: { contains: query, mode: "insensitive" } },
              { reg_no: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, first_name: true, last_name: true, reg_no: true, branch_id: true },
    orderBy: { first_name: "asc" },
    take: EMPLOYEE_LOOKUP_RESULT_LIMIT,
  });

  return rows.map((row) => ({
    id: row.id,
    name: [row.first_name, row.last_name].filter(Boolean).join(" ") || `Employee #${row.id}`,
    reg_no: row.reg_no,
    branch_id: row.branch_id,
  }));
};