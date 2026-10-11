import bcrypt from "bcryptjs";
import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { CreateUserBody, UpdateUserBody } from "../validators/user.validator";

// ─── This module owns the LOGIN account (erp_users), not the HR employee
// record (staff/employees) — though a login can optionally be linked to
// one via employee_id (see assertEmployeeIsLinkable below).
//
// role_id used to be what the (now-removed) Roles & Permissions system
// resolved into a permission set on every authenticated request. That
// system is gone — access to the HR & Payroll module is now decided
// entirely by user_type (see middlewares/hrAccess.middleware.ts), so
// role_id is no longer read, written, validated, or surfaced anywhere in
// this module. The column itself is left alone on erp_users (out of
// scope here — no schema/migration changes were requested), it's just
// dead weight the app no longer touches.

// Never select password / string_password / api_token / remember_token —
// same convention as auth.controller.ts's safeUserSelect.
const userSelect = {
  id: true,
  name: true,
  email: true,
  branch_id: true,
  user_type: true,
  active: true,
  status: true,
  last_login_at: true,
  created_at: true,
  updated_at: true,
  employee_id: true,
} satisfies Prisma.ErpUsersSelect;

export type UserRecord = Prisma.ErpUsersGetPayload<{ select: typeof userSelect }>;

export interface UserWithLookups extends UserRecord {
  branch_name: string | null;
  employee_name: string | null;
}

interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
}

interface ListUsersResult {
  data: UserWithLookups[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── loadLookupMaps — same pattern as report.service.ts. This schema has no
// Prisma @relation fields anywhere (introspected flat), so every join is
// done manually like this rather than via `include`.
const loadLookupMaps = async () => {
  const branches = await prisma.erpBranches.findMany({ select: { id: true, name: true } });

  return {
    branchesById: new Map(branches.map((b) => [b.id, b])),
  };
};

const toUserWithLookups = (
  user: UserRecord,
  lookups: Awaited<ReturnType<typeof loadLookupMaps>>,
  employeeNamesById: Map<number, string>
): UserWithLookups => ({
  ...user,
  branch_name: user.branch_id != null ? lookups.branchesById.get(user.branch_id)?.name ?? null : null,
  employee_name: user.employee_id != null ? employeeNamesById.get(user.employee_id) ?? null : null,
});

// Employee names are loaded separately from loadLookupMaps() (branches are
// a small, full-table lookup; staff can be large, so this only fetches the
// specific ids actually present on the page of users being rendered).
const loadEmployeeNames = async (users: UserRecord[]): Promise<Map<number, string>> => {
  const employeeIds = [...new Set(users.map((u) => u.employee_id).filter((id): id is number => id != null))];
  if (employeeIds.length === 0) return new Map();

  const rows = await prisma.staff.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, first_name: true, last_name: true },
  });

  return new Map(rows.map((r) => [r.id, [r.first_name, r.last_name].filter(Boolean).join(" ")]));
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const assertEmailIsUnique = async (email: string, excludeId?: number) => {
  const existing = await prisma.erpUsers.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict("A user with this email already exists", {
      email: `Email '${email}' already exists`,
    });
  }
};

const findUserOrThrow = async (id: number): Promise<UserRecord> => {
  const user = await prisma.erpUsers.findFirst({ where: { id }, select: userSelect });
  if (!user) {
    throw AppError.notFound(`User with id ${id} was not found`);
  }
  return user;
};

/**
 * An actor can't lock themselves out — can't delete or deactivate their
 * own account via this screen.
 */
const assertNotSelf = (targetId: number, actorId?: number, action: "delete" | "deactivate" = "delete") => {
  if (actorId && targetId === actorId) {
    throw AppError.conflict(
      action === "delete" ? "You cannot delete your own account" : "You cannot deactivate your own account"
    );
  }
};

