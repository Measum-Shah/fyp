import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  getCnicExpiryReport,
  getContractProbationExpiryReport,
  getEmployeeAnalyticsReport,
  getEmployeeDirectoryReport,
  getHeadcountByBranchReport,
  getHeadcountByDepartmentReport,
  getJoinersAndExitsReport,
  getStaffStrengthReport,
} from "../controllers/report.controller";
import {
  cnicExpiryQuerySchema,
  contractProbationExpiryQuerySchema,
  employeeDirectoryQuerySchema,
  joinersExitsQuerySchema,
} from "../validators/report.validator";
import {
  getLeaveBalancesReport,
  getLeaveRequestsReport,
} from "../controllers/leaveReport.controller";
import {
  leaveBalancesReportQuerySchema,
  leaveRequestsReportQuerySchema,
} from "../validators/leaveReport.validator";
import {
  getGrossSalaryReport,
  getLoanRegisterReport,
  getPayrollRunSummaryReport,
  getSalaryRegisterReport,
  getSalarySlips,
} from "../controllers/payrollReport.controller";
import {
  grossSalaryQuerySchema,
  loanRegisterQuerySchema,
  payrollRunSummaryQuerySchema,
  salaryRegisterQuerySchema,
  salarySlipsQuerySchema,
} from "../validators/payrollReport.validator";
import {
  getAttendanceRecordsReport,
  getAttendanceSummaryReport,
} from "../controllers/attendanceReport.controller";
import {
  attendanceRecordsReportQuerySchema,
  attendanceSummaryReportQuerySchema,
} from "../validators/attendanceReport.validator";

const router = Router();

// All Reports routes require an authenticated ERP user, same as every other
// HR & Payroll route.
router.use(authMiddleware);

// ─── Employee Reports ────────────────────────────────────────────────────────
// GET /api/reports/employee-directory
router.get(
  "/employee-directory",
  requireHrAccess("report.employee_directory"),
  validate(employeeDirectoryQuerySchema, "query"),
  getEmployeeDirectoryReport
);

// GET /api/reports/headcount-by-department
router.get("/headcount-by-department", requireHrAccess("report.headcount_by_department"), getHeadcountByDepartmentReport);

// GET /api/reports/headcount-by-branch
router.get("/headcount-by-branch", requireHrAccess("report.headcount_by_branch"), getHeadcountByBranchReport);
// GET /api/reports/employee-analytics
router.get("/employee-analytics", requireHrAccess("report.employee_analytics"), getEmployeeAnalyticsReport);

// GET /api/reports/joiners-exits
router.get("/joiners-exits", requireHrAccess("report.joiners_exits"), validate(joinersExitsQuerySchema, "query"), getJoinersAndExitsReport);

// GET /api/reports/cnic-expiry
router.get("/cnic-expiry", requireHrAccess("report.cnic_expiry"), validate(cnicExpiryQuerySchema, "query"), getCnicExpiryReport);

// GET /api/reports/contract-probation-expiry
router.get(
  "/contract-probation-expiry",
  requireHrAccess("report.contract_probation_expiry"),
  validate(contractProbationExpiryQuerySchema, "query"),
  getContractProbationExpiryReport
);

// GET /api/reports/staff-strength
router.get("/staff-strength", requireHrAccess("report.staff_strength"), getStaffStrengthReport);

// ─── Leave Reports ───────────────────────────────────────────────────────────
// GET /api/reports/leave-requests
router.get(
  "/leave-requests",
  requireHrAccess("report.leave_requests"),
  validate(leaveRequestsReportQuerySchema, "query"),
  getLeaveRequestsReport
);

// GET /api/reports/leave-balances
router.get(
  "/leave-balances",
  requireHrAccess("report.leave_balances"),
  validate(leaveBalancesReportQuerySchema, "query"),
  getLeaveBalancesReport
);

// ─── Payroll Reports ─────────────────────────────────────────────────────────
// GET /api/reports/payroll-run-summary
router.get(
  "/payroll-run-summary",
  requireHrAccess("report.payroll_run_summary"),
  validate(payrollRunSummaryQuerySchema, "query"),
  getPayrollRunSummaryReport
);

// GET /api/reports/salary-register
router.get(
  "/salary-register",
  requireHrAccess("report.salary_register"),
  validate(salaryRegisterQuerySchema, "query"),
  getSalaryRegisterReport
);

// GET /api/reports/loan-register
router.get("/loan-register", requireHrAccess("report.loan_register"), validate(loanRegisterQuerySchema, "query"), getLoanRegisterReport);

// GET /api/reports/gross-salary
router.get("/gross-salary", requireHrAccess("report.gross_salary"), validate(grossSalaryQuerySchema, "query"), getGrossSalaryReport);

// GET /api/reports/salary-slips
router.get("/salary-slips", requireHrAccess("report.salary_slips"), validate(salarySlipsQuerySchema, "query"), getSalarySlips);

// ─── Attendance Reports ──────────────────────────────────────────────────────
// GET /api/reports/attendance-records
router.get(
  "/attendance-records",
  requireHrAccess("report.attendance_records"),
  validate(attendanceRecordsReportQuerySchema, "query"),
  getAttendanceRecordsReport
);

// GET /api/reports/attendance-summary
router.get(
  "/attendance-summary",
  requireHrAccess("report.attendance_summary"),
  validate(attendanceSummaryReportQuerySchema, "query"),
  getAttendanceSummaryReport
);

export default router;