import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FeeManagementPage from "./modules/feeManagementModule/pages/FeeManagementPage";

// ─── Accounts & Finance Module ───────────────────────────────────────────────
import { AccountsLayout } from "./modules/accountsModule/pages/AccountsLayout";
import { AccountsDashboardPage } from "./modules/accountsModule/pages/AccountsDashboardPage";
import { ChartOfAccountsPage } from "./modules/accountsModule/pages/ChartOfAccountsPage";
import { JournalEntriesPage } from "./modules/accountsModule/pages/JournalEntriesPage";
import { GeneralLedgerPage } from "./modules/accountsModule/pages/GeneralLedgerPage";
import { AccountsPayablePage } from "./modules/accountsModule/pages/AccountsPayablePage";
import { AccountsReceivablePage } from "./modules/accountsModule/pages/AccountsReceivablePage";
import { CashBankPage } from "./modules/accountsModule/pages/CashBankPage";
import { ExpensesPage } from "./modules/accountsModule/pages/ExpensesPage";
import { FixedAssetsPage } from "./modules/accountsModule/pages/FixedAssetsPage";
import { FinancialReportsPage } from "./modules/accountsModule/pages/FinancialReportsPage";
import { PeriodClosingPage } from "./modules/accountsModule/pages/PeriodClosingPage";
import { CreditDebitNotesPage } from "./modules/accountsModule/pages/CreditDebitNotesPage";
import { VoucherEntryPage } from "./modules/accountsModule/pages/VoucherEntryPage";
import { VoucherTemplatesPage } from "./modules/accountsModule/pages/VoucherTemplatesPage";
import { LedgerStatementPage } from "./modules/accountsModule/pages/LedgerStatementPage";
import { VendorLedgerPage } from "./modules/accountsModule/pages/VendorLedgerPage";


// ─── Academic Module ───────────────────────────────────────────────────────────
import AcademicLayout from "./modules/AcademicModule/pages/AcademicLayout";
import AcademicDashboardPage from "./modules/AcademicModule/pages/AcademicDashboardPage";
import StructureManagementPage from "./modules/AcademicModule/pages/StructureManagementPage";
import CourseCatalogPage from "./modules/AcademicModule/pages/CourseCatalogPage";
import CurriculumManagementPage from "./modules/AcademicModule/pages/CurriculumManagementPage";
import PrerequisiteManagementPage from "./modules/AcademicModule/pages/PrerequisiteManagementPage";
import LMSContentPage from "./modules/AcademicModule/pages/LMSContentPage";
import EnrollmentValidationPage from "./modules/AcademicModule/pages/EnrollmentValidationPage";
import AcademicReportsPage from "./modules/AcademicModule/pages/AcademicReportsPage";
import FineManagementPage from "./modules/AcademicModule/pages/FineManagementPage";
import ParentManagementPage from "./modules/AcademicModule/pages/ParentManagementPage";
import StudentEnrollmentPage from "./modules/AcademicModule/pages/StudentEnrollmentPage";
import TeacherEnrollmentPage from "./modules/AcademicModule/TeacherPortal/pages/TeacherEnrollmentPage";
import ActiveSessionManagementPage from "./modules/AcademicModule/pages/ActiveSessionManagementPage";
import TimetableManagementPage from "./modules/AcademicModule/pages/TimetableManagementPage";
import UserProfilePage from "./modules/AcademicModule/pages/UserProfilePage";
import AccountSettingsPage from "./modules/AcademicModule/pages/AccountSettingsPage";
import ActiveSessionInfoPage from "./modules/AcademicModule/pages/ActiveSessionInfoPage";
import AcademicCalendarPage from "./modules/AcademicModule/pages/AcademicCalendarPage";
import ResultGenerationPage from "./modules/AcademicModule/pages/ResultGenerationPage";
import GraduationPage from "./modules/AcademicModule/pages/GraduationPage";
import AlumniDirectoryPage from "./modules/AcademicModule/pages/AlumniDirectoryPage";
import RoomsManagementPage from "./modules/AcademicModule/pages/RoomsManagementPage";
import SemesterPromotionPage from "./modules/AcademicModule/pages/SemesterPromotionPage";

