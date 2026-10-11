import { AuthRequest } from "../../../middlewares/auth.middleware";

// ─── Record-level self-scoping ───────────────────────────────────────────────
// Previously answered "of the rows this endpoint would normally return,
// which ones is THIS specific login actually allowed to see" — e.g. a
// general employee holding only "<module>.view" (not "<module>.view_all")
// would see just their own leave/attendance/salary/loan rows via their
// linked employee_id.
//
// That was part of the Roles & Permissions system, which has been removed.
// The HR & Payroll module is no longer something every employee logs into
// at all — every route here is now gated by requireHrAccess() (see
// middlewares/hrAccess.middleware.ts) to HR/Admin logins only. A general
// employee (teacher, staff, etc.) is routed to their own profile/portal
// instead and never reaches these endpoints, so per-row self-scoping has
// nothing left to restrict: an HR/Admin login is meant to see every
// record.
//
// Kept as a passthrough (same exported names/shapes) rather than deleted
// outright and stripped from every controller/service that calls it —
// every one of those call sites keeps working unmodified, always getting
// the "unrestricted" answer instead of a per-permission one.
export interface RecordScope {
  // Always null now — unrestricted. See file comment above.
  restrictToEmployeeId: number | null;
}

export const resolveRecordScope = async (_req: AuthRequest, _moduleKey: string): Promise<RecordScope> => {
  return { restrictToEmployeeId: null };
};

// Always true now — unrestricted. Kept for the same passthrough reason as
// resolveRecordScope() above.
export const isWithinScope = (_scope: RecordScope, _ownerId: number | null | undefined): boolean => {
  return true;
};
