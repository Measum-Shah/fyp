import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import { connectDB, disconnectDB } from "./config/db";

// ─── Auth ──────────────────────────────────────────────────────────────────────
import authRoutes from "./modules/authModule/auth.routes";
import feeRoutes from "./modules/feeManagementModule/routes/fee.routes";

// ─── Accounts & Finance Module ────────────────────────────────────────────────
import accountsRoutes from "./modules/accountsModule/routes/index";

// ─── Academic Module (main branch) ────────────────────────────────────────────
import academicRoutes from "./modules/AcademicModule/routes/index";
import teacherDashboardRoutes from "./modules/AcademicModule/TeacherPortal/routes/teacherDashboard.routes";

// ─── Parent Portal Module ────────────────────────────────────────────────────
import parentRoutes from "./modules/AcademicModule/ParentModule/routes/parent.routes";

// ─── HR & Payroll Module ───────────────────────────────────────────────────────
import employeeRoutes from "./modules/hrandPayrollModule/routes/employee.routes";
import departmentRoutes from "./modules/hrandPayrollModule/routes/department.routes";
import staffTypeRoutes from "./modules/hrandPayrollModule/routes/staffType.routes";
import designationRoutes from "./modules/hrandPayrollModule/routes/designation.routes";
import branchRoutes from "./modules/hrandPayrollModule/routes/branch.routes";
import companyRoutes from "./modules/hrandPayrollModule/routes/company.routes";
import reportRoutes from "./modules/hrandPayrollModule/routes/report.routes";
import bankAccountRoutes from "./modules/hrandPayrollModule/routes/bankAccount.routes";
import salaryRoutes from "./modules/hrandPayrollModule/routes/salary.routes";
import fiscalYearRoutes from "./modules/hrandPayrollModule/routes/fiscalYear.routes";
import allowanceTypeRoutes from "./modules/hrandPayrollModule/routes/allowanceType.routes";
import taxSlabRoutes from "./modules/hrandPayrollModule/routes/taxSlab.routes";
import payrollDeductionFormulaRoutes from "./modules/hrandPayrollModule/routes/payrollDeductionFormula.routes";
import incrementRoutes from "./modules/hrandPayrollModule/routes/increment.routes";
import eobiRoutes from "./modules/hrandPayrollModule/routes/eobi.routes";
import workShiftRoutes from "./modules/hrandPayrollModule/routes/workShift.routes";
import holidayRoutes from "./modules/hrandPayrollModule/routes/holiday.routes";
import attendanceStatusRoutes from "./modules/hrandPayrollModule/routes/attendanceStatus.routes";
import attendanceRoutes from "./modules/hrandPayrollModule/routes/attendance.routes";
import leaveTypeRoutes from "./modules/hrandPayrollModule/routes/leaveType.routes";
import leaveStatusRoutes from "./modules/hrandPayrollModule/routes/leaveStatus.routes";
import leaveEntitlementRoutes from "./modules/hrandPayrollModule/routes/leaveEntitlement.routes";
import leaveRequestRoutes from "./modules/hrandPayrollModule/routes/leaveRequest.routes";
import payrollRunRoutes from "./modules/hrandPayrollModule/routes/payrollRun.routes";
import loanTypeRoutes from "./modules/hrandPayrollModule/routes/loanType.routes";
import loanRequestRoutes from "./modules/hrandPayrollModule/routes/loanRequest.routes";
import resignationRoutes from "./modules/hrandPayrollModule/routes/resignation.routes";
import terminationRoutes from "./modules/hrandPayrollModule/routes/termination.routes";
import branchTransferRoutes from "./modules/hrandPayrollModule/routes/branchTransfer.routes";
import experienceRoutes from "./modules/hrandPayrollModule/routes/experience.routes";
import familyRoutes from "./modules/hrandPayrollModule/routes/family.routes";
import emergencyContactRoutes from "./modules/hrandPayrollModule/routes/emergencyContact.routes";
import performanceRoutes from "./modules/hrandPayrollModule/routes/performance.routes";
import monthRoutes from "./modules/hrandPayrollModule/routes/month.routes";
import yearRoutes from "./modules/hrandPayrollModule/routes/year.routes";
import attendanceSummaryRoutes from "./modules/hrandPayrollModule/routes/attendanceSummary.routes";
import staffQualificationRoutes from "./modules/hrandPayrollModule/routes/staffQualification.routes";
import staffAssetRoutes from "./modules/hrandPayrollModule/routes/staffAsset.routes";
import biometricDeviceRoutes from "./modules/hrandPayrollModule/routes/biometricDevice.routes";
import sessionRoutes from "./modules/hrandPayrollModule/routes/session.routes";
import activityLogRoutes from "./modules/hrandPayrollModule/routes/activityLog.routes";
import userRoutes from "./modules/hrandPayrollModule/routes/user.routes";