/**
 * The employee_id link (erp_users -> staff) is what identifies which HR
 * record this login belongs to. Enforcing one login per employee here
 * isn't strictly required (nothing downstream breaks if two logins share
 * an employee_id), but it's the sane default — an employee having two
 * different login accounts pointed at the same HR record is almost
 * certainly a mistake, not a deliberate setup.
 */
const assertEmployeeIsLinkable = async (employeeId: number, excludeUserId?: number) => {
  const employee = await prisma.staff.findFirst({
    where: { id: employeeId, deleted_at: null },
    select: { id: true },
  });
  if (!employee) {
    throw AppError.badRequest("The selected employee does not exist", { employee_id: "Invalid employee" });
  }

  const alreadyLinked = await prisma.erpUsers.findFirst({    select: { id: true, name: true },
  });
  if (alreadyLinked) {
    throw AppError.conflict(`This employee is already linked to another login (${alreadyLinked.name})`, {
      employee_id: "Already linked to another account",
    });
  }
};

// ─── List users ──────────────────────────────────────────────────────────────
export const listUsers = async (params: ListUsersParams): Promise<ListUsersResult> => {
  const { page, limit, search } = params;

  const where: Prisma.ErpUsersWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data, lookups] = await Promise.all([
    prisma.erpUsers.count({ where }),
    prisma.erpUsers.findMany({
      where,
      select: userSelect,
      orderBy: { id: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    loadLookupMaps(),
  ]);
  const employeeNamesById = await loadEmployeeNames(data);

  return {
    data: data.map((u) => toUserWithLookups(u, lookups, employeeNamesById)),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ─── Get single user ─────────────────────────────────────────────────────────
export const getUserById = async (id: number): Promise<UserWithLookups> => {
  const user = await findUserOrThrow(id);
  const [lookups, employeeNamesById] = await Promise.all([loadLookupMaps(), loadEmployeeNames([user])]);
  return toUserWithLookups(user, lookups, employeeNamesById);
};

// ─── Create user ─────────────────────────────────────────────────────────────
export const createUser = async (input: CreateUserBody): Promise<UserWithLookups> => {
  await assertEmailIsUnique(input.email);
  if (input.employee_id) {
    await assertEmployeeIsLinkable(input.employee_id);
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.erpUsers.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        // string_password is a pre-existing plaintext fallback column that
        // auth.controller.ts's login() already reads from — kept in sync
        // here rather than left null, so a newly-created account can
        // actually log in under the same legacy-fallback logic every other
        // account in this schema relies on. Not a new decision introduced
        // by this module.
        string_password: input.password,
        branch_id: input.branch_id ?? null,
        employee_id: input.employee_id ?? null,
        user_type: input.user_type,
        active: input.active,
        status: 1,
        board_id_one: 0,
        board_id_two: 0,
        program_id_one: 0,
        program_id_two: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: userSelect,
    });

    // Keep staff.user_id in sync with erp_users.employee_id — these are
    // two independent columns pointing at each other (erp_users →
    // employee via employee_id, staff → login via user_id) that nothing
    // else reconciles. Without this, linking a login to an employee here
    // would leave that employee's own record still saying "no linked
    // account" (staff.user_id stays 0), which is exactly what broke the
    // Teacher Portal's staff.findFirst({ where: { user_id } }) lookup
    // before this fix — see employee.service.ts's createEmployee/
    // updateEmployee for the other half of this (staff.user_id defaults
    // to 0, meaning "not linked to a login yet", and is never editable by
    // hand — this is now the only place that ever sets it to something
    // else).
    if (input.employee_id) {
      await tx.staff.update({ where: { id: input.employee_id }, data: { user_id: created.id } });
    }

    return created;
  });

  const [lookups, employeeNamesById] = await Promise.all([loadLookupMaps(), loadEmployeeNames([user])]);
  return toUserWithLookups(user, lookups, employeeNamesById);
};

// ─── Update user ─────────────────────────────────────────────────────────────
export const updateUser = async (
  id: number,
  input: UpdateUserBody,
  actorId?: number
): Promise<UserWithLookups> => {
  const existing = await findUserOrThrow(id);

  if (input.email !== undefined) {
    await assertEmailIsUnique(input.email, id);
  }
  if (input.employee_id !== undefined && input.employee_id !== null) {
    await assertEmployeeIsLinkable(input.employee_id, id);
  }
  // Deactivating via this same endpoint (active: 0) is guarded exactly like
  // delete — can't disable your own account.
  if (input.active === 0) {
    assertNotSelf(id, actorId, "deactivate");
  }

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.erpUsers.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
        ...(input.employee_id !== undefined ? { employee_id: input.employee_id } : {}),
        ...(input.user_type !== undefined ? { user_type: input.user_type } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        updated_at: new Date(),
      },
      select: userSelect,
    });

    // Same staff.user_id sync as createUser, but here the link can also
    // move to a different employee or be cleared entirely — both sides
    // need updating: the OLD linked employee (if any, and if it actually
    // changed) goes back to "unlinked" (0), and the NEW one (if any)
    // picks up this user's id.
    if (input.employee_id !== undefined && input.employee_id !== existing.employee_id) {
      if (existing.employee_id) {
        await tx.staff.update({ where: { id: existing.employee_id }, data: { user_id: 0 } });
      }
      if (input.employee_id) {
        await tx.staff.update({ where: { id: input.employee_id }, data: { user_id: id } });
      }
    }

    return updated;
  });

  const [lookups, employeeNamesById] = await Promise.all([loadLookupMaps(), loadEmployeeNames([user])]);
  return toUserWithLookups(user, lookups, employeeNamesById);
};

// ─── Reset password ──────────────────────────────────────────────────────────
export const resetPassword = async (id: number, newPassword: string): Promise<void> => {
  await findUserOrThrow(id);
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.erpUsers.update({
    where: { id },
    data: {
      password: hashedPassword,
      string_password: newPassword, // see createUser()'s comment on this column
      updated_at: new Date(),
    },
  });
};

// ─── Delete user (hard delete — erp_users has no deleted_at column) ─────────
export const deleteUser = async (id: number, actorId?: number): Promise<void> => {
  const existing = await findUserOrThrow(id);
  assertNotSelf(id, actorId, "delete");

  await prisma.$transaction(async (tx) => {
    await tx.erpUsers.delete({ where: { id } });
    // Deleting the login shouldn't leave the employee record pointing at
    // an id that no longer exists — unlink it the same way updateUser
    // does when a link is cleared.
    if (existing.employee_id) {
      await tx.staff.update({ where: { id: existing.employee_id }, data: { user_id: 0 } });
    }
  });
};

// ─── Employees lookup — feeds the Users form's "Link to Employee"
// dropdown. Only active, not-already-linked employees are useful choices
// here (an employee already linked to a login would just trip
// assertEmployeeIsLinkable on submit) — filtered out server-side so the
// dropdown doesn't show dead-end options. The employee currently linked to
// the user being edited (if any) needs to stay selectable, hence
// `excludeUserId`/current-employee handling at the call site, not here.
export interface EmployeeLookupOption {
  id: number;
  name: string;
  reg_no: string | null;
}

export const listLinkableEmployees = async (): Promise<EmployeeLookupOption[]> => {
  const linkedIds = await prisma.erpUsers
    .findMany({ where: { employee_id: { not: null } }, select: { employee_id: true } })
    .then((rows) => rows.map((r) => r.employee_id).filter((id): id is number => id != null));

  const employees = await prisma.staff.findMany({
    where: { deleted_at: null, status: "Active", id: { notIn: linkedIds } },
    select: { id: true, first_name: true, last_name: true, reg_no: true },
    orderBy: { first_name: "asc" },
  });

  return employees.map((e) => ({
    id: e.id,
    name: [e.first_name, e.last_name].filter(Boolean).join(" "),
    reg_no: e.reg_no ?? null,
  }));
};
