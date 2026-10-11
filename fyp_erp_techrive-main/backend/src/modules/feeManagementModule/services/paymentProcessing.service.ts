import { prisma } from "../../../config/db";
import { postJournalEntry } from "../../accountsModule/services/posting.service";
import { AppError } from "../utils/fee.helpers";
import {
  getStudentFeeDashboard,
  getInvoiceView,
  getReceiptView,
  recordPayment,
} from "./studentFeeRecord.service";
import { sendPaymentReceiptEmail, getEmailConfigStatus } from "./feeEmail.service";
import { sendPaymentConfirmationNotification } from "./feeNotification.service";
import type { PaymentMode } from "../validators/payment.validators";

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const ONLINE_MODES = new Set(["Stripe", "PayPal"]);

/** Encode gateway lifecycle in existing account_no column (no schema change) */
const encodeGatewayState = (
  mode: string,
  state: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED",
  ref?: string | null
) => `${mode}|${state}${ref ? `|${ref}` : ""}`;

const parseGatewayState = (accountNo: string) => {
  const [mode, state, ref] = accountNo.split("|");
  return { mode, state, ref: ref || null };
};

export const listPaymentMethods = async () => {
  const methods = await prisma.paymentMethods.findMany({
    where: { deleted_at: null },
    orderBy: { id: "asc" },
  });
  return methods;
};

export const listPaymentSettings = async () => {
  const settings = await prisma.paymentSettings.findMany({
    where: { status: 1 },
    orderBy: { id: "asc" },
  });
  return settings
    .filter((s) => s.identity !== "LATE_FEE" && s.identity !== "FEE_NOTIF")
    .map((s) => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(s.config || "{}");
    } catch {
      parsed = { raw: s.config };
    }
    // Never expose secret keys to client — only public / mode flags
    return {
      id: s.id,
      identity: s.identity,
      logo: s.logo,
      link: s.link,
      status: s.status,
      mode: parsed.mode || "sandbox",
      public_key: parsed.public_key || parsed.publishableKey || null,
      sandbox: parsed.mode !== "live",
    };
  });
};

export const getPaymentWorkspace = async (studentId: number) => {
  const dashboard = await getStudentFeeDashboard(studentId);
  const [methods, gatewaySettings, collections, onlineTxns, emailStatus] =
    await Promise.all([
      listPaymentMethods(),
      listPaymentSettings(),
      prisma.feeCollections.findMany({
        where: { students_id: studentId, active_status: 1 },
        orderBy: { id: "desc" },
        take: 50,
      }),
      prisma.apiPaymentTransaction.findMany({
        where: {
          OR: [
            // bill numbers from this student's statements
            {
              bill_no: {
                in: dashboard.statements
                  .map((s) => String(s.bill_no || `STMT-${s.id}`))
                  .filter(Boolean),
              },
            },
            { email: dashboard.student.email || "__none__" },
          ],
        },
        orderBy: { id: "desc" },
        take: 50,
      }),
      getEmailConfigStatus(),
    ]);

  const invoices = await Promise.all(
    dashboard.statements.map(async (s) => {
      try {
        return await getInvoiceView(s.id);
      } catch {
        return null;
      }
    })
  );

  const receipts = [];
  for (const s of dashboard.statements) {
    try {
      receipts.push(await getReceiptView(s.id));
    } catch {
      // no payments yet on this statement
    }
  }

  return {
    dashboard,
    payment_methods: methods,
    gateway_settings: gatewaySettings,
    payment_transactions: collections.map((c) => ({
      id: c.id,
      bill_no: c.bill_no,
      paid_amount: c.paid_amount,
      total_amount: c.total_amount,
      balance: c.balance,
      payment_mode: c.payment_mode,
      paid_date: c.paid_date,
      note: c.note,
      fee_status: c.fee_status,
      all_paid: c.all_paid,
      cancel_voucher: c.cancel_voucher,
      voucher_sequence: c.voucher_sequence,
      reference_number: c.reference_number,
      receipt_image_path: c.receipt_image_path,
      created_at: c.created_at,
    })),
    online_transactions: onlineTxns.map((t) => ({
      ...t,
      gateway: parseGatewayState(t.account_no),
    })),
    invoices: invoices.filter(Boolean),
    receipts,
    email_status: emailStatus,
  };
};

