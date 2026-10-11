import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";
import { COMMENT_MAX_LENGTH, REMARKS_MAX_LENGTH, TIME_HHMM_REGEX } from "../constants/attendance.constants";

const timeField = z.string().trim().regex(TIME_HHMM_REGEX, "Time must be in HH:mm format").optional();

// ─── Create Attendance Record ────────────────────────────────────────────────
export const createAttendanceSchema = z
  .object({
    employee_id: z.coerce.number({ error: "Employee is required" }).int().positive(),
    branch_id: z.coerce.number().int().positive().optional(),
    attendance_date: z
      .string({ error: "Attendance date is required" })
      .trim()
      .regex(DATE_REGEX, "Attendance date must be in YYYY-MM-DD format"),
    status: z.coerce.number({ error: "Attendance status is required" }).int().positive(),
    timeIn: timeField,
    timeOut: timeField,
    remarks: z.string().trim().max(REMARKS_MAX_LENGTH).optional(),
    comment: z.string().trim().max(COMMENT_MAX_LENGTH).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.timeIn && val.timeOut && val.timeOut <= val.timeIn) {
      ctx.addIssue({
        code: "custom",
        path: ["timeOut"],
        message: "Time out must be after time in",
      });
    }
  });

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;

// ─── Update Attendance Record ────────────────────────────────────────────────
const updateAttendanceBaseSchema = z.object({
  branch_id: z.coerce.number().int().positive().optional(),
  attendance_date: z.string().trim().regex(DATE_REGEX, "Attendance date must be in YYYY-MM-DD format").optional(),
  status: z.coerce.number().int().positive().optional(),
  timeIn: timeField,
  timeOut: timeField,
  remarks: z.string().trim().max(REMARKS_MAX_LENGTH).optional(),
  comment: z.string().trim().max(COMMENT_MAX_LENGTH).optional(),
});

export const updateAttendanceSchema = updateAttendanceBaseSchema
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the attendance record",
  })
  .superRefine((val, ctx) => {
    if (val.timeIn && val.timeOut && val.timeOut <= val.timeIn) {
      ctx.addIssue({
        code: "custom",
        path: ["timeOut"],
        message: "Time out must be after time in",
      });
    }
  });

export type UpdateAttendanceInput = z.infer<typeof updateAttendanceBaseSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const attendanceIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Attendance id must be a number" })
    .int("Attendance id must be a valid integer")
    .positive("Attendance id must be a valid integer"),
});

// ─── PATCH /attendance/:id/review-status body ───────────────────────────────
// Sets/clears approve_reject_by — see attendance.service.ts's
// setAttendanceReviewStatus for why this is the only thing that column can
// honestly represent (there's no separate approved/rejected outcome column).
export const reviewAttendanceSchema = z.object({
  reviewed: z.boolean({ error: "reviewed must be true or false" }),
});

export type ReviewAttendanceInput = z.infer<typeof reviewAttendanceSchema>;

// ─── GET /attendance query params ───────────────────────────────────────────
export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(20),
  employee_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  status: z.coerce.number().int().positive().optional(),
  start_date: z.string().trim().regex(DATE_REGEX, "start_date must be in YYYY-MM-DD format").optional(),
  end_date: z.string().trim().regex(DATE_REGEX, "end_date must be in YYYY-MM-DD format").optional(),
});