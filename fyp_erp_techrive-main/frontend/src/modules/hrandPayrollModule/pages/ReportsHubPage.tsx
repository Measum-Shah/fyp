import React from "react";
import { Link } from "react-router-dom";
import "./employee-module.css";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconBuilding = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="1" />
    <line x1="9" y1="7" x2="9" y2="7.01" />
    <line x1="15" y1="7" x2="15" y2="7.01" />
    <line x1="9" y1="12" x2="9" y2="12.01" />
    <line x1="15" y1="12" x2="15" y2="12.01" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </svg>
);

const IconArrows = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="17" y1="17" x2="21" y2="17" />
    <polyline points="17 13 21 17 17 21" />
    <line x1="7" y1="7" x2="3" y2="7" />
    <polyline points="7 3 3 7 7 11" />
  </svg>
);

const IconChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCalendarOff = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconWallet = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const IconIdCard = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <circle cx="8" cy="10" r="2" />
    <line x1="6" y1="16" x2="10" y2="16" />
    <line x1="14" y1="9" x2="19" y2="9" />
    <line x1="14" y1="13" x2="19" y2="13" />
  </svg>
);

const IconFileText = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

const IconUserPlus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="17" y1="11" x2="23" y2="11" />
  </svg>
);

const IconActivity = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconPrinter = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

interface ReportCardProps {
  icon: React.ReactNode;
  iconVariant: "blue" | "green" | "gold" | "purple";
  title: string;
  description: string;
  to?: string;
  comingSoon?: string;
  // No longer read — every card renders now that access to this module is
  // all-or-nothing (see HrSidebar.tsx's comment on the same change). Kept
  // on the type/props so every <ReportCard permission="..."> call site
  // below keeps compiling unmodified.
  permission?: string;
}

const ReportCard: React.FC<ReportCardProps> = ({
  icon,
  iconVariant,
  title,
  description,
  to,
  comingSoon,
}) => {
  const content = (
    <>
      <div className={`hr-report-card-icon stat-icon stat-icon-${iconVariant}`}>{icon}</div>
      <h3 className="hr-report-card-title">{title}</h3>
      <p className="hr-report-card-desc">{description}</p>
      {comingSoon && <span className="hr-report-card-badge">{comingSoon}</span>}
    </>
  );

  if (comingSoon || !to) {
    return <div className="hr-report-card hr-report-card-disabled">{content}</div>;
  }

  return (
    <Link to={to} className="hr-report-card">
      {content}
    </Link>
  );
};

interface ReportSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

// One section = one heading + description + its own card grid. Keeps each
// section's cards visually grouped instead of one long undifferentiated
// grid, per the "Reports > Employee Reports / Leave Reports / ..." nav
// structure the rest of the app doesn't have yet but is heading toward as
// Leave/Payroll reports get built.
const ReportSection: React.FC<ReportSectionProps> = ({ title, description, children }) => (
  <section className="hr-report-section">
    <div className="hr-report-section-header">
      <h2 className="hr-report-section-title">{title}</h2>
      <p className="hr-report-section-desc">{description}</p>
    </div>
    <div className="hr-report-grid">{children}</div>
  </section>
);