type ProcessInput = {
  student_id: number;
  fee_master_basic_id: number;
  amount: number;
  payment_mode: PaymentMode;
  fee_masters_id?: number;
  note?: string | null;
  reference_no?: string | null;
  paid_date?: string | null;
  receipt_image_path?: string | null;
  /** When completing an online sandbox payment */
  online_transaction_number?: string;
  gateway_reference?: string | null;
};

export const processPayment = async (data: ProcessInput, userId: number) => {
  if (ONLINE_MODES.has(data.payment_mode) && !data.online_transaction_number) {
    throw new AppError(
      "Online payments must be started with initiateOnlinePayment, then completed via sandbox confirmation"
    );
  }

  const basic = await prisma.feeMasterBasics.findUnique({
    where: { id: data.fee_master_basic_id },
  });
  if (!basic) throw new AppError("Invoice / fee statement not found", 404);
  if (basic.student_id !== data.student_id) {
    throw new AppError("Fee statement does not belong to the selected student");
  }

  const before = await getStudentFeeDashboard(data.student_id);
  const statement = before.statements.find((s) => s.id === basic.id);
  if (!statement) throw new AppError("Statement not found for student", 404);

  const outstanding = num(statement.balance);
  const lateFeeAmount = num(statement.late_fee?.late_fee_amount);
  const maxPayable = outstanding + lateFeeAmount;

  if (outstanding <= 0 && lateFeeAmount <= 0) {
    throw new AppError("This invoice is already fully paid");
  }
  if (data.amount > maxPayable + 0.009) {
    throw new AppError(
      `Overpayment not allowed. Maximum payable (including late fee) is ${maxPayable.toFixed(2)}`
    );
  }

  const principalPayment = Math.min(data.amount, outstanding);
  const finePayment = Math.min(
    Math.max(0, data.amount - principalPayment),
    lateFeeAmount
  );

  // 1) Apply payment to fee_masters (Module 2 core)
  if (principalPayment > 0) {
    await recordPayment(
      {
        fee_master_basic_id: data.fee_master_basic_id,
        fee_masters_id: data.fee_masters_id,
        amount: principalPayment,
        note:
          data.note ||
          `${data.payment_mode} payment${data.reference_no ? ` ref ${data.reference_no}` : ""}`,
      },
      userId
    );
  }

  const after = await getStudentFeeDashboard(data.student_id);
  const updatedStatement = after.statements.find((s) => s.id === basic.id)!;
  const billNo = String(basic.bill_no || `STMT-${basic.id}`);
  const paidDate =
    data.paid_date?.slice(0, 10) || new Date().toISOString().slice(0, 10);

  const firstLine = await prisma.feeMasters.findFirst({
    where: { fee_master_basic_id_fk: basic.id },
    orderBy: { id: "asc" },
  });

  const voucherSequence = `PAY-${Date.now()}-${basic.id}`;
  const isFull = updatedStatement.balance <= 0.009;
  // fee_status: 1 = Voucher created but not paid completely (unpaid), 2 = Partially paid, 3 = Fully paid
  const feeStatus = isFull ? 3 : data.amount > 0 ? 2 : 1;

  // 2) Persist payment transaction in fee_collections
  const collection = await prisma.feeCollections.create({
    data: {
      branch_id: basic.branch_id || after.student.branch_id || 1,
      session_id: basic.session_id || after.student.session_id || null,
      students_id: data.student_id,
      fee_masters_id: data.fee_masters_id || firstLine?.id || 0,
      fee_structure_code: basic.fee_structure_code,
      bill_no: billNo,
      fee_term_id: String(basic.installment_id || 0),
      due_date: basic.fee_due_date_end,
      paid_date: paidDate,
      paid_amount: data.amount,
      post_date: new Date(paidDate),
      discount: num(basic.discount_fee),
      discount_type: basic.discount_type,
      fine: finePayment,
      tax_percentage: 0,
      total_amount: Math.round(updatedStatement.due_amount),
      payment_mode: data.payment_mode,
      note: (data.note || data.reference_no || data.payment_mode).slice(0, 100),
      fee_status: feeStatus,
      balance: updatedStatement.balance,
      all_paid: isFull ? 1 : 0,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
      voucher_sequence: voucherSequence,
      validity_date: basic.fee_due_date_end,
      tax_deduction: 0,
      intake_id: basic.intake_id || 0,
      board_id: basic.board_id,
      class_id: basic.class_id,
      program_id: basic.program_id || after.student.program_id || 0,
      other_tax: 0,
      overall_remarks: `Module3 ${data.payment_mode}`,
      active_status: 1,
      cancel_voucher: "No",
      voucher_type: isFull ? "Full Payment" : "Partial Payment",
      tax_amount: 0,
      installment_allow: 1,
      reference_number: data.reference_no || null,
      receipt_image_path: data.receipt_image_path || null,
    },
  });

  // 3) Collection detail line
  await prisma.feeCollectionDetail.create({
    data: {
      fc_id: collection.id,
      branch_id: collection.branch_id,
      board_id: basic.board_id || 0,
      program_id: collection.program_id,
      student_id: data.student_id,
      class_id: basic.class_id,
      intake_id: basic.intake_id || 0,
      session_id: basic.session_id || after.student.session_id || 0,
      bill_id: basic.id,
      fee_head_id: null,
      fee_term_id: basic.installment_id || 0,
      amount: data.amount,
      remarks: `${data.payment_mode} · ${voucherSequence}${
        data.reference_no ? ` · ${data.reference_no}` : ""
      }`,
      created_at: new Date(),
      arreas: 0,
    },
  });

  // 3b) Double-Entry GL Posting trigger
  try {
    const cashAccount =
      (await prisma.accAccount.findFirst({ where: { code: "1010" } })) ||
      (await prisma.accAccount.findFirst({ where: { type: "ASSET" } }));
    const revenueAccount =
      (await prisma.accAccount.findFirst({ where: { code: "4010" } })) ||
      (await prisma.accAccount.findFirst({ where: { type: "REVENUE" } }));

    if (cashAccount && revenueAccount && data.amount > 0) {
      const isBank = (data.payment_mode || "").toUpperCase().includes("BANK") || (data.payment_mode || "").toUpperCase().includes("ONLINE");
      await postJournalEntry({
        sourceModule: "FEE",
        sourceReferenceType: "FEE_COLLECTION",
        sourceReferenceId: collection.id,
        voucherType: isBank ? "BRV" : "CRV",
        narration: `Fee Collection (Bill #${billNo}) - Student ID #${data.student_id}`,
        lines: [
          { account_id: cashAccount.id, debit: data.amount, credit: 0, description: `Cash/Bank Fee Receipt (${data.payment_mode})` },
          { account_id: revenueAccount.id, debit: 0, credit: data.amount, description: `Fee Revenue Income` },
        ],
        autoPost: true,
      });
    }
  } catch (glErr) {
    console.error("GL Posting Trigger Failed (Fee Collection):", glErr);
  }

  // 4) Online gateway ledger update (api_payment_transaction)
  let onlineTxn = null;
  if (data.online_transaction_number) {
    onlineTxn = await prisma.apiPaymentTransaction.findFirst({
      where: { transaction_number: data.online_transaction_number },
    });
    if (onlineTxn) {
      onlineTxn = await prisma.apiPaymentTransaction.update({
        where: { id: onlineTxn.id },
        data: {
          account_no: encodeGatewayState(
            data.payment_mode,
            "SUCCESS",
            data.gateway_reference || data.online_transaction_number
          ),
          amount: String(data.amount),
          paid_date: new Date(paidDate),
          updated_at: new Date(),
        },
      });
    }
  } else if (ONLINE_MODES.has(data.payment_mode)) {
    // Should not reach here without txn number
  } else {
    // Offline modes also logged lightly for audit trail
    onlineTxn = await prisma.apiPaymentTransaction.create({
      data: {
        transaction_number: voucherSequence,
        bill_no: billNo,
        amount: String(data.amount),
        paid_date: new Date(paidDate),
        account_no: encodeGatewayState(
          data.payment_mode,
          "SUCCESS",
          data.reference_no
        ),
        email: after.student.email || "noreply@techrive.edu.pk",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  const invoice = await getInvoiceView(basic.id);
  let receipt = null;
  try {
    receipt = await getReceiptView(basic.id);
  } catch {
    receipt = null;
  }

  let emailResult = null;
  let notificationResult = null;
  try {
    notificationResult = await sendPaymentConfirmationNotification({
      student_id: data.student_id,
      fee_master_basic_id: basic.id,
      collection_id: collection.id,
      voucher_sequence: voucherSequence,
      bill_no: billNo,
      amount: data.amount,
      payment_mode: data.payment_mode,
      paid_date: paidDate,
      reference_no: data.reference_no,
      outstanding_after: updatedStatement.balance,
      late_fee_paid: finePayment,
    });
    emailResult = notificationResult.email;
  } catch (err) {
    console.error("[FeeNotification] Payment confirmation notification failed:", err);
  }

  // Legacy receipt email hook retained for online modes when notification email unavailable
  if (!emailResult && ONLINE_MODES.has(data.payment_mode) && after.student.email) {
    emailResult = await sendPaymentReceiptEmail({
      to: after.student.email,
      studentName: after.student.name,
      billNo,
      receiptNo: `RCP-${billNo}`,
      amount: data.amount,
      paymentMode: data.payment_mode,
      paidDate,
      outstandingAfter: updatedStatement.balance,
    });
  }

  return {
    payment: {
      collection_id: collection.id,
      voucher_sequence: voucherSequence,
      bill_no: billNo,
      amount: data.amount,
      payment_mode: data.payment_mode,
      paid_date: paidDate,
      remaining_balance: updatedStatement.balance,
      payment_status: isFull ? "Paid" : "Partially Paid",
      invoice_status: updatedStatement.statement_status,
    },
    online_transaction: onlineTxn,
    dashboard: after,
    invoice,
    receipt,
    email: emailResult,
    notifications: notificationResult,
  };
};

export const initiateOnlinePayment = async (
  data: {
    student_id: number;
    fee_master_basic_id: number;
    amount: number;
    payment_mode: "Stripe" | "PayPal";
    fee_masters_id?: number;
    return_url?: string;
    cancel_url?: string;
  },
  _userId: number
) => {
  const basic = await prisma.feeMasterBasics.findUnique({
    where: { id: data.fee_master_basic_id },
  });
  if (!basic) throw new AppError("Invoice not found", 404);
  if (basic.student_id !== data.student_id) {
    throw new AppError("Invoice does not belong to selected student");
  }

  const dash = await getStudentFeeDashboard(data.student_id);
  const statement = dash.statements.find((s) => s.id === basic.id);
  if (!statement) throw new AppError("Statement not found", 404);
  if (data.amount > num(statement.balance) + 0.009) {
    throw new AppError(
      `Overpayment not allowed. Outstanding is ${num(statement.balance).toFixed(2)}`
    );
  }
  if (num(statement.balance) <= 0) {
    throw new AppError("Invoice already fully paid");
  }

  const settings = await prisma.paymentSettings.findFirst({
    where: {
      status: 1,
      identity: { equals: data.payment_mode.slice(0, 15) },
    },
  });

  let config: Record<string, unknown> = { mode: "sandbox" };
  if (settings?.config) {
    try {
      config = JSON.parse(settings.config);
    } catch {
      config = { mode: "sandbox" };
    }
  }

  const billNo = String(basic.bill_no || `STMT-${basic.id}`);
  const txnNumber = `${data.payment_mode.toUpperCase()}-SBX-${Date.now()}-${basic.id}`;

  const txn = await prisma.apiPaymentTransaction.create({
    data: {
      transaction_number: txnNumber,
      bill_no: billNo,
      amount: String(data.amount),
      paid_date: new Date(),
      account_no: encodeGatewayState(data.payment_mode, "PENDING"),
      email: dash.student.email || "noreply@techrive.edu.pk",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return {
    sandbox: true,
    provider: data.payment_mode,
    transaction_number: txn.transaction_number,
    transaction_id: txn.id,
    bill_no: billNo,
    amount: data.amount,
    fee_master_basic_id: basic.id,
    student_id: data.student_id,
    fee_masters_id: data.fee_masters_id || null,
    public_key: config.public_key || config.publishableKey || null,
    checkout: {
      // Simulated sandbox checkout session — frontend completes via confirm endpoint
      session_id: txnNumber,
      mode: "sandbox",
      approve_url: data.return_url || null,
      cancel_url: data.cancel_url || null,
      instructions:
        data.payment_mode === "Stripe"
          ? "Stripe Sandbox: confirm success/fail/cancel in the ERP sandbox panel (no live charges)."
          : "PayPal Sandbox: confirm success/fail/cancel in the ERP sandbox panel (no live charges).",
    },
    gateway_settings_id: settings?.id || null,
  };
};

export const completeOnlinePayment = async (
  data: {
    transaction_number: string;
    status: "success" | "failed" | "cancelled";
    gateway_reference?: string | null;
  },
  userId: number
) => {
  const txn = await prisma.apiPaymentTransaction.findFirst({
    where: { transaction_number: data.transaction_number },
  });
  if (!txn) throw new AppError("Online payment transaction not found", 404);

  const parsed = parseGatewayState(txn.account_no);
  if (parsed.state === "SUCCESS") {
    throw new AppError("This online payment was already completed successfully");
  }
  if (parsed.state === "FAILED" || parsed.state === "CANCELLED") {
    throw new AppError(`This online payment is already marked as ${parsed.state}`);
  }

  const mode = (parsed.mode || "Stripe") as PaymentMode;
  if (!ONLINE_MODES.has(mode)) {
    throw new AppError("Transaction is not an online sandbox payment");
  }

  if (data.status === "failed" || data.status === "cancelled") {
    const state = data.status === "failed" ? "FAILED" : "CANCELLED";
    const updated = await prisma.apiPaymentTransaction.update({
      where: { id: txn.id },
      data: {
        account_no: encodeGatewayState(
          mode,
          state,
          data.gateway_reference || txn.transaction_number
        ),
        updated_at: new Date(),
      },
    });
    return {
      status: data.status,
      payment_recorded: false,
      online_transaction: {
        ...updated,
        gateway: parseGatewayState(updated.account_no),
      },
      message:
        data.status === "cancelled"
          ? "Online payment cancelled. No dues were updated."
          : "Online payment failed. No dues were updated.",
    };
  }

  // success — find statement by bill_no
  const billNo = txn.bill_no;
  const basic =
    (await prisma.feeMasterBasics.findFirst({
      where: { bill_no: billNo },
    })) ||
    (await prisma.feeMasterBasics.findFirst({
      where: {
        id: Number(String(billNo).replace(/\D/g, "")) || -1,
      },
    }));

  if (!basic?.student_id) {
    throw new AppError("Unable to resolve invoice for this online payment", 404);
  }

  const result = await processPayment(
    {
      student_id: basic.student_id,
      fee_master_basic_id: basic.id,
      amount: num(txn.amount),
      payment_mode: mode,
      note: `${mode} Sandbox payment`,
      online_transaction_number: txn.transaction_number,
      gateway_reference: data.gateway_reference,
    },
    userId
  );

  return {
    status: "success",
    payment_recorded: true,
    ...result,
  };
};

export const listStudentPaymentHistory = async (studentId: number) => {
  const collections = await prisma.feeCollections.findMany({
    where: { students_id: studentId },
    orderBy: { id: "desc" },
    take: 100,
  });
  const details = await prisma.feeCollectionDetail.findMany({
    where: { student_id: studentId },
    orderBy: { id: "desc" },
    take: 100,
  });
  return { collections, details };
};