// ─── Parent Portal Module ─────────────────────────────────────────────────────
import ParentLayout       from "./modules/AcademicModule/ParentPortal/pages/ParentDashboardPage";
import StudentInfoPage    from "./modules/AcademicModule/ParentPortal/pages/StudentInfoPage";
import CoursesPage        from "./modules/AcademicModule/ParentPortal/pages/CoursesPage";
import ResultsPage        from "./modules/AcademicModule/ParentPortal/pages/ResultsPage";
import ProgressPage       from "./modules/AcademicModule/ParentPortal/pages/ProgressPage";
import TeachersPage       from "./modules/AcademicModule/ParentPortal/pages/TeachersPage";

// ─── Teacher Portal Module ──────────────────────────────────────────────────
import TeacherLayout from "./modules/AcademicModule/TeacherPortal/pages/TeacherLayout";
import TeacherDashboardPage from "./modules/AcademicModule/TeacherPortal/pages/TeacherDashboardPage";
import TeacherCoursesPage from "./modules/AcademicModule/TeacherPortal/pages/TeacherCoursesPage";
import TeacherAttendancePage from "./modules/AcademicModule/TeacherPortal/pages/AttendancePage";
import TeacherProfilePage from "./modules/AcademicModule/TeacherPortal/pages/TeacherProfilePage";
import ExamsPage from "./modules/AcademicModule/TeacherPortal/pages/ExamsPage";
import GradebookPage from "./modules/AcademicModule/TeacherPortal/pages/GradebookPage";
import TimetablePage from "./modules/AcademicModule/TeacherPortal/pages/TimetablePage";
import CommunicationPage from "./modules/AcademicModule/TeacherPortal/pages/CommunicationPage";

// ─── Student Portal Module ──────────────────────────────────────────────────
import StudentLayout from "./modules/AcademicModule/StudentPortal/layouts/StudentLayout";
import StudentDashboardPage from "./modules/AcademicModule/StudentPortal/pages/StudentDashboardPage";
import StudentProfilePage from "./modules/AcademicModule/StudentPortal/pages/StudentProfilePage";
import StudentCoursesPage from "./modules/AcademicModule/StudentPortal/pages/StudentCoursesPage";
import StudentAttendancePage from "./modules/AcademicModule/StudentPortal/pages/StudentAttendancePage";
import StudentLMSPage from "./modules/AcademicModule/StudentPortal/pages/StudentLMSPage";
import StudentResultsPage from "./modules/AcademicModule/StudentPortal/pages/StudentResultsPage";
import StudentFeesPage from "./modules/AcademicModule/StudentPortal/pages/StudentFeesPage";
import StudentFinesPage from "./modules/AcademicModule/StudentPortal/pages/StudentFinesPage";
import StudentEnrollmentPagePortal from "./modules/AcademicModule/StudentPortal/pages/StudentEnrollmentPage";
import StudentNotificationsPage from "./modules/AcademicModule/StudentPortal/pages/StudentNotificationsPage";

