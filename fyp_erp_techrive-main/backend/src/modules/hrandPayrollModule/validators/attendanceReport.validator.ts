import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";

// ─── Attendance Reports — Validators ────────────────────────────────────────
// Mirrors leaveReport.validator.ts's conventions exactly. Both reports here
// read from tables Attendance already owns (employee_attendance,
// attendance_summary) — no new DB objects.

// ─── GET /reports/attendance-records ────────────────────────────────────────
export const attendanceRecordsReportQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  employee_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  status: z.coerce.number().int().positive().optional(),
  from: z.string().trim().regex(DATE_REGEX, "From date must be in YYYY-MM-DD format").optional(),
  to: z.string().trim().regex(DATE_REGEX, "To date must be in YYYY-MM-DD format").optional(),
});

export type AttendanceRecordsReportQuery = z.infer<typeof attendanceRecordsReportQuerySchema>;

// ─── GET /reports/attendance-summary ────────────────────────────────────────
export const attendanceSummaryReportQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  staff_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  month_id: z.coerce.number().int().positive().optional(),
  year_id: z.coerce.number().int().positive().optional(),
  pay_status: z.string().trim().max(50).optional(),
  approved_status: z.string().trim().max(50).optional(),
});

export type AttendanceSummaryReportQuery = z.infer<typeof attendanceSummaryReportQuerySchema>;
