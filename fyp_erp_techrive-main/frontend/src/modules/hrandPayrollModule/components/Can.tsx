import React from "react";

interface CanProps {
  // No longer read — kept so every existing call site (<Can
  // permission="employee.delete">...</Can>, scattered across most HR
  // pages) keeps compiling without being touched individually.
  permission?: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// ─── Can ─────────────────────────────────────────────────────────────────────
// The Roles & Permissions system this used to check against has been
// removed. Access to the HR & Payroll module is now all-or-nothing: only
// admin/hr logins reach this module at all (see
// middlewares/hrAccess.middleware.ts on the backend and ProtectedRoute's
// adminOnly flag in App.tsx on the frontend). Anyone who got past that
// gate is meant to see and do everything inside it, so this always
// renders its children now.
//
// Kept as a passthrough component (same name, same props) instead of
// being deleted and stripped out of the ~48 pages/components that still
// wrap buttons and sections in <Can permission="...">...</Can> — every
// one of those call sites keeps working unmodified.
export const Can: React.FC<CanProps> = ({ children }) => {
  return <>{children}</>;
};
