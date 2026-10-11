import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./hr-sidebar.css";

/* ═══════════════════════════════════════════════════════════════════════
   HrSidebar
   Single always-expanded sidebar for the HR & Payroll module — shows
   both the icon AND the label for every item (no icon-only rail).

   • Dashboard — direct link, no children.
   • Departments / Branches / Companies / Reports — single-page modules,
     rendered as direct links.
   • Employee Management / Attendance / Payroll — multi-page modules,
     rendered as expandable accordion groups (chevron rotates open).
   • A collapse toggle in the header shrinks the sidebar down to an
     icon-only rail (persisted in localStorage) for people who want the
     extra screen space — but by default, names + icons are both shown.
═══════════════════════════════════════════════════════════════════════ */

/* ── Icons (feather-style, matches the rest of the app) ─────────────────── */
const IconHome = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconBuilding = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <line x1="9" y1="6" x2="9" y2="6.01" />
    <line x1="15" y1="6" x2="15" y2="6.01" />
    <line x1="9" y1="10" x2="9" y2="10.01" />
    <line x1="15" y1="10" x2="15" y2="10.01" />
    <line x1="9" y1="14" x2="9" y2="14.01" />
    <line x1="15" y1="14" x2="15" y2="14.01" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
);
const IconMapPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconBriefcase = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconWallet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </svg>
);
const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const IconChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);

/* ── Nav structure ────────────────────────────────────────────────────────
   Modules with a single child (Departments, Branches, Companies, Reports)
   render as a plain link straight to that page. Modules with several
   children (Employee Management, Attendance, Payroll) render as an
   accordion group that expands beneath its own row.

   A module's children are usually plain links, but one nested level is
   supported too (currently just "Leave" inside Attendance) — a SubGroup
   has no `to` of its own, only a label and its own list of links, and
   renders as its own mini accordion one step further in.
──────────────────────────────────────────────────────────────────────────── */
type SubLink = { to: string; label: string; permission?: string | string[] };
type SubGroup = { label: string; children: readonly SubLink[] };
type ModuleChild = SubLink | SubGroup;

const isSubGroup = (child: ModuleChild): child is SubGroup => !("to" in child);

type ModuleKey =
  | "employee"
  | "attendance"
  | "departments"
  | "branches"
  | "companies"
  | "payroll"
  | "reports"
  | "security";

type Module = {
  key: ModuleKey;
  label: string;
  icon: React.FC;
  children: readonly ModuleChild[];
};

