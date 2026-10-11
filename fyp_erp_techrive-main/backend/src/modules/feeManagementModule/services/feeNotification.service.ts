import { prisma } from "../../../config/db";
import { AppError } from "../utils/fee.helpers";
import {
  DEFAULT_REMINDER_DAYS,
  FEE_NOTIFICATION_CHANNELS,
  FEE_NOTIFICATION_SETTINGS_IDENTITY,
  FEE_NOTIFICATION_STATUS,
  FEE_NOTIFICATION_TYPES,
  MAX_NOTIFICATION_LOG_ENTRIES,
  type FeeNotificationChannel,
  type FeeNotificationStatus,
  type FeeNotificationType,
} from "../constants/feeNotification.constants";
import {
  buildDueReminderEmail,
  buildDueReminderSms,
  buildOverdueEmail,
  buildOverdueSms,
  buildPaymentConfirmationEmail,
  buildPaymentConfirmationSms,
  getEmailConfigStatus,
  sendFeeNotificationEmail,
} from "./feeEmail.service";
import { getSmsConfigStatus, sendFeeSms } from "./feeSms.service";
import {
  computeLateFeeForBasic,
  loadActiveRules,
} from "./lateFeeManagement.service";

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);

const diffDays = (from: Date, to: Date) => {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

type ChannelSettings = { email: boolean; sms: boolean };

type NotificationSettings = {
  enabled: boolean;
  due_reminder: {
    enabled: boolean;
    days_before: number[];
    channels: ChannelSettings;
  };
  payment_confirmation: {
    enabled: boolean;
    channels: ChannelSettings;
  };
  overdue: {
    enabled: boolean;
    channels: ChannelSettings;
    include_late_fee: boolean;
  };
};

export type NotificationLogEntry = {
  id: number;
  idempotency_key: string;
  type: FeeNotificationType;
  channel: FeeNotificationChannel;
  status: FeeNotificationStatus;
  recipient: string;
  recipient_name: string;
  student_id: number | null;
  fee_master_basic_id: number | null;
  payment_collection_id: number | null;
  subject: string | null;
  failure_reason: string | null;
  sent_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
};

type NotificationConfig = {
  settings: NotificationSettings;
  log: NotificationLogEntry[];
  next_log_id: number;
};

const defaultSettings = (): NotificationSettings => ({
  enabled: true,
  due_reminder: {
    enabled: true,
    days_before: [...DEFAULT_REMINDER_DAYS],
    channels: { email: true, sms: false },
  },
  payment_confirmation: {
    enabled: true,
    channels: { email: true, sms: false },
  },
  overdue: {
    enabled: true,
    channels: { email: true, sms: false },
    include_late_fee: true,
  },
});

const defaultConfig = (): NotificationConfig => ({
  settings: defaultSettings(),
  log: [],
  next_log_id: 1,
});

const parseConfig = (raw: string | null | undefined): NotificationConfig => {
  if (!raw) return defaultConfig();
  try {
    const parsed = JSON.parse(raw) as Partial<NotificationConfig>;
    const settings = parsed.settings || defaultSettings();
    return {
      settings: {
        ...defaultSettings(),
        ...settings,
        due_reminder: {
          ...defaultSettings().due_reminder,
          ...(settings.due_reminder || {}),
          channels: {
            ...defaultSettings().due_reminder.channels,
            ...(settings.due_reminder?.channels || {}),
          },
        },
        payment_confirmation: {
          ...defaultSettings().payment_confirmation,
          ...(settings.payment_confirmation || {}),
          channels: {
            ...defaultSettings().payment_confirmation.channels,
            ...(settings.payment_confirmation?.channels || {}),
          },
        },
        overdue: {
          ...defaultSettings().overdue,
          ...(settings.overdue || {}),
          channels: {
            ...defaultSettings().overdue.channels,
            ...(settings.overdue?.channels || {}),
          },
        },
      },
      log: Array.isArray(parsed.log) ? parsed.log : [],
      next_log_id:
        parsed.next_log_id && parsed.next_log_id > 0 ? parsed.next_log_id : 1,
    };
  } catch {
    return defaultConfig();
  }
};

const serializeConfig = (config: NotificationConfig) => JSON.stringify(config);

const getSettingsRow = async () =>
  prisma.paymentSettings.findFirst({
    where: { identity: FEE_NOTIFICATION_SETTINGS_IDENTITY },
  });

const ensureSettingsRow = async () => {
  const existing = await getSettingsRow();
  if (existing) return existing;

  return prisma.paymentSettings.create({
    data: {
      identity: FEE_NOTIFICATION_SETTINGS_IDENTITY,
      logo: "fee",
      link: "-",
      config: serializeConfig(defaultConfig()),
      status: 0,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

const loadConfig = async () => {
  const row = await ensureSettingsRow();
  return { row, config: parseConfig(row.config) };
};

const saveConfig = async (config: NotificationConfig) => {
  const row = await ensureSettingsRow();
  await prisma.paymentSettings.update({
    where: { id: row.id },
    data: {
      config: serializeConfig(config),
      updated_at: new Date(),
    },
  });
};

export type NotificationRecipient = {
  name: string;
  email: string | null;
  phone: string | null;
  role: "student" | "father" | "mother" | "guardian";
};

export const resolveStudentRecipients = async (
  studentId: number
): Promise<{
  studentName: string;
  reg_no: string | null;
  walkin_reg_no: string | null;
  recipients: NotificationRecipient[];
}> => {
  const student = await prisma.students.findFirst({
    where: { id: studentId, deleted_at: null },
    select: {
      id: true,
      first_name: true,
      middle_name: true,
      last_name: true,
      reg_no: true,
      walkin_reg_no: true,
      email: true,
      mobile_1: true,
      mobile_2: true,
    },
  });
  if (!student) throw new AppError("Student not found", 404);

  const studentName = [student.first_name, student.middle_name, student.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const recipients: NotificationRecipient[] = [];

  if (student.email || student.mobile_1 || student.mobile_2) {
    recipients.push({
      name: studentName || `Student #${studentId}`,
      email: student.email || null,
      phone: student.mobile_1 || student.mobile_2 || null,
      role: "student",
    });
  }

  const parent = await prisma.parentDetails.findFirst({
    where: { students_id: studentId, deleted_at: null },
    orderBy: { id: "desc" },
  });

  if (parent) {
    const fatherName = [parent.father_first_name, parent.father_last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (parent.father_email || parent.father_mobile_1) {
      recipients.push({
        name: fatherName || "Parent/Guardian",
        email: parent.father_email || null,
        phone: parent.father_mobile_1 || null,
        role: "father",
      });
    }

    const motherName = [parent.mother_first_name, parent.mother_last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (parent.mother_email || parent.mother_mobile_1) {
      recipients.push({
        name: motherName || "Parent/Guardian",
        email: parent.mother_email || null,
        phone: parent.mother_mobile_1 || null,
        role: "mother",
      });
    }

    const guardianName = [parent.guardian_first_name, parent.guardian_last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (parent.guardian_email || parent.guardian_mobile_1) {
      recipients.push({
        name: guardianName || "Guardian",
        email: parent.guardian_email || null,
        phone: parent.guardian_mobile_1 || null,
        role: "guardian",
      });
    }
  }

  return {
    studentName,
    reg_no: student.reg_no || null,
    walkin_reg_no: student.walkin_reg_no || null,
    recipients,
  };
};

const hasSent = (config: NotificationConfig, idempotencyKey: string) =>
  config.log.some(
    (e) =>
      e.idempotency_key === idempotencyKey &&
      (e.status === FEE_NOTIFICATION_STATUS.SENT ||
        e.status === FEE_NOTIFICATION_STATUS.PENDING)
  );

const appendLogEntry = async (
  config: NotificationConfig,
  entry: Omit<NotificationLogEntry, "id" | "created_at">
) => {
  const logEntry: NotificationLogEntry = {
    ...entry,
    id: config.next_log_id,
    created_at: new Date().toISOString(),
  };
  config.log.unshift(logEntry);
  config.next_log_id += 1;
  if (config.log.length > MAX_NOTIFICATION_LOG_ENTRIES) {
    config.log = config.log.slice(0, MAX_NOTIFICATION_LOG_ENTRIES);
  }
  await saveConfig(config);
  return logEntry;
};

type DispatchResult = {
  status: FeeNotificationStatus;
  failure_reason: string | null;
  delivery: Record<string, unknown>;
};

const dispatchChannel = async (input: {
  channel: FeeNotificationChannel;
  recipient: NotificationRecipient;
  subject: string;
  emailBody: string;
  smsBody: string;
  notificationType: FeeNotificationType;
}): Promise<DispatchResult> => {
  if (input.channel === FEE_NOTIFICATION_CHANNELS.EMAIL) {
    if (!input.recipient.email) {
      return {
        status: FEE_NOTIFICATION_STATUS.SKIPPED,
        failure_reason: "No email address on file",
        delivery: {},
      };
    }
    const result = await sendFeeNotificationEmail({
      to: input.recipient.email,
      subject: input.subject,
      body: input.emailBody,
      notification_type: input.notificationType,
    });
    if (result.sent) {
      return { status: FEE_NOTIFICATION_STATUS.SENT, failure_reason: null, delivery: result };
    }
    if (result.reason === "EMAIL_NOT_CONFIGURED") {
      return {
        status: FEE_NOTIFICATION_STATUS.SKIPPED,
        failure_reason: "Email provider not configured",
        delivery: result,
      };
    }
    return {
      status: FEE_NOTIFICATION_STATUS.PENDING,
      failure_reason: result.reason,
      delivery: result,
    };
  }

  if (!input.recipient.phone) {
    return {
      status: FEE_NOTIFICATION_STATUS.SKIPPED,
      failure_reason: "No mobile number on file",
      delivery: {},
    };
  }
  const result = await sendFeeSms({
    to: input.recipient.phone,
    body: input.smsBody,
    notification_type: input.notificationType,
  });
  if (result.sent) {
    return { status: FEE_NOTIFICATION_STATUS.SENT, failure_reason: null, delivery: result };
  }
  if (result.reason === "SMS_NOT_CONFIGURED") {
    return {
      status: FEE_NOTIFICATION_STATUS.SKIPPED,
      failure_reason: "SMS provider not configured",
      delivery: result,
    };
  }
  return {
    status: FEE_NOTIFICATION_STATUS.PENDING,
    failure_reason: result.reason,
    delivery: result,
  };
};

const getOutstandingForBasic = async (basicId: number) => {
  const basic = await prisma.feeMasterBasics.findUnique({ where: { id: basicId } });
  if (!basic) return null;

  const lines = await prisma.feeMasters.findMany({
    where: { fee_master_basic_id_fk: basic.id },
  });
  const due =
    num(basic.total_after_discount) ||
    num(basic.total_fee) ||
    lines.reduce((s, l) => s + num(l.fee_amount), 0);
  const paid = lines.reduce((s, l) => s + num(l.fee_paid_amount), 0);
  const outstanding = Math.max(0, due - paid);

  return { basic, lines, due, paid, outstanding };
};

export const getNotificationSettings = async () => {
  const { config } = await loadConfig();
  return config.settings;
};

export const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
  const { config } = await loadConfig();
  config.settings = {
    ...config.settings,
    ...settings,
    due_reminder: {
      ...config.settings.due_reminder,
      ...(settings.due_reminder || {}),
      channels: {
        ...config.settings.due_reminder.channels,
        ...(settings.due_reminder?.channels || {}),
      },
    },
    payment_confirmation: {
      ...config.settings.payment_confirmation,
      ...(settings.payment_confirmation || {}),
      channels: {
        ...config.settings.payment_confirmation.channels,
        ...(settings.payment_confirmation?.channels || {}),
      },
    },
    overdue: {
      ...config.settings.overdue,
      ...(settings.overdue || {}),
      channels: {
        ...config.settings.overdue.channels,
        ...(settings.overdue?.channels || {}),
      },
    },
  };
  await saveConfig(config);
  return config.settings;
};

export const listNotificationLog = async (params?: {
  page?: number;
  limit?: number;
  type?: FeeNotificationType;
  status?: FeeNotificationStatus;
  branch_id?: number;
}) => {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;
  const { config } = await loadConfig();

  let items = [...config.log];
  if (params?.type) items = items.filter((i) => i.type === params.type);
  if (params?.status) items = items.filter((i) => i.status === params.status);

  const total = items.length;
  return {
    items: items.slice(skip, skip + limit),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

export const getNotificationWorkspace = async (branchId?: number) => {
  const { config } = await loadConfig();
  const [emailStatus, smsStatus, logPage] = await Promise.all([
    getEmailConfigStatus(),
    getSmsConfigStatus(),
    listNotificationLog({ page: 1, limit: 10 }),
  ]);

  const sentCount = config.log.filter((l) => l.status === FEE_NOTIFICATION_STATUS.SENT).length;
  const failedCount = config.log.filter((l) => l.status === FEE_NOTIFICATION_STATUS.FAILED).length;
  const skippedCount = config.log.filter((l) => l.status === FEE_NOTIFICATION_STATUS.SKIPPED).length;
  const pendingCount = config.log.filter((l) => l.status === FEE_NOTIFICATION_STATUS.PENDING).length;

  const preview = await previewNotificationCandidates(branchId);

  return {
    settings: config.settings,
    summary: {
      total_logged: config.log.length,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      pending: pendingCount,
      due_reminder_candidates: preview.due_reminders.length,
      overdue_candidates: preview.overdue.length,
    },
    providers: {
      email: emailStatus,
      sms: smsStatus,
    },
    recent_log: logPage.items,
    scheduling: {
      configured: false,
      note:
        "Automatic daily scheduling is not configured in this environment. Use the buttons on this page to send due reminders and overdue notices, or schedule them to run daily (for example at 08:00).",
    },
  };
};

const previewNotificationCandidates = async (branchId?: number) => {
  const today = startOfDay(new Date());
  const { config } = await loadConfig();
  const rules = await loadActiveRules();

  const where: Record<string, unknown> = {
    student_id: { not: null },
    fee_due_date_end: { not: null },
    OR: [{ status: { in: ["1", "Active"] } }, { status: null }],
  };
  if (branchId) where.branch_id = branchId;

  const basics = await prisma.feeMasterBasics.findMany({
    where,
    orderBy: { id: "desc" },
    take: 300,
  });

  const dueReminders: Array<Record<string, unknown>> = [];
  const overdue: Array<Record<string, unknown>> = [];

  for (const basic of basics) {
    if (!basic.student_id || !basic.fee_due_date_end) continue;
    const info = await getOutstandingForBasic(basic.id);
    if (!info || info.outstanding <= 0) continue;

    const dueDate = startOfDay(basic.fee_due_date_end);
    const daysUntil = diffDays(today, dueDate);
    const billNo = String(basic.bill_no || `STMT-${basic.id}`);

    for (const daysBefore of config.settings.due_reminder.days_before) {
      if (daysUntil === daysBefore) {
        dueReminders.push({
          fee_master_basic_id: basic.id,
          student_id: basic.student_id,
          bill_no: billNo,
          due_date: toDateOnly(dueDate),
          days_before: daysBefore,
          outstanding: info.outstanding,
        });
      }
    }

    if (today > dueDate) {
      const calc = await computeLateFeeForBasic(basic, info.lines, rules);
      if (calc.payment_status === "Paid") continue;
      if (calc.payment_status === "Overdue" || calc.late_fee_amount > 0) {
        overdue.push({
          fee_master_basic_id: basic.id,
          student_id: basic.student_id,
          bill_no: billNo,
          due_date: toDateOnly(dueDate),
          outstanding: calc.outstanding_balance,
          late_fee: calc.late_fee_amount,
          total_outstanding: calc.total_outstanding_with_late,
          days_overdue: calc.days_overdue,
          payment_status: calc.payment_status,
          in_grace: calc.payment_status === "In Grace",
        });
      }
    }
  }

  return { due_reminders: dueReminders, overdue };
};

export const runDueDateReminders = async (params?: {
  branch_id?: number;
  dry_run?: boolean;
}) => {
  const { config } = await loadConfig();
  if (!config.settings.enabled || !config.settings.due_reminder.enabled) {
    return {
      processed: 0,
      sent: 0,
      pending: 0,
      skipped: 0,
      failed: 0,
      dry_run: !!params?.dry_run,
      results: [],
      message: "Due reminders are disabled in notification settings.",
    };
  }

  const today = startOfDay(new Date());
  const preview = await previewNotificationCandidates(params?.branch_id);
  const results: Array<Record<string, unknown>> = [];
  let sent = 0;
  let pending = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of preview.due_reminders) {
    const basicId = Number(candidate.fee_master_basic_id);
    const studentId = Number(candidate.student_id);
    const daysBefore = Number(candidate.days_before);
    const dueDate = String(candidate.due_date);
    const billNo = String(candidate.bill_no);
    const outstanding = num(candidate.outstanding);

    const { studentName, reg_no, walkin_reg_no, recipients } =
      await resolveStudentRecipients(studentId);
    const channels: FeeNotificationChannel[] = [];
    if (config.settings.due_reminder.channels.email) {
      channels.push(FEE_NOTIFICATION_CHANNELS.EMAIL);
    }
    if (config.settings.due_reminder.channels.sms) {
      channels.push(FEE_NOTIFICATION_CHANNELS.SMS);
    }

    if (!recipients.length || !channels.length) {
      const reason = !channels.length
        ? "No notification channel enabled"
        : "No recipient contact on file";
      if (params?.dry_run) {
        results.push({
          fee_master_basic_id: basicId,
          student_id: studentId,
          student_name: studentName,
          reg_no,
          walkin_reg_no,
          bill_no: billNo,
          due_date: dueDate,
          days_before: daysBefore,
          outstanding,
          status: "would_skip",
          reason,
        });
      } else {
        skipped += 1;
        results.push({
          fee_master_basic_id: basicId,
          student_id: studentId,
          student_name: studentName,
          status: FEE_NOTIFICATION_STATUS.SKIPPED,
          reason,
        });
      }
      continue;
    }

    for (const recipient of recipients) {
      for (const channel of channels) {
        const idempotencyKey = `${FEE_NOTIFICATION_TYPES.DUE_REMINDER}:${basicId}:${channel}:${daysBefore}:${dueDate}`;
        if (hasSent(config, idempotencyKey)) {
          skipped += 1;
          results.push({
            idempotency_key: idempotencyKey,
            fee_master_basic_id: basicId,
            student_id: studentId,
            student_name: studentName,
            reg_no,
            walkin_reg_no,
            bill_no: billNo,
            due_date: dueDate,
            days_before: daysBefore,
            outstanding,
            recipient: recipient.name,
            channel,
            status: "already_sent",
          });
          continue;
        }

        if (params?.dry_run) {
          results.push({
            idempotency_key: idempotencyKey,
            fee_master_basic_id: basicId,
            student_id: studentId,
            student_name: studentName,
            reg_no,
            walkin_reg_no,
            bill_no: billNo,
            due_date: dueDate,
            days_before: daysBefore,
            outstanding,
            recipient: recipient.name,
            recipient_email: recipient.email,
            recipient_phone: recipient.phone,
            recipient_role: recipient.role,
            channel,
            status: "would_send",
          });
          continue;
        }

        const subject = `Fee Due Reminder — ${billNo} (${daysBefore} day${daysBefore === 1 ? "" : "s"} remaining)`;
        const emailBody = buildDueReminderEmail({
          recipientName: recipient.name,
          studentName,
          billNo,
          dueDate,
          outstanding,
          daysBefore,
        });
        const smsBody = buildDueReminderSms({
          studentName,
          billNo,
          dueDate,
          outstanding,
          daysBefore,
        });

        const dispatch = await dispatchChannel({
          channel,
          recipient,
          subject,
          emailBody,
          smsBody,
          notificationType: FEE_NOTIFICATION_TYPES.DUE_REMINDER,
        });

        if (dispatch.status === FEE_NOTIFICATION_STATUS.SENT) sent += 1;
        else if (dispatch.status === FEE_NOTIFICATION_STATUS.PENDING) pending += 1;
        else if (dispatch.status === FEE_NOTIFICATION_STATUS.SKIPPED) skipped += 1;
        else if (dispatch.status === FEE_NOTIFICATION_STATUS.FAILED) failed += 1;

        await appendLogEntry(config, {
          idempotency_key: idempotencyKey,
          type: FEE_NOTIFICATION_TYPES.DUE_REMINDER,
          channel,
          status: dispatch.status,
          recipient:
            channel === FEE_NOTIFICATION_CHANNELS.EMAIL
              ? recipient.email || ""
              : recipient.phone || "",
          recipient_name: recipient.name,
          student_id: studentId,
          fee_master_basic_id: basicId,
          payment_collection_id: null,
          subject,
          failure_reason: dispatch.failure_reason,
          sent_at:
            dispatch.status === FEE_NOTIFICATION_STATUS.SENT
              ? new Date().toISOString()
              : null,
          metadata: {
            bill_no: billNo,
            due_date: dueDate,
            days_before: daysBefore,
            outstanding,
            reminder_date: toDateOnly(today),
          },
        });

        results.push({
          idempotency_key: idempotencyKey,
          fee_master_basic_id: basicId,
          student_id: studentId,
          student_name: studentName,
          reg_no,
          walkin_reg_no,
          bill_no: billNo,
          due_date: dueDate,
          days_before: daysBefore,
          outstanding,
          status: dispatch.status,
          channel,
          recipient: recipient.name,
          failure_reason: dispatch.failure_reason,
        });
      }
    }
  }

  return {
    processed: preview.due_reminders.length,
    sent,
    pending,
    skipped,
    failed,
    dry_run: !!params?.dry_run,
    results,
    message:
      preview.due_reminders.length === 0
        ? "No eligible due-reminder candidates found for the selected branch/settings."
        : undefined,
  };
};

export const runOverdueNotifications = async (params?: {
  branch_id?: number;
  dry_run?: boolean;
}) => {
  const { config } = await loadConfig();
  if (!config.settings.enabled || !config.settings.overdue.enabled) {
    return {
      processed: 0,
      sent: 0,
      pending: 0,
      skipped: 0,
      failed: 0,
      dry_run: !!params?.dry_run,
      results: [],
      message: "Overdue notifications are disabled in notification settings.",
    };
  }

  const today = toDateOnly(startOfDay(new Date()));
  const preview = await previewNotificationCandidates(params?.branch_id);
  const results: Array<Record<string, unknown>> = [];
  let sent = 0;
  let pending = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of preview.overdue) {
    const basicId = Number(candidate.fee_master_basic_id);
    const studentId = Number(candidate.student_id);
    const billNo = String(candidate.bill_no);
    const dueDate = String(candidate.due_date);
    const outstanding = num(candidate.outstanding);
    const lateFee = num(candidate.late_fee);
    const totalOutstanding = num(candidate.total_outstanding);
    const daysOverdue = Number(candidate.days_overdue || 0);
    const inGrace = candidate.in_grace === true;
    const displayLateFee = config.settings.overdue.include_late_fee ? lateFee : 0;
    const displayTotal = config.settings.overdue.include_late_fee
      ? totalOutstanding
      : outstanding;

    const { studentName, reg_no, walkin_reg_no, recipients } =
      await resolveStudentRecipients(studentId);
    const channels: FeeNotificationChannel[] = [];
    if (config.settings.overdue.channels.email) {
      channels.push(FEE_NOTIFICATION_CHANNELS.EMAIL);
    }
    if (config.settings.overdue.channels.sms) {
      channels.push(FEE_NOTIFICATION_CHANNELS.SMS);
    }

    if (!recipients.length || !channels.length) {
      const reason = !channels.length
        ? "No notification channel enabled"
        : "No recipient contact on file";
      if (params?.dry_run) {
        results.push({
          fee_master_basic_id: basicId,
          student_id: studentId,
          student_name: studentName,
          reg_no,
          walkin_reg_no,
          bill_no: billNo,
          due_date: dueDate,
          outstanding,
          late_fee: displayLateFee,
          total_outstanding: displayTotal,
          days_overdue: daysOverdue,
          in_grace: inGrace,
          status: "would_skip",
          reason,
        });
      } else {
        skipped += 1;
        results.push({
          fee_master_basic_id: basicId,
          student_id: studentId,
          student_name: studentName,
          status: FEE_NOTIFICATION_STATUS.SKIPPED,
          reason,
        });
      }
      continue;
    }

    for (const recipient of recipients) {
      for (const channel of channels) {
        const idempotencyKey = `${FEE_NOTIFICATION_TYPES.OVERDUE}:${basicId}:${channel}:${today}`;
        if (hasSent(config, idempotencyKey)) {
          skipped += 1;
          results.push({
            idempotency_key: idempotencyKey,
            fee_master_basic_id: basicId,
            student_id: studentId,
            student_name: studentName,
            reg_no,
            walkin_reg_no,
            bill_no: billNo,
            due_date: dueDate,
            outstanding,
            late_fee: displayLateFee,
            total_outstanding: displayTotal,
            days_overdue: daysOverdue,
            in_grace: inGrace,
            recipient: recipient.name,
            channel,
            status: "already_sent",
          });
          continue;
        }

        if (params?.dry_run) {
          results.push({
            idempotency_key: idempotencyKey,
            fee_master_basic_id: basicId,
            student_id: studentId,
            student_name: studentName,
            reg_no,
            walkin_reg_no,
            bill_no: billNo,
            due_date: dueDate,
            outstanding,
            late_fee: displayLateFee,
            total_outstanding: displayTotal,
            days_overdue: daysOverdue,
            in_grace: inGrace,
            recipient: recipient.name,
            recipient_email: recipient.email,
            recipient_phone: recipient.phone,
            recipient_role: recipient.role,
            channel,
            status: "would_send",
          });
          continue;
        }

        const subject = inGrace
          ? `Fee Grace Period Reminder — ${billNo}`
          : `Overdue Fee Notice — ${billNo}`;
        const emailBody = buildOverdueEmail({
          recipientName: recipient.name,
          studentName,
          billNo,
          dueDate,
          outstanding,
          lateFee: displayLateFee,
          totalOutstanding: displayTotal,
          daysOverdue,
          inGrace,
          graceDaysRemaining: inGrace ? daysOverdue : undefined,
        });
        const smsBody = buildOverdueSms({
          studentName,
          billNo,
          totalOutstanding: displayTotal,
          daysOverdue,
        });

        const dispatch = await dispatchChannel({
          channel,
          recipient,
          subject,
          emailBody,
          smsBody,
          notificationType: FEE_NOTIFICATION_TYPES.OVERDUE,
        });

        if (dispatch.status === FEE_NOTIFICATION_STATUS.SENT) sent += 1;
        else if (dispatch.status === FEE_NOTIFICATION_STATUS.PENDING) pending += 1;
        else if (dispatch.status === FEE_NOTIFICATION_STATUS.SKIPPED) skipped += 1;
        else if (dispatch.status === FEE_NOTIFICATION_STATUS.FAILED) failed += 1;

        await appendLogEntry(config, {
          idempotency_key: idempotencyKey,
          type: FEE_NOTIFICATION_TYPES.OVERDUE,
          channel,
          status: dispatch.status,
          recipient:
            channel === FEE_NOTIFICATION_CHANNELS.EMAIL
              ? recipient.email || ""
              : recipient.phone || "",
          recipient_name: recipient.name,
          student_id: studentId,
          fee_master_basic_id: basicId,
          payment_collection_id: null,
          subject,
          failure_reason: dispatch.failure_reason,
          sent_at:
            dispatch.status === FEE_NOTIFICATION_STATUS.SENT
              ? new Date().toISOString()
              : null,
          metadata: {
            bill_no: billNo,
            due_date: dueDate,
            outstanding,
            late_fee: lateFee,
            total_outstanding: totalOutstanding,
            days_overdue: daysOverdue,
            in_grace: inGrace,
          },
        });

        results.push({
          idempotency_key: idempotencyKey,
          fee_master_basic_id: basicId,
          student_id: studentId,
          student_name: studentName,
          reg_no,
          walkin_reg_no,
          bill_no: billNo,
          due_date: dueDate,
          outstanding,
          late_fee: displayLateFee,
          total_outstanding: displayTotal,
          days_overdue: daysOverdue,
          in_grace: inGrace,
          status: dispatch.status,
          channel,
          recipient: recipient.name,
          failure_reason: dispatch.failure_reason,
        });
      }
    }
  }

  return {
    processed: preview.overdue.length,
    sent,
    pending,
    skipped,
    failed,
    dry_run: !!params?.dry_run,
    results,
    message:
      preview.overdue.length === 0
        ? "No eligible overdue candidates found for the selected branch/settings."
        : undefined,
  };
};

export type PaymentConfirmationInput = {
  student_id: number;
  fee_master_basic_id: number;
  collection_id: number;
  voucher_sequence: string;
  bill_no: string;
  amount: number;
  payment_mode: string;
  paid_date: string;
  reference_no?: string | null;
  outstanding_after: number;
  late_fee_paid?: number;
};

/** Triggered from Module 3 after successful payment — idempotent per collection + channel */
export const sendPaymentConfirmationNotification = async (
  input: PaymentConfirmationInput
) => {
  const { config } = await loadConfig();
  if (!config.settings.enabled || !config.settings.payment_confirmation.enabled) {
    return {
      triggered: false,
      reason: "Payment confirmation notifications disabled",
      results: [],
    };
  }

  const { studentName, recipients } = await resolveStudentRecipients(input.student_id);
  const receiptNo = `RCP-${input.bill_no}`;
  const channels: FeeNotificationChannel[] = [];
  if (config.settings.payment_confirmation.channels.email) {
    channels.push(FEE_NOTIFICATION_CHANNELS.EMAIL);
  }
  if (config.settings.payment_confirmation.channels.sms) {
    channels.push(FEE_NOTIFICATION_CHANNELS.SMS);
  }

  const results: Array<Record<string, unknown>> = [];

  for (const recipient of recipients) {
    for (const channel of channels) {
      const idempotencyKey = `${FEE_NOTIFICATION_TYPES.PAYMENT_CONFIRM}:${input.collection_id}:${channel}:${recipient.role}`;
      if (hasSent(config, idempotencyKey)) {
        results.push({ idempotency_key: idempotencyKey, status: "already_sent" });
        continue;
      }

      const subject = `Payment Confirmation — ${input.bill_no}`;
      const emailBody = buildPaymentConfirmationEmail({
        recipientName: recipient.name,
        studentName,
        billNo: input.bill_no,
        receiptNo,
        amount: input.amount,
        paymentMode: input.payment_mode,
        paidDate: input.paid_date,
        referenceNo: input.reference_no,
        outstandingAfter: input.outstanding_after,
        lateFeePaid: input.late_fee_paid,
      });
      const smsBody = buildPaymentConfirmationSms({
        studentName,
        billNo: input.bill_no,
        amount: input.amount,
        paidDate: input.paid_date,
      });

      const dispatch = await dispatchChannel({
        channel,
        recipient,
        subject,
        emailBody,
        smsBody,
        notificationType: FEE_NOTIFICATION_TYPES.PAYMENT_CONFIRM,
      });

      await appendLogEntry(config, {
        idempotency_key: idempotencyKey,
        type: FEE_NOTIFICATION_TYPES.PAYMENT_CONFIRM,
        channel,
        status: dispatch.status,
        recipient:
          channel === FEE_NOTIFICATION_CHANNELS.EMAIL
            ? recipient.email || ""
            : recipient.phone || "",
        recipient_name: recipient.name,
        student_id: input.student_id,
        fee_master_basic_id: input.fee_master_basic_id,
        payment_collection_id: input.collection_id,
        subject,
        failure_reason: dispatch.failure_reason,
        sent_at:
          dispatch.status === FEE_NOTIFICATION_STATUS.SENT
            ? new Date().toISOString()
            : null,
        metadata: {
          bill_no: input.bill_no,
          voucher_sequence: input.voucher_sequence,
          amount: input.amount,
          payment_mode: input.payment_mode,
          paid_date: input.paid_date,
          outstanding_after: input.outstanding_after,
        },
      });

      results.push({
        idempotency_key: idempotencyKey,
        channel,
        status: dispatch.status,
        recipient: recipient.name,
        delivery: dispatch.delivery,
      });
    }
  }

  const emailResult = results.find((r) => r.channel === FEE_NOTIFICATION_CHANNELS.EMAIL);

  return {
    triggered: true,
    results,
    email: emailResult?.delivery || null,
  };
};

export const previewNotificationCandidatesPublic = async (branchId?: number) =>
  previewNotificationCandidates(branchId);