const app = express();

// ─── Middlewares ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ─── Static file serving ──────────────────────────────────────────────────────
// Uploaded Staff Qualification / Staff Asset attachments live in
// backend/uploads/<subdir>/ on disk and are served from here, e.g.
// GET /uploads/staff-qualifications/172_..._degree.pdf
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ message: "🚀 ERP Backend Running", status: "ok" });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

// Auth
app.use("/api/auth", authRoutes);
app.use("/api/fee", feeRoutes);

// Accounts & Finance
app.use("/api/accounts", accountsRoutes);

// Academic Module
app.use("/api/academic", academicRoutes);
app.use("/api/teacher", teacherDashboardRoutes);
app.use("/api/parent",   parentRoutes);  // Parent Portal

// HR & Payroll — Core
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/staff-types", staffTypeRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/reports", reportRoutes);

// HR & Payroll — Salary & Finance
app.use("/api/bank-accounts", bankAccountRoutes);
app.use("/api/salary-sheets", salaryRoutes);
app.use("/api/fiscal-years", fiscalYearRoutes);
app.use("/api/allowance-types", allowanceTypeRoutes);
app.use("/api/tax-slabs", taxSlabRoutes);
app.use("/api/payroll-deduction-formulas", payrollDeductionFormulaRoutes);
app.use("/api/increments", incrementRoutes);
app.use("/api/eobi-register", eobiRoutes);
app.use("/api/payroll-runs", payrollRunRoutes);

// HR & Payroll — Loans
app.use("/api/loan-types", loanTypeRoutes);
app.use("/api/loan-requests", loanRequestRoutes);

// HR & Payroll — Attendance & Shifts
app.use("/api/work-shifts", workShiftRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/attendance-statuses", attendanceStatusRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/attendance-summaries", attendanceSummaryRoutes);

// HR & Payroll — Leave Management
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/leave-statuses", leaveStatusRoutes);
app.use("/api/leave-entitlements", leaveEntitlementRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);

// HR & Payroll — Employee Lifecycle
app.use("/api/resignations", resignationRoutes);
app.use("/api/terminations", terminationRoutes);
app.use("/api/branch-transfers", branchTransferRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/emergency-contacts", emergencyContactRoutes);
app.use("/api/performances", performanceRoutes);

// HR & Payroll — Time
app.use("/api/months", monthRoutes);
app.use("/api/years", yearRoutes);

// HR & Payroll — Staff Records
app.use("/api/staff-qualifications", staffQualificationRoutes);
app.use("/api/staff-assets", staffAssetRoutes);
app.use("/api/biometric", biometricDeviceRoutes);

// HR & Payroll — Session & Activity Logging
app.use("/api/sessions", sessionRoutes);
app.use("/api/activity-logs", activityLogRoutes);

app.use("/api/users", userRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📡 Auth API        → http://localhost:${PORT}/api/auth`);
    console.log(`📚 Academic API    → http://localhost:${PORT}/api/academic`);
    console.log(`👥 Employee API    → http://localhost:${PORT}/api/employees`);
    console.log(`🏢 Department API  → http://localhost:${PORT}/api/departments`);
    console.log(`💰 Salary API      → http://localhost:${PORT}/api/salary-sheets`);
    console.log(`📊 Reports API     → http://localhost:${PORT}/api/reports`);
    console.log(`💳 Fee API         → http://localhost:${PORT}/api/fee`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n🛑 Shutting down server...");
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer();