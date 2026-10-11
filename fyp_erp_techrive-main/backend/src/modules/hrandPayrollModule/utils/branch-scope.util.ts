import { AuthRequest } from "../../../middlewares/auth.middleware";

// ─── Role-level branch scoping ───────────────────────────────────────────────
// Previously answered "does this login's ROLE see only certain BRANCHES,
// regardless of whose records they are" — resolved from a custom role's
// rows in erp_rbac_role_branches (part of the removed Roles & Permissions
// system).
//
// Custom roles no longer exist, so there is nothing left to resolve a
// branch restriction from. Every login that reaches this module is an
// HR/Admin account (see middlewares/hrAccess.middleware.ts) and is meant
// to see every branch, same as an unrestricted role did before.
//
// Kept as a passthrough (same exported names/shapes) rather than deleted
// outright and stripped from every controller/service that calls it —
// every one of those call sites keeps working unmodified, always getting
// the "unrestricted" (null) answer instead of a per-role one.
export const resolveRoleBranchIds = async (_req: AuthRequest): Promise<number[] | null> => {
  return null;
};

// Unchanged — NULL on a record still means "global, every branch can
// see/use it", and branchIds is always null now, so this always resolves
// to visible. See file comment above.
export const isBranchVisible = (branchIds: number[] | null, recordBranchId: number | null): boolean => {
  if (branchIds === null) return true;
  if (recordBranchId === null) return true;
  return branchIds.includes(recordBranchId);
};