const MODULES: readonly Module[] = [
  {
    key: "employee",
    label: "Employees",
    icon: IconUsers,
    children: [
      { to: "/hr/employees", label: "Employees", permission: "employee.view"},
      { to: "/hr/staff-types", label: "Staff Types", permission: "staff_type.view"},
      { to: "/hr/designations", label: "Designations", permission: "designation.view"},
      { to: "/hr/resignations", label: "Resignations", permission: "resignation.view"},
      { to: "/hr/terminations", label: "Terminations", permission: "termination.view"},
      { to: "/hr/branch-transfers", label: "Campus Transfers", permission: "branch_transfer.view"},
      // Experience, Family Members, Emergency Contacts and Performance
      // Reviews are intentionally not linked here — they're per-employee
      // records, entered and reviewed from within each employee's own
      // profile (Add Employee wizard and the View/Edit Employee tabs),
      // not as a separate cross-employee list. See ExperiencesPanel,
      // FamilyPanel, EmergencyContactsPanel and PerformancePanel.
    ],
  },
  {
    key: "departments",
    label: "Departments",
    icon: IconBuilding,
    children: [{ to: "/hr/departments", label: "Departments", permission: "department.view"}],
  },
  {
    key: "branches",
    label: "Campuses",
    icon: IconMapPin,
    children: [{ to: "/hr/branches", label: "Campuses", permission: "branch.view"}],
  },
  {
    key: "companies",
    label: "School / University",
    icon: IconBriefcase,
    children: [{ to: "/hr/companies", label: "School / University", permission: "company.view"}],
  },
  {
    key: "attendance",
    label: "Attendance",
    icon: IconClock,
    children: [
      { to: "/hr/attendance", label: "Attendance", permission: "attendance.view"},
      { to: "/hr/attendance-statuses", label: "Attendance Statuses", permission: "attendance_status.view"},
      { to: "/hr/work-shifts", label: "Work Shifts", permission: "work_shift.view"},
      { to: "/hr/holidays", label: "Holidays", permission: "holiday.view"},
      {
        label: "Leave",
        children: [
          { to: "/hr/leave/requests", label: "Leave", permission: "leave_request.view"},
          { to: "/hr/leave/types", label: "Leave Types", permission: "leave_type.view"},
          { to: "/hr/leave/statuses", label: "Leave Statuses", permission: "leave_status.view"},
          { to: "/hr/leave/entitlements", label: "Leave Entitlements", permission: "leave_entitlement.view"},
        ],
      },
      {
        to: "/hr/biometric-devices",
        label: "Biometric Devices",
        permission: [
          "biometric_device.test_connection",
          "biometric_device.upload_staff",
          "biometric_device.sync_attendance",
          "biometric_device.clear_device",
        ],
      },
      { to: "/hr/attendance-summaries", label: "Attendance Summaries", permission: "attendance_summary.view"},
    ],
  },
  {
    key: "payroll",
    label: "Payroll",
    icon: IconWallet,
    children: [
      { to: "/hr/payroll-runs", label: "Payroll Runs", permission: "payroll_run.view"},
      { to: "/hr/bank-accounts", label: "Bank Accounts", permission: "bank_account.view"},
      { to: "/hr/salary-sheets", label: "Salary Sheets", permission: "salary.view"},
      { to: "/hr/fiscal-years", label: "Fiscal Years", permission: "fiscal_year.view"},
      { to: "/hr/allowance-types", label: "Allowance Types", permission: "allowance_type.view"},
      { to: "/hr/tax-slabs", label: "Tax Slabs", permission: "tax_slab.view"},
      { to: "/hr/deduction-formulas", label: "Deduction Formulas", permission: "payroll_deduction_formula.view"},
      { to: "/hr/loan-requests", label: "Loans", permission: "loan_request.view"},
      { to: "/hr/loan-types", label: "Loan Types", permission: "loan_type.view"},
      { to: "/hr/increments", label: "Increments", permission: "increment.view"},
      { to: "/hr/eobi-register", label: "EOBI / EPF Register", permission: "eobi.view"},
    ],
  },
  {
    key: "reports",
    label: "Reports",
    icon: IconChart,
    children: [
      { to: "/hr/reports", label: "All Reports", permission: "report.view"},
      {
        label: "Employee Reports",
        children: [
          { to: "/hr/reports/employee-directory", label: "Employee Directory", permission: "report.employee_directory"},
          { to: "/hr/reports/headcount-by-department", label: "Headcount by Department", permission: "report.headcount_by_department"},
          { to: "/hr/reports/headcount-by-branch", label: "Headcount by Campus", permission: "report.headcount_by_branch"},
          { to: "/hr/reports/employee-analytics", label: "Employee Analytics", permission: "report.employee_analytics"},
          { to: "/hr/reports/joiners-exits", label: "New Joiners & Exits", permission: "report.joiners_exits"},
          { to: "/hr/reports/new-joiners", label: "New Joining Report", permission: "report.joiners_exits"},
          { to: "/hr/reports/cnic-expiry", label: "CNIC Expiry", permission: "report.cnic_expiry"},
          { to: "/hr/reports/contract-probation-expiry", label: "Contract & Probation Expiry", permission: "report.contract_probation_expiry"},
          { to: "/hr/reports/staff-strength", label: "Staff Strength", permission: "report.staff_strength"},
        ],
      },
      {
        label: "Leave Reports",
        children: [
          { to: "/hr/reports/leave-requests", label: "Leave Requests", permission: "report.leave_requests"},
          { to: "/hr/reports/leave-balances", label: "Leave Balances", permission: "report.leave_balances"},
        ],
      },
      {
        label: "Payroll Reports",
        children: [
          { to: "/hr/reports/payroll-run-summary", label: "Payroll Run Summary", permission: "report.payroll_run_summary"},
          { to: "/hr/reports/salary-register", label: "Salary Register", permission: "report.salary_register"},
          { to: "/hr/reports/loan-register", label: "Loan Register", permission: "report.loan_register"},
          { to: "/hr/reports/gross-salary", label: "Gross Salary", permission: "report.gross_salary"},
          { to: "/hr/reports/salary-slips/print", label: "Bulk Salary Slip Print", permission: "report.salary_slips"},
        ],
      },
      {
        label: "Attendance Reports",
        children: [
          { to: "/hr/reports/attendance-records", label: "Attendance Records", permission: "report.attendance_records"},
          { to: "/hr/reports/attendance-summary", label: "Attendance Summary", permission: "report.attendance_summary"},
        ],
      },
    ],
  },
  {
    key: "security",
    label: "Sessions & Activity",
    icon: IconShield,
    children: [
      { to: "/hr/sessions", label: "Sessions", permission: "session.view"},
      { to: "/hr/activity-logs", label: "Activity Log", permission: "activity_log.view"},
      { to: "/hr/users", label: "Users", permission: "user.view"},
    ],
  },
];

