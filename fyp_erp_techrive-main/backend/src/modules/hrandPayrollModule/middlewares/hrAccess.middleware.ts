import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";

// ─── requireHrAccess ──────────────────────────────────────────────────────
// Replaces the old Roles & Permissions system (requirePermission() +
// hr_roles/hr_permissions/erp_rbac_* tables). That system decided access
// per-route, per-permission-key, based on a custom role assigned to each
// login. It's gone now — the new model is simpler and matches the rest of
// the ERP's existing "portal" pattern (see App.tsx's ProtectedRoute
// adminOnly/parentOnly/teacherOnly on the frontend): the ENTIRE HR &
// Payroll module is an all-or-nothing area. Either a login is HR/Admin and
// can see and do everything in this module, or it isn't and never reaches
// these routes at all — a teacher, parent, or general staff login is
// routed to its own portal instead and never lands on /api/... under this
// module in the first place.
//
// Drop-in replacement for the old requirePermission("some.key") call —
// still accepts (and ignores) whatever permission-key arguments the route
// file passes in, purely so every existing route file only needed its
// import path and the middleware name updated, not its call signature.
// New route files don't need to pass anything: requireHrAccess() alone is
// enough.
//
// Must run AFTER authMiddleware (needs req.user already set).
const HR_ACCESS_USER_TYPES = ["admin", "hr"];

export const requireHrAccess = (..._ignoredPermissionKeys: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      // Shouldn't happen if authMiddleware ran first, but fail closed
      // rather than assume — a missing user on a "protected" route is a
      // bug, not a green light.
      return res.status(401).json({ message: "Unauthorized: No authenticated user" });
    }

    const userType = (req.user.user_type ?? "").toLowerCase();
    if (!HR_ACCESS_USER_TYPES.includes(userType)) {
      return res.status(403).json({
        message: "You do not have access to the HR & Payroll module. Only HR and Admin accounts can access this area.",
      });
    }

    next();
  };
};
