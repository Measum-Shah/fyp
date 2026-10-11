import { z } from "zod";
import { LEAVE_ENTITLEMENT_STATUS } from "../constants/leaveEntitlement.constants";

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: "Date must be a valid calendar date",
  });

// Plain object (no refine attached) so both create and update can derive
// from it independently — .superRefine() on a ZodObject in this Zod
// version returns a ZodEffects with no .partial()/.innerType() escape
// hatch, so the cross-field check is attached separately below instead of
// being baked into a single shared schema.
const baseLeaveEntitlementSchema = z.object({
  employee_id: z.coerce
    .number({ error: "Employee is required" })
    .int("Employee must reference a valid employee id")
    .positive("Employee must reference a valid employee id"),
  leave_type_id: z.coerce
    .number({ error: "Leave type is required" })
    .int("Leave type must reference a valid leave type id")
    .positive("Leave type must reference a valid leave type id"),
  no_of_days: z.coerce
    .number({ error: "Number of days is required" })
    .min(0, "Number of days cannot be negative"),
  days_used: z.coerce.number().min(0, "Days used cannot be negative").optional(),
  start_date: dateField.optional(),
  end_date: dateField.optional(),
  credited_date: dateField.optional(),
  status: z
    .union([
      z.literal(LEAVE_ENTITLEMENT_STATUS.ACTIVE),
      z.literal(LEAVE_ENTITLEMENT_STATUS.INACTIVE),
    ])
    .optional(),
});

// ─── Create Leave Entitlement ────────────────────────────────────────────────
export const createLeaveEntitlementSchema = baseLeaveEntitlementSchema.superRefine((val, ctx) => {
  if (val.days_used !== undefined && val.days_used > val.no_of_days) {
    ctx.addIssue({
      code: "custom",
      path: ["days_used"],
      message: "Days used cannot be more than the number of days allocated",
    });
  }
});

export type CreateLeaveEntitlementInput = z.infer<typeof createLeaveEntitlementSchema>;

// ─── Update Leave Entitlement (partial, but body cannot be empty) ──────────
// The cross-field check here only catches the case where both fields are
// resent together in the same update — a request that only sends
// days_used against an existing no_of_days it can't see is caught
// separately in leaveEntitlement.service.ts, which has the stored record.
export const updateLeaveEntitlementSchema = baseLeaveEntitlementSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the leave entitlement",
  })
  .superRefine((val, ctx) => {
    if (
      val.days_used !== undefined &&
      val.no_of_days !== undefined &&
      val.days_used > val.no_of_days
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["days_used"],
        message: "Days used cannot be more than the number of days allocated",
      });
    }
  });

export type UpdateLeaveEntitlementInput = z.infer<typeof updateLeaveEntitlementSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const leaveEntitlementIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Leave entitlement id must be a number" })
    .int("Leave entitlement id must be a valid integer")
    .positive("Leave entitlement id must be a valid integer"),
});

// ─── GET /leave-entitlements query params ───────────────────────────────────
export const listLeaveEntitlementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  employee_id: z.coerce.number().int().positive().optional(),
  leave_type_id: z.coerce.number().int().positive().optional(),
  status: z.coerce.number().int().optional(),
});