import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";
import {
  INCREMENT_STATUS,
  INCREMENT_REASON_MAX_LENGTH,
  INCREMENT_ROLE_ID_MAX_LENGTH,
  INCREMENT_STAFF_TYPE_MAX_LENGTH,
} from "../constants/increment.constants";

// ─── Create Increment Request ────────────────────────────────────────────────
// status is never accepted here — every request starts 'Pending', changed
// only via updateIncrementStatusSchema.
//
// Previous PF / New PF / Medical / House Rent / Conveyance Allowance are no
// longer part of the Increment request (removed from the form and payload —
// see increment.service.ts's createIncrement/updateIncrement, which no
// longer touch those columns for new/edited records).
export const createIncrementSchema = z.object({
  staff_id: z.coerce
    .number({ error: "Employee is required" })
    .int()
    .positive("Employee must reference a valid staff id"),
  branch_id: z.coerce
    .number({ error: "Campus is required" })
    .int()
    .positive("Campus must reference a valid campus id"),
  reason: z
    .string({ error: "Reason is required" })
    .trim()
    .min(1, "Reason is required")
    .max(INCREMENT_REASON_MAX_LENGTH, `Reason must be at most ${INCREMENT_REASON_MAX_LENGTH} characters`),
  increment_date: z
    .string({ error: "Increment date is required" })
    .trim()
    .regex(DATE_REGEX, "Increment date must be in YYYY-MM-DD format")
    .refine((val) => !Number.isNaN(new Date(val).getTime()), { message: "Increment date must be valid" }),
  basic_salary: z.coerce.number({ error: "Current basic salary is required" }).int().min(0),
  previous_gross_salary: z.coerce.number({ error: "Previous gross salary is required" }).int().min(0),
  Amount: z.coerce.number({ error: "Increment amount is required" }).int().min(0),
  // New Gross Salary is derived (Previous Gross Salary + Amount) — see
  // increment.service.ts, which always recomputes it server-side. Still
  // accepted here (the frontend sends its own live-computed preview) so a
  // stale/omitted value never fails validation.
  New_salary_increment: z.coerce.number().int().min(0).optional(),
  staff_type: z.string().trim().max(INCREMENT_STAFF_TYPE_MAX_LENGTH).optional(),
  role_id: z.string().trim().max(INCREMENT_ROLE_ID_MAX_LENGTH).optional(),
  // Legacy erp_users reference — see increment.constants.ts. Not the same
  // as staff_id.
  user_id: z.coerce.number().int().positive().optional(),
});

export type CreateIncrementInput = z.infer<typeof createIncrementSchema>;

// ─── Update Increment (core fields — locked once status moves past Pending) ──
export const updateIncrementSchema = createIncrementSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the increment request",
  });

export type UpdateIncrementInput = z.infer<typeof updateIncrementSchema>;

// ─── Update status (separate action, always allowed) ────────────────────────
export const updateIncrementStatusSchema = z.object({
  status: z.union([
    z.literal(INCREMENT_STATUS.PENDING),
    z.literal(INCREMENT_STATUS.APPROVED),
    z.literal(INCREMENT_STATUS.REJECTED),
  ], { error: "Status must be Pending, Approved or Rejected" }),
});

export type UpdateIncrementStatusInput = z.infer<typeof updateIncrementStatusSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const incrementIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Increment id must be a number" })
    .int()
    .positive("Increment id must be a valid integer"),
});

// ─── :staffId route param (salary snapshot lookup) ──────────────────────────
export const staffIdParamSchema = z.object({
  staffId: z.coerce
    .number({ error: "Employee id must be a number" })
    .int()
    .positive("Employee id must be a valid integer"),
});

// ─── ?branch_id query param (salary snapshot lookup) ────────────────────────
export const staffSalarySnapshotQuerySchema = z.object({
  branch_id: z.coerce.number().int().positive().optional(),
});

// ─── GET /increments query params ───────────────────────────────────────────
export const listIncrementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
});