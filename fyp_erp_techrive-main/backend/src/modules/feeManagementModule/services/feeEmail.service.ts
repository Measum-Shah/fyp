import { prisma } from "../../../config/db";

/**
 * Email receipt workflow for Module 3.
 *
 * Connection point:
 * - Reads SMTP config from existing table `email_settings`
 *   (driver, host, port, user_name, password, encryption, status)
 * - When status=1 and host/user are set, this service is ready to send.
 * - Install/configure a mailer (e.g. nodemailer) against those fields,
 *   or set env SMTP_* as optional override without schema changes.
 *
 * If email is not configured, payments still succeed; this returns a
 * structured "queued: false" payload documenting the gap.
 */
export type ReceiptEmailPayload = {
  to: string;
  studentName: string;
  billNo: string;
  receiptNo: string;
  amount: number;
  paymentMode: string;
  paidDate: string;
  outstandingAfter: number;
};

export const getEmailConfigStatus = async () => {
  const settings = await prisma.emailSettings.findFirst({
    where: { status: 1 },
    orderBy: { id: "desc" },
  });

  const envHost = process.env.SMTP_HOST;
  const envUser = process.env.SMTP_USER;

  const configured = !!(
    (settings?.host && settings?.user_name) ||
    (envHost && envUser)
  );

  return {
    configured,
    source: settings?.host
      ? "email_settings"
      : envHost
        ? "environment"
        : "none",
    connect_at:
      "backend/src/modules/feeManagementModule/services/feeEmail.service.ts → sendPaymentReceiptEmail()",
    table: "email_settings",
    required_fields: [
      "driver",
      "host",
      "port",
      "user_name",
      "password",
      "encryption",
      "status=1",
    ],
    optional_env: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"],
    settings_present: !!settings,
  };
};

export const sendPaymentReceiptEmail = async (payload: ReceiptEmailPayload) => {
  const status = await getEmailConfigStatus();

  if (!status.configured) {
    console.info(
      "[FeeEmail] Receipt email skipped — configure email_settings or SMTP_* env.",
      {
        to: payload.to,
        billNo: payload.billNo,
        amount: payload.amount,
      }
    );
    return {
      queued: false,
      sent: false,
      reason: "EMAIL_NOT_CONFIGURED",
      documentation: status,
      preview: {
        subject: `Fee Payment Receipt ${payload.receiptNo}`,
        to: payload.to,
        body: buildReceiptEmailBody(payload),
      },
    };
  }

  // Integration hook: replace this block with nodemailer / SES / SendGrid
  // using values from email_settings (or SMTP_* env overrides).
  const settings = await prisma.emailSettings.findFirst({
    where: { status: 1 },
    orderBy: { id: "desc" },
  });

  const mailConfig = {
    host: process.env.SMTP_HOST || settings?.host,
    port: process.env.SMTP_PORT || settings?.port,
    user: process.env.SMTP_USER || settings?.user_name,
    pass: process.env.SMTP_PASS || settings?.password,
    encryption: process.env.SMTP_ENCRYPTION || settings?.encryption,
    from:
      process.env.SMTP_FROM ||
      settings?.user_name ||
      "noreply@techrive.edu.pk",
  };

  console.info("[FeeEmail] Ready to send via configured transport", {
    host: mailConfig.host,
    port: mailConfig.port,
    to: payload.to,
    billNo: payload.billNo,
  });

  // Without a mail transport package wired in this environment, we log the
  // prepared message and mark as queued for the configured provider.
  return {
    queued: true,
    sent: false,
    reason: "TRANSPORT_READY_AWAITING_PROVIDER_SEND",
    documentation: status,
    mail_config_host: mailConfig.host,
    preview: {
      subject: `Fee Payment Receipt ${payload.receiptNo}`,
      to: payload.to,
      from: mailConfig.from,
      body: buildReceiptEmailBody(payload),
    },
  };
};

const buildReceiptEmailBody = (p: ReceiptEmailPayload) =>
  [
    `Dear ${p.studentName},`,
    ``,
    `We have received your fee payment.`,
    ``,
    `Receipt No: ${p.receiptNo}`,
    `Invoice / Bill No: ${p.billNo}`,
    `Amount Paid: PKR ${p.amount.toLocaleString()}`,
    `Payment Mode: ${p.paymentMode}`,
    `Paid Date: ${p.paidDate}`,
    `Outstanding Balance After Payment: PKR ${p.outstandingAfter.toLocaleString()}`,
    ``,
    `Thank you,`,
    `TechRive ERP — Fee Management`,
  ].join("\n");

export type FeeNotificationEmailPayload = {
  to: string;
  subject: string;
  body: string;
  notification_type: string;
};

