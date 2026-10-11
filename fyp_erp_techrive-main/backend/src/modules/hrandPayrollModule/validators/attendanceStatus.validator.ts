import { z } from "zod";
import {
  ATTENDANCE_STATUS_ABSENCE_FLAG,
  ATTENDANCE_STATUS_DISPLAY_CLASS_MAX_LENGTH,
  ATTENDANCE_STATUS_STATUS,
  ATTENDANCE_STATUS_TITLE_MAX_LENGTH,
  DISPLAY_CLASS_OPTIONS,
} from "../constants/attendanceStatus.constants";

const displayClassField = z.enum(DISPLAY_CLASS_OPTIONS).nullable().optional();
// counts_as_absent: mark this row as meaning "Absent" so payroll's
// automated leave/attendance deduction (payrollRun.service.ts) knows to
// treat a day recorded with this status as unpaid/deductible. Defaults to
// 0/off — see the schema comment.
const countsAsAbsentField = z
  .union([
    z.literal(ATTENDANCE_STATUS_ABSENCE_FLAG.COUNTS_AS_ABSENT),
    z.literal(ATTENDANCE_STATUS_ABSENCE_FLAG.DOES_NOT_COUNT),
  ])
  .optional();

// ─── Create Attendance Status ────────────────────────────────────────────────
export const createAttendanceStatusSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(
      ATTENDANCE_STATUS_TITLE_MAX_LENGTH,
      `Title must be at most ${ATTENDANCE_STATUS_TITLE_MAX_LENGTH} characters`
    ),
  display_class: displayClassField,
  counts_as_absent: countsAsAbsentField,
  status: z
    .union([z.literal(ATTENDANCE_STATUS_STATUS.ACTIVE), z.literal(ATTENDANCE_STATUS_STATUS.INACTIVE)])
    .optional(),
});

export type CreateAttendanceStatusInput = z.infer<typeof createAttendanceStatusSchema>;

// ─── Update Attendance Status ────────────────────────────────────────────────
export const updateAttendanceStatusSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(
        ATTENDANCE_STATUS_TITLE_MAX_LENGTH,
        `Title must be at most ${ATTENDANCE_STATUS_TITLE_MAX_LENGTH} characters`
      )
      .optional(),
    display_class: displayClassField,
    counts_as_absent: countsAsAbsentField,
    status: z
      .union([z.literal(ATTENDANCE_STATUS_STATUS.ACTIVE), z.literal(ATTENDANCE_STATUS_STATUS.INACTIVE)])
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the attendance status",
  });

export type UpdateAttendanceStatusInput = z.infer<typeof updateAttendanceStatusSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const attendanceStatusIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Attendance status id must be a number" })
    .int("Attendance status id must be a valid integer")
    .positive("Attendance status id must be a valid integer"),
});

// ─── GET /attendance-statuses query params ──────────────────────────────────
export const listAttendanceStatusesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  status: z.coerce.number().int().optional(),
});