// ─── HR & Payroll Module ───────────────────────────────────────────────────────
import HrLayout from "./modules/hrandPayrollModule/layout/HrLayout";
import HrDashboardPage from "./modules/hrandPayrollModule/pages/HrDashboardPage";
import EmployeeListPage from "./modules/hrandPayrollModule/pages/EmployeeListPage";
import AddEmployeePage from "./modules/hrandPayrollModule/pages/AddEmployeePage";
import EmployeeProfilePage from "./modules/hrandPayrollModule/pages/EmployeeProfilePage";
import StaffTypesPage from "./modules/hrandPayrollModule/pages/StaffTypesPage";
import DepartmentsPage from "./modules/hrandPayrollModule/pages/DepartmentsPage";
import DesignationsPage from "./modules/hrandPayrollModule/pages/DesignationsPage";
import SessionsPage from "./modules/hrandPayrollModule/pages/SessionsPage";
import ActivityLogsPage from "./modules/hrandPayrollModule/pages/ActivityLogsPage";
import UsersPage from "./modules/hrandPayrollModule/pages/UsersPage";
import BranchesPage from "./modules/hrandPayrollModule/pages/BranchesPage";
import CompaniesPage from "./modules/hrandPayrollModule/pages/CompaniesPage";
import BankAccountsPage from "./modules/hrandPayrollModule/pages/BankAccountsPage";
import SalarySheetsPage from "./modules/hrandPayrollModule/pages/SalarySheetsPage";
import IncrementsPage from "./modules/hrandPayrollModule/pages/IncrementsPage";
import EobiRegisterPage from "./modules/hrandPayrollModule/pages/EobiRegisterPage";
import PayrollRunsPage from "./modules/hrandPayrollModule/pages/PayrollRunsPage";
import LoanTypesPage from "./modules/hrandPayrollModule/pages/LoanTypesPage";
import FiscalYearsPage from "./modules/hrandPayrollModule/pages/FiscalYearsPage";
import AllowanceTypesPage from "./modules/hrandPayrollModule/pages/AllowanceTypesPage";
import DeductionFormulasPage from "./modules/hrandPayrollModule/pages/DeductionFormulasPage";
import TaxSlabsPage from "./modules/hrandPayrollModule/pages/TaxSlabsPage";
import LoanRequestsPage from "./modules/hrandPayrollModule/pages/LoanRequestsPage";
import ReportsHubPage from "./modules/hrandPayrollModule/pages/ReportsHubPage";
import EmployeeDirectoryReportPage from "./modules/hrandPayrollModule/pages/EmployeeDirectoryReportPage";
import HeadcountByDepartmentReportPage from "./modules/hrandPayrollModule/pages/HeadcountByDepartmentReportPage";
import HeadcountByBranchReportPage from "./modules/hrandPayrollModule/pages/HeadcountByBranchReportPage";
import EmployeeAnalyticsReportPage from "./modules/hrandPayrollModule/pages/EmployeeAnalyticsReportPage";
import JoinersExitsReportPage from "./modules/hrandPayrollModule/pages/JoinersExitsReportPage";
import NewJoiningReportPage from "./modules/hrandPayrollModule/pages/NewJoiningReportPage";
import CnicExpiryReportPage from "./modules/hrandPayrollModule/pages/CnicExpiryReportPage";
import ContractProbationExpiryReportPage from "./modules/hrandPayrollModule/pages/ContractProbationExpiryReportPage";
import StaffStrengthReportPage from "./modules/hrandPayrollModule/pages/StaffStrengthReportPage";
import LeaveRequestsReportPage from "./modules/hrandPayrollModule/pages/LeaveRequestsReportPage";
import LeaveBalancesReportPage from "./modules/hrandPayrollModule/pages/LeaveBalancesReportPage";
import PayrollRunSummaryReportPage from "./modules/hrandPayrollModule/pages/PayrollRunSummaryReportPage";
import SalaryRegisterReportPage from "./modules/hrandPayrollModule/pages/SalaryRegisterReportPage";
import LoanRegisterReportPage from "./modules/hrandPayrollModule/pages/LoanRegisterReportPage";
import GrossSalaryReportPage from "./modules/hrandPayrollModule/pages/GrossSalaryReportPage";
import BulkSalarySlipPage from "./modules/hrandPayrollModule/pages/BulkSalarySlipPage";
import AttendanceRecordsReportPage from "./modules/hrandPayrollModule/pages/AttendanceRecordsReportPage";
import AttendanceSummaryReportPage from "./modules/hrandPayrollModule/pages/AttendanceSummaryReportPage";
import WorkShiftsPage from "./modules/hrandPayrollModule/pages/WorkShiftsPage";
import HolidaysPage from "./modules/hrandPayrollModule/pages/HolidaysPage";
import AttendancePage from "./modules/hrandPayrollModule/pages/AttendancePage";
import AttendanceStatusesPage from "./modules/hrandPayrollModule/pages/AttendanceStatusesPage";
import AttendanceSummariesPage from "./modules/hrandPayrollModule/pages/AttendanceSummariesPage";
import LeaveTypesPage from "./modules/hrandPayrollModule/pages/LeaveTypesPage";
import LeaveStatusesPage from "./modules/hrandPayrollModule/pages/LeaveStatusesPage";
import LeaveEntitlementsPage from "./modules/hrandPayrollModule/pages/LeaveEntitlementsPage";
import LeaveRequestsPage from "./modules/hrandPayrollModule/pages/LeaveRequestsPage";
import ResignationsPage from "./modules/hrandPayrollModule/pages/ResignationsPage";
import TerminationsPage from "./modules/hrandPayrollModule/pages/TerminationsPage";
import BranchTransfersPage from "./modules/hrandPayrollModule/pages/BranchTransfersPage";
// Experience, Family Members, Emergency Contacts and Performance Reviews
// no longer have standalone cross-employee pages — they're entered and
// reviewed from within each employee's own profile (Add Employee wizard,
// View/Edit Employee tabs) via ExperiencesPanel / FamilyPanel /
// EmergencyContactsPanel / PerformancePanel instead.
import BiometricDevicesPage from "./modules/hrandPayrollModule/pages/BiometricDevicesPage";

