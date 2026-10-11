import React from "react";
import { Link } from "react-router-dom";
import EmployeeProfileHeader, {
  type EmployeeProfileHeaderProps,
} from "../components/EmployeeProfileHeader";
import EmployeeSectionNav, { type EmployeeSectionNavTab } from "../components/EmployeeSectionNav";
import EmployeeSectionContainer from "../components/EmployeeSectionContainer";
import "../pages/employee-module.css";

const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

interface EmployeeDashboardLayoutProps {
  /** Breadcrumb trail label for the current page (e.g. "Add Employee" or the employee's name). */
  breadcrumbCurrent: string;
  /** Page <h1>. */
  title: string;
  /** Buttons rendered top-right of the page header (Edit / Delete / Save & Cancel, etc). */
  headerActions?: React.ReactNode;
  /** Profile card content — pass `placeholder` for the empty Add Employee state. */
  profile: EmployeeProfileHeaderProps;
  tabs: EmployeeSectionNavTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  /** The active section's content — automatically wrapped in the shared section card. */
  children: React.ReactNode;
}

// ─── Employee Dashboard Layout ───────────────────────────────────────────────
// The single, shared page shell used by Add Employee, View Employee and Edit
// Employee. Every screen renders, top to bottom: breadcrumb + title (+
// header actions) → Employee Profile Header → horizontally scrollable
// section nav → the active section's content. No screen builds its own
// version of this structure — only the data passed in (and which tab is
// active) differs between Add / View / Edit.
const EmployeeDashboardLayout: React.FC<EmployeeDashboardLayoutProps> = ({
  breadcrumbCurrent,
  title,
  headerActions,
  profile,
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  return (
    <div className="hr-page">
      <div className="hr-page-inner">
        <div className="hr-page-header">
          <div>
            <nav className="breadcrumb">
              <Link to="/dashboard" className="breadcrumb-item">
                <IconHome /> Dashboard
              </Link>
              <span className="breadcrumb-separator">›</span>
              <Link to="/hr/employees" className="breadcrumb-item">
                Employees
              </Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">{breadcrumbCurrent}</span>
            </nav>
            <h1 className="hr-page-title">{title}</h1>
          </div>

          {headerActions && <div className="hr-detail-actions">{headerActions}</div>}
        </div>

        <EmployeeProfileHeader {...profile} />

        <EmployeeSectionNav tabs={tabs} activeKey={activeTab} onChange={onTabChange} />

        <EmployeeSectionContainer>{children}</EmployeeSectionContainer>
      </div>
    </div>
  );
};

export default EmployeeDashboardLayout;