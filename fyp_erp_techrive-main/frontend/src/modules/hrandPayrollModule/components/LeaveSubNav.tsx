import React from "react";
import { Link, useLocation } from "react-router-dom";

// ─── LeaveSubNav ──────────────────────────────────────────────────────────────
// Second-level tab bar shown inside every Leave page, right below the page
// header. Consolidates what used to be 4 separate top-level nav links
// (Leave Requests / Leave Types / Leave Statuses / Leave Entitlements) into
// one "Leave" entry in HrSidebar's Attendance group, with these as sub-tabs
// — same idea as a top-level nav link, just one level deeper, so it uses
// its own smaller/pill styling (.hr-leave-subnav) rather than looking like
// another top-level section.
const LeaveSubNav: React.FC = () => {
  const location = useLocation();

  const isActive = (suffix: string) => location.pathname === `/hr/leave/${suffix}`;

  const tabs: { label: string; suffix: string }[] = [
    { label: "Requests", suffix: "requests" },
    { label: "Types", suffix: "types" },
    { label: "Statuses", suffix: "statuses" },
    { label: "Entitlements", suffix: "entitlements" },
  ];

  return (
    <nav className="hr-leave-subnav" aria-label="Leave sections">
      {tabs.map((tab) => (
        <Link
          key={tab.suffix}
          to={`/hr/leave/${tab.suffix}`}
          className={`hr-leave-subnav-link ${isActive(tab.suffix) ? "hr-leave-subnav-link-active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
};

export default LeaveSubNav;
