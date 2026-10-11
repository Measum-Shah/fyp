import React from "react";
import type { UserRole } from "../../types";
import { useRoleAccess } from "../../hooks/useRoleAccess";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback = null }) => {
  const { role } = useRoleAccess();
  if (!allowedRoles.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
};