const COLLAPSE_STORAGE_KEY = "hr_sidebar_collapsed";

const HrSidebar: React.FC = () => {
  const location = useLocation();
  // Boundary-aware prefix match: "/hr/reports" should match itself and
  // "/hr/reports/cnic-expiry", but NOT incidentally match unrelated routes
  // that merely start with the same characters (e.g. "/hr/attendance" vs.
  // "/hr/attendance-statuses").
  const isActive = (prefix: string) =>
    location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);

  // The Roles & Permissions system used to filter this list per-login here.
  // That's gone — every link is visible to anyone who reached this module,
  // since only admin/hr logins get past ProtectedRoute's adminOnly gate in
  // the first place (see App.tsx). MODULES is used directly instead of a
  // filtered copy.
  const visibleModules = MODULES;

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // True if this child (a plain link, or a nested group like Leave) owns
  // the current route — nested groups check their own children instead of
  // a `to` they don't have.
  const childMatchesRoute = (child: ModuleChild): boolean =>
    isSubGroup(child) ? child.children.some((c) => isActive(c.to)) : isActive(child.to);

  // Which module (if any) owns the current route — used to auto-open the
  // matching accordion group so it always reflects the page on screen.
  const matchingModule = useMemo<ModuleKey | null>(() => {
    const found = visibleModules.find((m) => m.children.some(childMatchesRoute));
    return found ? found.key : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, visibleModules]);

  // Same idea, one level in — which nested SubGroup (e.g. "attendance:Leave")
  // owns the current route, so it auto-opens alongside its parent module.
  const matchingSubGroup = useMemo<string | null>(() => {
    for (const m of visibleModules) {
      for (const c of m.children) {
        if (isSubGroup(c) && c.children.some((sc) => isActive(sc.to))) {
          return `${m.key}:${c.label}`;
        }
      }
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, visibleModules]);

  const [openGroup, setOpenGroup] = useState<ModuleKey | null>(matchingModule);
  const [openSubGroup, setOpenSubGroup] = useState<string | null>(matchingSubGroup);

  // Keep the open group in sync when navigation happens via a direct
  // link elsewhere (e.g. a dashboard shortcut).
  useEffect(() => {
    if (matchingModule) setOpenGroup(matchingModule);
  }, [matchingModule]);

  useEffect(() => {
    if (matchingSubGroup) setOpenSubGroup(matchingSubGroup);
  }, [matchingSubGroup]);

  const handleGroupClick = (key: ModuleKey) => {
    setOpenGroup((prev) => (prev === key ? null : key));
  };

  const handleSubGroupClick = (key: string) => {
    setOpenSubGroup((prev) => (prev === key ? null : key));
  };

  const isDashboard = location.pathname === "/hr/dashboard";

  return (
    <aside className={`hr-side ${collapsed ? "hr-side-collapsed" : ""}`} aria-label="HR & Payroll navigation">
      {/* ── Header: brand + collapse toggle ─────────────────────────────── */}
      <div className="hr-side-header">
        <Link to="/dashboard" className="hr-side-brand" title="TechRive ERP">
<div className="hr-side-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          {!collapsed && (
            <div className="hr-side-brand-text">
              <div className="hr-side-brand-name">TechRive ERP</div>
              <div className="hr-side-brand-sub">Management System</div>
            </div>
          )}
        </Link>
        <button
          type="button"
          className="hr-side-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <IconChevronLeft />
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav className="hr-side-nav">
        <Link
          to="/hr/dashboard"
          className={`hr-side-link ${isDashboard ? "hr-side-link-active" : ""}`}
          title={collapsed ? "Dashboard" : undefined}
        >
          <span className="hr-side-link-icon">
            <IconHome />
          </span>
          {!collapsed && <span className="hr-side-link-label">Dashboard</span>}
        </Link>

        {visibleModules.map((mod) => {
          const Icon = mod.icon;
          const hasSubmenu = mod.children.length > 1;
          const onCurrentRoute = mod.children.some(childMatchesRoute);

          if (!hasSubmenu) {
            // Single-child modules (Departments, Branches, Companies,
            // Reports) are always a plain link, never a nested SubGroup.
            const only = mod.children[0];
            if (isSubGroup(only)) return null;
            return (
              <Link
                key={mod.key}
                to={only.to}
                className={`hr-side-link ${onCurrentRoute ? "hr-side-link-active" : ""}`}
                title={collapsed ? mod.label : undefined}
              >
                <span className="hr-side-link-icon">
                  <Icon />
                </span>
                {!collapsed && <span className="hr-side-link-label">{mod.label}</span>}
              </Link>
            );
          }

          const isOpen = openGroup === mod.key;
          return (
            <div key={mod.key} className="hr-side-group">
              <button
                type="button"
                className={`hr-side-link hr-side-group-trigger ${onCurrentRoute ? "hr-side-link-active" : ""}`}
                onClick={() => (collapsed ? undefined : handleGroupClick(mod.key))}
                title={collapsed ? mod.label : undefined}
                aria-expanded={isOpen}
              >
                <span className="hr-side-link-icon">
                  <Icon />
                </span>
                {!collapsed && (
                  <>
                    <span className="hr-side-link-label">{mod.label}</span>
                    <span className={`hr-side-chevron ${isOpen ? "hr-side-chevron-open" : ""}`}>
                      <IconChevronDown />
                    </span>
                  </>
                )}
              </button>

              {!collapsed && isOpen && (
                <div className="hr-side-submenu">
                  {mod.children.map((child) => {
                    // Nested group (currently just "Leave" inside
                    // Attendance) — its own mini accordion, one step
                    // further in, holding Leave / Leave Types / Leave
                    // Statuses / Leave Entitlements.
                    if (isSubGroup(child)) {
                      const subKey = `${mod.key}:${child.label}`;
                      const subOpen = openSubGroup === subKey;
                      const subGroupActive = child.children.some((c) => isActive(c.to));
                      return (
                        <div key={subKey} className="hr-side-subgroup">
                          <button
                            type="button"
                            className={`hr-side-sublink hr-side-subgroup-trigger ${
                              subGroupActive ? "hr-side-sublink-active" : ""
                            }`}
                            onClick={() => handleSubGroupClick(subKey)}
                            aria-expanded={subOpen}
                          >
                            <span className="hr-side-sublink-label">{child.label}</span>
                            <span className={`hr-side-chevron hr-side-chevron-sm ${subOpen ? "hr-side-chevron-open" : ""}`}>
                              <IconChevronDown />
                            </span>
                          </button>

                          {subOpen && (
                            <div className="hr-side-subsubmenu">
                              {child.children.map((sub) => (
                                <Link
                                  key={sub.to}
                                  to={sub.to}
                                  className={`hr-side-subsublink ${isActive(sub.to) ? "hr-side-subsublink-active" : ""}`}
                                >
                                  {sub.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={child.to}
                        to={child.to}
                        className={`hr-side-sublink ${isActive(child.to) ? "hr-side-sublink-active" : ""}`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default HrSidebar;