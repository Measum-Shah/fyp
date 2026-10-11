import { z } from "zod";
import {
  FEE_NOTIFICATION_STATUS,
  FEE_NOTIFICATION_TYPES,
} from "../constants/feeNotification.constants";

const channelSettingsSchema = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
});

export const notificationSettingsUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  due_reminder: z
    .object({
      enabled: z.boolean().optional(),
      days_before: z.array(z.number().int().min(0).max(90)).min(1).max(10).optional(),
      channels: channelSettingsSchema.optional(),
    })
    .optional(),
  payment_confirmation: z
    .object({
      enabled: z.boolean().optional(),
      channels: channelSettingsSchema.optional(),
    })
    .optional(),
  overdue: z
    .object({
      enabled: z.boolean().optional(),
      channels: channelSettingsSchema.optional(),
      include_late_fee: z.boolean().optional(),
    })
    .optional(),
});

export const runNotificationsSchema = z.object({
  branch_id: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().optional()
  ),
  dry_run: z.boolean().optional(),
});

export const notificationLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: z
    .enum([
      FEE_NOTIFICATION_TYPES.DUE_REMINDER,
      FEE_NOTIFICATION_TYPES.PAYMENT_CONFIRM,
      FEE_NOTIFICATION_TYPES.OVERDUE,
    ])
    .optional(),
  status: z
    .enum([
      FEE_NOTIFICATION_STATUS.PENDING,
      FEE_NOTIFICATION_STATUS.SENT,
      FEE_NOTIFICATION_STATUS.FAILED,
      FEE_NOTIFICATION_STATUS.SKIPPED,
    ])
    .optional(),
});