// ─── Auth guards ──────────────────────────────────────────────────────────────
// Simple auth guard — checks if JWT token exists
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean; parentOnly?: boolean; teacherOnly?: boolean; studentOnly?: boolean }> = ({ children, adminOnly, parentOnly, teacherOnly, studentOnly }) => {
  // Everyone uses erp_token — parents log in via the same main login page
  const token = localStorage.getItem("erp_token");
  if (!token) return <Navigate to="/" replace />;

  // Determine user type from stored user object
  let userType = "admin";
  const raw = localStorage.getItem("erp_user");
  if (raw) {
    try { userType = JSON.parse(raw).user_type || "admin"; } catch { /* ignore */ }
  }

  // Parent trying to access admin-only route → redirect to parent portal
  if (adminOnly && userType === "parent") return <Navigate to="/parent/dashboard" replace />;

  // Teachers use their own portal instead of the admin dashboard.
  if (adminOnly && (userType === "staff" || userType === "teacher")) return <Navigate to="/teacher/dashboard" replace />;

  // Students trying to access admin-only route → redirect to student portal
  if (adminOnly && userType === "student") return <Navigate to="/student/dashboard" replace />;

  // Admin/staff trying to access parent-only route → redirect to admin dashboard
  if (parentOnly && userType !== "parent") return <Navigate to="/dashboard" replace />;

  // Non-teachers should not enter the teacher portal.
  if (teacherOnly && userType !== "staff" && userType !== "teacher") return <Navigate to="/dashboard" replace />;

  // Non-students should not enter the student portal
  if (studentOnly && userType !== "student") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

// Redirect to dashboard if already logged in
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem("erp_token");
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("erp_theme") || "corporate-trust";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("erp_theme", theme);
    // Keep other theme controls in the app (e.g. "Theme Settings" in the
    // HR sidebar) in sync instantly, without a reload.
    window.dispatchEvent(new CustomEvent("erp-theme-change", { detail: theme }));
  }, [theme]);

  // Stay in sync if the theme is changed elsewhere (e.g. the HR sidebar's
  // Theme Settings picker), so this button never shows a stale icon.
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const next = (e as CustomEvent<string>).detail;
      if (next && next !== theme) setTheme(next);
    };
    window.addEventListener("erp-theme-change", handleThemeChange);
    return () => window.removeEventListener("erp-theme-change", handleThemeChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "corporate-trust" ? "midnight-blue" : "corporate-trust"));
  };

  return (
    <button
      className="theme-switcher-btn"
      onClick={toggleTheme}
      title={`Switch to ${theme === "corporate-trust" ? "Midnight Blue" : "Corporate Trust"}`}
      aria-label="Toggle theme"
    >
      {theme === "corporate-trust" ? (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      )}
    </button>
  );
};