// ─── ReportsHubPage ───────────────────────────────────────────────────────────
// Landing page for Reports. Organized into sections (Employee / Leave /
// Payroll / Attendance) rather than one flat grid — Employee Reports is the
// only section with live cards right now; the rest are shown disabled with
// an honest reason, not hidden, so the roadmap is visible.
const ReportsHubPage: React.FC = () => {
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
              <span className="breadcrumb-item breadcrumb-current">Reports</span>
            </nav>
            <h1 className="hr-page-title">Reports</h1>
          </div>
        </div>

        <ReportSection
          title="Employee Reports"
          description="Directory, headcount and workforce breakdowns across the organization."
        >
          <ReportCard
            icon={<IconUsers />}
            iconVariant="blue"
            title="Employee Directory"
            description="Full employee list with department, campus and school / university, filterable, paginated and exportable."
            to="/hr/reports/employee-directory"
            permission="report.employee_directory"
          />
          <ReportCard
            icon={<IconBuilding />}
            iconVariant="green"
            title="Headcount by Department"
            description="Active and inactive employee counts, one row per department."
            to="/hr/reports/headcount-by-department"
            permission="report.headcount_by_department"
          />
          <ReportCard
            icon={<IconArrows />}
            iconVariant="blue"
            title="Headcount by Campus"
            description="Active and inactive employee counts, one row per campus, grouped by school / university."
            to="/hr/reports/headcount-by-branch"
            permission="report.headcount_by_branch"
          />
          <ReportCard
            icon={<IconChart />}
            iconVariant="purple"
            title="Employee Analytics"
            description="Staff type, gender, designation and tenure breakdowns across the whole workforce."
            to="/hr/reports/employee-analytics"
            permission="report.employee_analytics"
          />
          <ReportCard
            icon={<IconCalendarOff />}
            iconVariant="gold"
            title="New Joiners & Exits"
            description="Employees who joined or left within a chosen date range."
            to="/hr/reports/joiners-exits"
            permission="report.joiners_exits"
          />
          <ReportCard
            icon={<IconUserPlus />}
            iconVariant="green"
            title="New Joining Report"
            description="A focused, single-table view of new hires within a chosen date range."
            to="/hr/reports/new-joiners"
            permission="report.joiners_exits"
          />
          <ReportCard
            icon={<IconIdCard />}
            iconVariant="gold"
            title="CNIC Expiry Report"
            description="Employees whose CNIC is expiring soon, soonest first."
            to="/hr/reports/cnic-expiry"
            permission="report.cnic_expiry"
          />
          <ReportCard
            icon={<IconFileText />}
            iconVariant="purple"
            title="Contract & Probation Expiry"
            description="Employees whose contract or probation period is ending soon."
            to="/hr/reports/contract-probation-expiry"
            permission="report.contract_probation_expiry"
          />
          <ReportCard
            icon={<IconActivity />}
            iconVariant="blue"
            title="Staff Strength Report"
            description="Total headcount broken down by department, campus, staff type and job status."
            to="/hr/reports/staff-strength"
            permission="report.staff_strength"
          />
        </ReportSection>

        <ReportSection
          title="Leave Reports"
          description="Leave requests, approvals and entitlement balances — built on Leave Management's live data."
        >
          <ReportCard
            icon={<IconCalendarOff />}
            iconVariant="green"
            title="Leave Requests"
            description="Every leave request, filterable by employee, type, status and date range."
            to="/hr/reports/leave-requests"
            permission="report.leave_requests"
          />
          <ReportCard
            icon={<IconClock />}
            iconVariant="green"
            title="Leave Balances"
            description="Entitled vs. used vs. remaining days, per employee per leave type."
            to="/hr/reports/leave-balances"
            permission="report.leave_balances"
          />
        </ReportSection>

        <ReportSection
          title="Payroll Reports"
          description="Payroll runs, salary breakdowns and loan positions — built on Payroll & Salary's live data."
        >
          <ReportCard
            icon={<IconWallet />}
            iconVariant="gold"
            title="Payroll Run Summary"
            description="Gross, deductions and net pay per campus per month, across payroll runs."
            to="/hr/reports/payroll-run-summary"
            permission="report.payroll_run_summary"
          />
          <ReportCard
            icon={<IconWallet />}
            iconVariant="gold"
            title="Salary Register"
            description="Per-employee salary breakdown — basic, allowances, EOBI, EPF."
            to="/hr/reports/salary-register"
            permission="report.salary_register"
          />
          <ReportCard
            icon={<IconWallet />}
            iconVariant="gold"
            title="Loan Register"
            description="Active and outstanding employee loans by plan and status."
            to="/hr/reports/loan-register"
            permission="report.loan_register"
          />
          <ReportCard
            icon={<IconWallet />}
            iconVariant="gold"
            title="Gross Salary Report"
            description="How much gross and net salary was paid this month, per employee."
            to="/hr/reports/gross-salary"
            permission="report.gross_salary"
          />
          <ReportCard
            icon={<IconPrinter />}
            iconVariant="blue"
            title="Bulk Salary Slip Print"
            description="Generate and print every employee's salary slip for a chosen month in one go."
            to="/hr/reports/salary-slips/print"
            permission="report.salary_slips"
          />
        </ReportSection>

        <ReportSection
          title="Attendance Reports"
          description="Daily attendance records and monthly summaries — built on Attendance's live data."
        >
          <ReportCard
            icon={<IconClock />}
            iconVariant="blue"
            title="Attendance Records"
            description="Every daily attendance record, filterable by employee, campus, status and date range."
            to="/hr/reports/attendance-records"
            permission="report.attendance_records"
          />
          <ReportCard
            icon={<IconClock />}
            iconVariant="blue"
            title="Attendance Summary"
            description="Monthly total absences, pay status and approval status per employee."
            to="/hr/reports/attendance-summary"
            permission="report.attendance_summary"
          />
        </ReportSection>
      </div>
    </div>
  );
};

export default ReportsHubPage;
