import React from "react";

interface LeaveStatusPillProps {
  name: string | null;
}

// ─── LeaveStatusPill ──────────────────────────────────────────────────────────
// erp_hrm_leave_statuses is an admin-managed master table with no fixed set
// of values (see leaveStatus.constants.ts on the backend — the dump ships
// with zero seed rows), so this can't just branch on "Active"/"Inactive"
// like StatusBadge.tsx does for Employee. Instead it keyword-matches common
// HR terms and falls back to a neutral pill for anything else, so an
// admin-invented status name (e.g. "On Hold") still renders sensibly.
const LeaveStatusPill: React.FC<LeaveStatusPillProps> = ({ name }) => {
  const normalized = (name ?? "").toLowerCase();

  let className = "status-neutral";
  if (normalized.includes("approve")) className = "status-active";
  else if (normalized.includes("reject") || normalized.includes("cancel") || normalized.includes("decline"))
    className = "status-inactive";
  else if (normalized.includes("pend") || normalized.includes("wait") || normalized.includes("review"))
    className = "status-pending";

  return <span className={`profile-status ${className}`}>{name ?? "Unknown"}</span>;
};

export default LeaveStatusPill;
