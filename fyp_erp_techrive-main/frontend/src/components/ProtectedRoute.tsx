import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If true, this route is ONLY for admin/staff — parents are blocked */
  adminOnly?: boolean;
  /** If true, this route is ONLY for parents — admins are blocked */
  parentOnly?: boolean;
}

/**
 * Route guard that checks user_type before rendering.
 * - adminOnly: redirects parent users to /parent/dashboard
 * - parentOnly: redirects admin/staff users to /dashboard
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly, parentOnly }) => {
  const token     = localStorage.getItem("erp_token");
  const parentTok = localStorage.getItem("parent_token");
  const raw       = localStorage.getItem("erp_user") || localStorage.getItem("parent_user");

  // Not logged in at all
  if (!token && !parentTok) return <Navigate to="/" replace />;

  let userType = "admin";
  if (raw) {
    try { userType = JSON.parse(raw).user_type || "admin"; } catch { /* ignore */ }
  } else if (!token && parentTok) {
    userType = "parent";
  }

  // Parent trying to access admin-only route
  if (adminOnly && userType === "parent") {
    return <Navigate to="/parent/dashboard" replace />;
  }

  // Admin/staff trying to access parent-only route
  if (parentOnly && userType !== "parent") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;