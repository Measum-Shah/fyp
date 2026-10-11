import React from "react";
import { LOAN_REQUEST_STATUS, LOAN_REQUEST_STATUS_LABELS } from "../services/loanRequest.types";

interface LoanRequestStatusPillProps {
  status: number;
}

// ─── LoanRequestStatusPill ───────────────────────────────────────────────
// Unlike LeaveStatusPill.tsx (which keyword-matches an admin-managed
// lookup table), loan request status is a fixed 3-value enum, so this maps
// directly rather than guessing from a name string.
const LoanRequestStatusPill: React.FC<LoanRequestStatusPillProps> = ({ status }) => {
  let className = "status-neutral";
  if (status === LOAN_REQUEST_STATUS.APPROVED) className = "status-active";
  else if (status === LOAN_REQUEST_STATUS.REJECTED) className = "status-inactive";
  else if (status === LOAN_REQUEST_STATUS.PENDING) className = "status-pending";

  return (
    <span className={`profile-status ${className}`}>
      {LOAN_REQUEST_STATUS_LABELS[status] ?? "Unknown"}
    </span>
  );
};

export default LoanRequestStatusPill;
