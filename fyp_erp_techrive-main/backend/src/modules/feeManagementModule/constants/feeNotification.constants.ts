/** Stored in existing payment_settings.identity (varchar 15) — no new tables */
export const FEE_NOTIFICATION_SETTINGS_IDENTITY = "FEE_NOTIF";

export const FEE_NOTIFICATION_TYPES = {
  DUE_REMINDER: "DUE_REMINDER",
  PAYMENT_CONFIRM: "PAYMENT_CONFIRM",
  OVERDUE: "OVERDUE",
} as const;

export type FeeNotificationType =
  (typeof FEE_NOTIFICATION_TYPES)[keyof typeof FEE_NOTIFICATION_TYPES];

export const FEE_NOTIFICATION_CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
} as const;

export type FeeNotificationChannel =
  (typeof FEE_NOTIFICATION_CHANNELS)[keyof typeof FEE_NOTIFICATION_CHANNELS];

export const FEE_NOTIFICATION_STATUS = {
  PENDING: "Pending",
  SENT: "Sent",
  FAILED: "Failed",
  SKIPPED: "Skipped",
} as const;

export type FeeNotificationStatus =
  (typeof FEE_NOTIFICATION_STATUS)[keyof typeof FEE_NOTIFICATION_STATUS];

export const DEFAULT_REMINDER_DAYS = [7, 3, 1];

export const MAX_NOTIFICATION_LOG_ENTRIES = 1000;