/** Generic fee notification email — used by Module 6 alerts */
export const sendFeeNotificationEmail = async (payload: FeeNotificationEmailPayload) => {
  const status = await getEmailConfigStatus();

  if (!status.configured) {
    console.info(
      "[FeeEmail] Notification email skipped — configure email_settings or SMTP_* env.",
      { to: payload.to, type: payload.notification_type }
    );
    return {
      queued: false,
      sent: false,
      reason: "EMAIL_NOT_CONFIGURED",
      documentation: status,
      preview: {
        subject: payload.subject,
        to: payload.to,
        body: payload.body,
      },
    };
  }

  const settings = await prisma.emailSettings.findFirst({
    where: { status: 1 },
    orderBy: { id: "desc" },
  });

  const mailConfig = {
    host: process.env.SMTP_HOST || settings?.host,
    port: process.env.SMTP_PORT || settings?.port,
    user: process.env.SMTP_USER || settings?.user_name,
    pass: process.env.SMTP_PASS || settings?.password,
    encryption: process.env.SMTP_ENCRYPTION || settings?.encryption,
    from:
      process.env.SMTP_FROM ||
      settings?.user_name ||
      "noreply@techrive.edu.pk",
  };

  console.info("[FeeEmail] Ready to send notification via configured transport", {
    host: mailConfig.host,
    to: payload.to,
    type: payload.notification_type,
  });

  return {
    queued: true,
    sent: false,
    reason: "TRANSPORT_READY_AWAITING_PROVIDER_SEND",
    documentation: status,
    mail_config_host: mailConfig.host,
    preview: {
      subject: payload.subject,
      to: payload.to,
      from: mailConfig.from,
      body: payload.body,
    },
  };
};

export const buildDueReminderEmail = (p: {
  recipientName: string;
  studentName: string;
  billNo: string;
  dueDate: string;
  outstanding: number;
  daysBefore: number;
}) =>
  [
    `Dear ${p.recipientName},`,
    ``,
    `This is a friendly reminder that a fee payment is due in ${p.daysBefore} day(s).`,
    ``,
    `Student: ${p.studentName}`,
    `Invoice / Bill No: ${p.billNo}`,
    `Due Date: ${p.dueDate}`,
    `Outstanding Amount: PKR ${p.outstanding.toLocaleString()}`,
    ``,
    `Please ensure payment is made before the due date to avoid late fees.`,
    ``,
    `Thank you,`,
    `TechRive ERP — Fee Management`,
  ].join("\n");

export const buildPaymentConfirmationEmail = (p: {
  recipientName: string;
  studentName: string;
  billNo: string;
  receiptNo: string;
  amount: number;
  paymentMode: string;
  paidDate: string;
  referenceNo?: string | null;
  outstandingAfter: number;
  lateFeePaid?: number;
}) =>
  [
    `Dear ${p.recipientName},`,
    ``,
    `We confirm receipt of your fee payment.`,
    ``,
    `Student: ${p.studentName}`,
    `Receipt No: ${p.receiptNo}`,
    `Invoice / Bill No: ${p.billNo}`,
    `Amount Paid: PKR ${p.amount.toLocaleString()}`,
    p.lateFeePaid && p.lateFeePaid > 0
      ? `Late Fee Portion: PKR ${p.lateFeePaid.toLocaleString()}`
      : null,
    `Payment Mode: ${p.paymentMode}`,
    `Payment Date: ${p.paidDate}`,
    p.referenceNo ? `Reference No: ${p.referenceNo}` : null,
    `Remaining Outstanding: PKR ${p.outstandingAfter.toLocaleString()}`,
    ``,
    `Thank you,`,
    `TechRive ERP — Fee Management`,
  ]
    .filter(Boolean)
    .join("\n");

export const buildOverdueEmail = (p: {
  recipientName: string;
  studentName: string;
  billNo: string;
  dueDate: string;
  outstanding: number;
  lateFee: number;
  totalOutstanding: number;
  daysOverdue: number;
  inGrace: boolean;
  graceDaysRemaining?: number;
}) =>
  [
    `Dear ${p.recipientName},`,
    ``,
    p.inGrace
      ? `This fee is currently in the grace period but remains unpaid.`
      : `This is to notify you that a fee payment is overdue.`,
    ``,
    `Student: ${p.studentName}`,
    `Invoice / Bill No: ${p.billNo}`,
    `Original Due Date: ${p.dueDate}`,
    p.inGrace && p.graceDaysRemaining !== undefined
      ? `Grace Period Days Remaining: ${p.graceDaysRemaining}`
      : `Days Overdue: ${p.daysOverdue}`,
    `Outstanding Amount: PKR ${p.outstanding.toLocaleString()}`,
    p.lateFee > 0 ? `Late Fee Applied: PKR ${p.lateFee.toLocaleString()}` : null,
    `Total Amount Due: PKR ${p.totalOutstanding.toLocaleString()}`,
    ``,
    `Please arrange payment at your earliest convenience.`,
    ``,
    `Thank you,`,
    `TechRive ERP — Fee Management`,
  ]
    .filter(Boolean)
    .join("\n");

export const buildDueReminderSms = (p: {
  studentName: string;
  billNo: string;
  dueDate: string;
  outstanding: number;
  daysBefore: number;
}) =>
  `Fee reminder: ${p.studentName}, bill ${p.billNo} due ${p.dueDate} in ${p.daysBefore}d. Outstanding PKR ${p.outstanding.toLocaleString()}. - TechRive ERP`;

export const buildPaymentConfirmationSms = (p: {
  studentName: string;
  billNo: string;
  amount: number;
  paidDate: string;
}) =>
  `Payment received: PKR ${p.amount.toLocaleString()} for ${p.studentName} (${p.billNo}) on ${p.paidDate}. - TechRive ERP`;

export const buildOverdueSms = (p: {
  studentName: string;
  billNo: string;
  totalOutstanding: number;
  daysOverdue: number;
}) =>
  `Overdue fee: ${p.studentName}, bill ${p.billNo}, ${p.daysOverdue}d overdue. Total due PKR ${p.totalOutstanding.toLocaleString()}. - TechRive ERP`;

