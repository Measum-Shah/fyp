import React from "react";

interface StatusBadgeProps {
  status: string | null;
}

// Reuses the .profile-status / .status-active / .status-inactive classes
// already defined globally in index.css (see HomePage's profile card) so an
// employee's status pill looks identical to the rest of the app — no new
// CSS needed for this component.
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const isActive = status === "Active";

  return (
    <span
      className={`profile-status ${isActive ? "status-active" : "status-inactive"}`}
    >
      {status ?? "Unknown"}
    </span>
  );
};

export default StatusBadge;