// The Employee module used to have a standalone "/edit" route
// (EditEmployeePage). Editing now happens inline via the Employee Profile
// page's tabs, so any old bookmark/link to the edit URL is redirected
// straight to the profile page, opened on its "Basic Information" tab.
const EditEmployeeRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/hr/employees/${id}?tab=basic`} replace />;
};

// ─── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Shared Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Teacher Portal */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute teacherOnly>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboardPage />} />
            <Route path="profile" element={<TeacherProfilePage />} />
            <Route path="courses" element={<TeacherCoursesPage />} />
            <Route path="lms" element={<LMSContentPage />} />
            <Route path="attendance" element={<TeacherAttendancePage />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="gradebook" element={<GradebookPage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="academic-calendar" element={<AcademicCalendarPage />} />
            <Route path="communication" element={<CommunicationPage />} />
          </Route>

          {/* Student Portal */}
          <Route
            path="/student"
            element={
              <ProtectedRoute studentOnly>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
            <Route path="courses" element={<StudentCoursesPage />} />
            <Route path="attendance" element={<StudentAttendancePage />} />
            <Route path="lms" element={<StudentLMSPage />} />
            <Route path="results" element={<StudentResultsPage />} />
            <Route path="fees" element={<StudentFeesPage />} />
            <Route path="fines" element={<StudentFinesPage />} />
            <Route path="academic-calendar" element={<AcademicCalendarPage />} />
            <Route path="enrollment" element={<StudentEnrollmentPagePortal />} />
            <Route path="notifications" element={<StudentNotificationsPage />} />
          </Route>

          {/* Fee Management — authenticated users; page enforces role-specific UI */}
          <Route
            path="/fee-management"
            element={
              <ProtectedRoute>
                <FeeManagementPage />
              </ProtectedRoute>
            }
          />

          {/* ── Academic Module ──────────────────────────────────────────────── */}
          <Route
            path="/academic"
            element={
              <ProtectedRoute>
                <AcademicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AcademicDashboardPage />} />
            <Route path="structure" element={<StructureManagementPage />} />
            <Route path="courses" element={<CourseCatalogPage />} />
            <Route path="curriculum" element={<CurriculumManagementPage />} />
            <Route path="prerequisites" element={<PrerequisiteManagementPage />} />
            <Route path="lms" element={<LMSContentPage />} />
            <Route path="enrollment" element={<EnrollmentValidationPage />} />
            <Route path="reports" element={<AcademicReportsPage />} />
            <Route path="parents" element={<ParentManagementPage />} />
            <Route path="student-enrollment" element={<StudentEnrollmentPage />} />
            <Route path="fines" element={<ProtectedRoute adminOnly><FineManagementPage /></ProtectedRoute>} />
            <Route path="teacher-enrollment" element={<TeacherEnrollmentPage />} />
            <Route path="active-sessions" element={<ActiveSessionManagementPage />} />
            <Route path="active-session-info" element={<ActiveSessionInfoPage />} />
            <Route path="timetable" element={<ProtectedRoute adminOnly><TimetableManagementPage /></ProtectedRoute>} />
            <Route path="rooms" element={<ProtectedRoute adminOnly><RoomsManagementPage /></ProtectedRoute>} />
            <Route path="academic-calendar" element={<AcademicCalendarPage />} />
            <Route path="results" element={<ResultGenerationPage />} />
            <Route path="graduation" element={<GraduationPage />} />
            <Route path="alumni" element={<AlumniDirectoryPage />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
            <Route path="semester-promotion" element={<ProtectedRoute adminOnly><SemesterPromotionPage /></ProtectedRoute>} />
          </Route>

          {/* ── HR & Payroll Module ──────────────────────────────────────────── */}
          {/* Every /hr/* route is nested under HrLayout, which renders the
              persistent left sidebar once and an <Outlet /> for the active
              page. The sidebar therefore stays mounted and visible across
              every HR page navigation instead of disappearing/re-rendering. */}
          <Route
            element={
              <ProtectedRoute adminOnly>
                <HrLayout />
              </ProtectedRoute>
            }
          >
            {/* HR Dashboard */}
            <Route path="/hr" element={<Navigate to="/hr/dashboard" replace />} />
            <Route path="/hr/dashboard" element={<HrDashboardPage />} />

            {/* Employee Management */}
            <Route path="/hr/employees" element={<EmployeeListPage />} />
            <Route path="/hr/employees/new" element={<AddEmployeePage />} />
            <Route path="/hr/employees/:id" element={<EmployeeProfilePage />} />
            <Route path="/hr/employees/:id/edit" element={<EditEmployeeRedirect />} />
            <Route path="/hr/staff-types" element={<StaffTypesPage />} />
            <Route path="/hr/designations" element={<DesignationsPage />} />
            <Route path="/hr/departments" element={<DepartmentsPage />} />
            <Route path="/hr/branches" element={<BranchesPage />} />
            <Route path="/hr/companies" element={<CompaniesPage />} />

            {/* Session & Activity Logging */}
            <Route path="/hr/sessions" element={<SessionsPage />} />
            <Route path="/hr/activity-logs" element={<ActivityLogsPage />} />
            <Route path="/hr/users" element={<UsersPage />} />

            {/* Payroll & Salary */}
            <Route path="/hr/bank-accounts" element={<BankAccountsPage />} />
            <Route path="/hr/salary-sheets" element={<SalarySheetsPage />} />
            <Route path="/hr/increments" element={<IncrementsPage />} />
            <Route path="/hr/eobi-register" element={<EobiRegisterPage />} />
            <Route path="/hr/payroll-runs" element={<PayrollRunsPage />} />

            {/* Loans */}
            <Route path="/hr/loan-types" element={<LoanTypesPage />} />
            <Route path="/hr/fiscal-years" element={<FiscalYearsPage />} />
            <Route path="/hr/allowance-types" element={<AllowanceTypesPage />} />
            <Route path="/hr/deduction-formulas" element={<DeductionFormulasPage />} />
            <Route path="/hr/tax-slabs" element={<TaxSlabsPage />} />
            <Route path="/hr/loan-requests" element={<LoanRequestsPage />} />

            {/* Reports */}
            <Route path="/hr/reports" element={<ReportsHubPage />} />
            <Route path="/hr/reports/employee-directory" element={<EmployeeDirectoryReportPage />} />
            <Route path="/hr/reports/headcount-by-department" element={<HeadcountByDepartmentReportPage />} />
            <Route path="/hr/reports/headcount-by-branch" element={<HeadcountByBranchReportPage />} />
            <Route path="/hr/reports/employee-analytics" element={<EmployeeAnalyticsReportPage />} />
            <Route path="/hr/reports/joiners-exits" element={<JoinersExitsReportPage />} />
            <Route path="/hr/reports/new-joiners" element={<NewJoiningReportPage />} />
            <Route path="/hr/reports/cnic-expiry" element={<CnicExpiryReportPage />} />
            <Route path="/hr/reports/contract-probation-expiry" element={<ContractProbationExpiryReportPage />} />
            <Route path="/hr/reports/staff-strength" element={<StaffStrengthReportPage />} />
            <Route path="/hr/reports/leave-requests" element={<LeaveRequestsReportPage />} />
            <Route path="/hr/reports/leave-balances" element={<LeaveBalancesReportPage />} />
            <Route path="/hr/reports/payroll-run-summary" element={<PayrollRunSummaryReportPage />} />
            <Route path="/hr/reports/salary-register" element={<SalaryRegisterReportPage />} />
            <Route path="/hr/reports/loan-register" element={<LoanRegisterReportPage />} />
            <Route path="/hr/reports/gross-salary" element={<GrossSalaryReportPage />} />
            <Route path="/hr/reports/salary-slips/print" element={<BulkSalarySlipPage />} />
            <Route path="/hr/reports/attendance-records" element={<AttendanceRecordsReportPage />} />
            <Route path="/hr/reports/attendance-summary" element={<AttendanceSummaryReportPage />} />

            {/* Attendance */}
            <Route path="/hr/work-shifts" element={<WorkShiftsPage />} />
            <Route path="/hr/holidays" element={<HolidaysPage />} />
            <Route path="/hr/attendance" element={<AttendancePage />} />
            <Route path="/hr/attendance-statuses" element={<AttendanceStatusesPage />} />
            <Route path="/hr/attendance-summaries" element={<AttendanceSummariesPage />} />

            {/* Leave Management */}
            <Route path="/hr/leave" element={<Navigate to="/hr/leave/requests" replace />} />
            <Route path="/hr/leave/types" element={<LeaveTypesPage />} />
            <Route path="/hr/leave/statuses" element={<LeaveStatusesPage />} />
            <Route path="/hr/leave/entitlements" element={<LeaveEntitlementsPage />} />
            <Route path="/hr/leave/requests" element={<LeaveRequestsPage />} />

            {/* Employee Lifecycle */}
            <Route path="/hr/resignations" element={<ResignationsPage />} />
            <Route path="/hr/terminations" element={<TerminationsPage />} />
            <Route path="/hr/branch-transfers" element={<BranchTransfersPage />} />
            <Route path="/hr/biometric-devices" element={<BiometricDevicesPage />} />
          </Route>

          {/* ─── Parent Portal ─────────────────────────────────── */}          <Route path="/parent" element={<ProtectedRoute parentOnly><ParentLayout /></ProtectedRoute>}>
            <Route path="dashboard"  element={<></>} />
            <Route path="student"    element={<StudentInfoPage />} />
            <Route path="courses"    element={<CoursesPage />} />
            <Route path="results"    element={<ResultsPage />} />
            <Route path="progress"   element={<ProgressPage />} />
            <Route path="teachers"   element={<TeachersPage />} />
            <Route path="academic-calendar" element={<AcademicCalendarPage />} />
          </Route>

          {/* ─── Accounts & Finance Module ──────────────────────── */}
          <Route path="/accounts" element={<AccountsLayout />}>
            <Route index element={<Navigate to="/accounts/dashboard" replace />} />
            <Route path="dashboard" element={<AccountsDashboardPage />} />
            <Route path="chart-of-accounts" element={<ChartOfAccountsPage />} />
            <Route path="journals" element={<JournalEntriesPage />} />
            <Route path="ledger" element={<GeneralLedgerPage />} />
            <Route path="payables" element={<AccountsPayablePage />} />
            <Route path="receivables" element={<AccountsReceivablePage />} />
            <Route path="cash-bank" element={<CashBankPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="fixed-assets" element={<FixedAssetsPage />} />
            <Route path="financial-reports" element={<FinancialReportsPage />} />
            <Route path="period-closing" element={<PeriodClosingPage />} />
            <Route path="credit-debit-notes" element={<CreditDebitNotesPage />} />
            <Route path="vouchers" element={<VoucherEntryPage />} />
            <Route path="voucher-templates" element={<VoucherTemplatesPage />} />
            <Route path="ledger-statement" element={<LedgerStatementPage />} />
            <Route path="vendor-ledger" element={<VendorLedgerPage />} />
          </Route>

          {/* Catch-all — redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ThemeToggle />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
