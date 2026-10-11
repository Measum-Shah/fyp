import React from "react";
import { Link } from "react-router-dom";
import BirthdayWidget from "../components/BirthdayWidget";
import CnicExpiryWidget from "../components/CnicExpiryWidget";
import GrossSalaryWidget from "../components/GrossSalaryWidget";
import { useEmployees } from "../hooks/useEmployees";
import { useDepartments } from "../hooks/useDepartments";
import { useBranches } from "../hooks/useBranches";
import { useCompanies } from "../hooks/useCompanies";
import "./employee-module.css";
import "./hr-dashboard.css";
import { Can } from "../components/Can";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconBuilding = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconBriefcase = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
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

interface SummaryCardProps {
  to: string;
  icon: React.ReactNode;
  variant: "blue" | "green" | "gold" | "purple";
  label: string;
  value: number | null;
  loading: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ to, icon, variant, label, value, loading }) => (
  <Link to={to} className="hr-dashboard-stat-link">
    <div className="stat-card">
      <div className="stat-header">
        <div className={`stat-icon stat-icon-${variant}`}>{icon}</div>
      </div>
      {loading ? (
        <div className="hr-dashboard-stat-value-loading" />
      ) : (
        <div className="stat-value">{value ?? "—"}</div>
      )}
      <div className="stat-label">{label}</div>
    </div>
  </Link>
);

const HrDashboardPage: React.FC = () => {
  const { meta: employeeMeta, loading: employeesLoading } = useEmployees({ limit: 1 });
  const { meta: departmentMeta, loading: departmentsLoading } = useDepartments({ limit: 1 });
  const { meta: branchMeta, loading: branchesLoading } = useBranches({ limit: 1 });
  const { companies, loading: companiesLoading } = useCompanies();

  return (
    <div className="hr-page">
      <div className="hr-page-inner">
        {/* ── Breadcrumb / Header ──────────────────────────────────────── */}
        <div className="hr-page-header">
          <div>
            <nav className="breadcrumb">
              <Link to="/dashboard" className="breadcrumb-item">
                <IconHome /> Dashboard
              </Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">HR &amp; Payroll</span>
            </nav>
            <h1 className="hr-page-title">HR Dashboard</h1>
          </div>

          <Link to="/hr/employees/new" className="hr-btn hr-btn-primary">
            <IconUsers />
            Add Employee
          </Link>
        </div>

        {/* ── Upcoming Employee Birthdays ─────────────────────────────── */}
        <BirthdayWidget />

        {/* ── CNIC Expiry + Gross Salary widgets ──────────────────────── */}
        <div className="hr-dashboard-widget-grid">
          <Can permission="report.cnic_expiry">
            <CnicExpiryWidget />
          </Can>
          <Can permission="report.gross_salary">
            <GrossSalaryWidget />
          </Can>
        </div>

        {/* ── Summary cards ────────────────────────────────────────────── */}
        <div className="hr-dashboard-stats">
          <SummaryCard
            to="/hr/employees"
            icon={<IconUsers />}
            variant="blue"
            label="Total Employees"
            value={employeeMeta.total}
            loading={employeesLoading}
          />
          <SummaryCard
            to="/hr/departments"
            icon={<IconBuilding />}
            variant="green"
            label="Departments"
            value={departmentMeta.total}
            loading={departmentsLoading}
          />
          <SummaryCard
            to="/hr/branches"
            icon={<IconMapPin />}
            variant="gold"
            label="Campuses"
            value={branchMeta.total}
            loading={branchesLoading}
          />
          <SummaryCard
            to="/hr/companies"
            icon={<IconBriefcase />}
            variant="purple"
            label="School / University"
            value={companies.length}
            loading={companiesLoading}
          />
        </div>

        {/* ── Reserved space for future HR analytics/reports ──────────── */}
        <div className="hr-dashboard-future">
          <div className="hr-dashboard-future-icon">
            <IconChart />
          </div>
          <p className="hr-dashboard-future-title">More Reports &amp; Analytics</p>
          <Link to="/hr/reports" className="hr-btn hr-btn-secondary hr-btn-sm" style={{ marginTop: "1rem" }}>
            Go to Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HrDashboardPage;