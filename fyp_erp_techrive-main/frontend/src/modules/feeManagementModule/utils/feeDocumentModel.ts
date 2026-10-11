/**
 * Fee Management document model (Invoice / Receipt).
 *
 * Single normalisation point for the data returned by
 *   GET /fee/student-records/invoices/:basicId
 *   GET /fee/student-records/receipts/:basicId
 *
 * Everything here is derived from that API response. No values are hardcoded:
 * missing fields render as an em dash placeholder instead of invented data.
 * The same model feeds the on-screen view, the print output and the PDF export,
 * so all three always show identical dynamic data.
 */

export type FeeDocKind = "invoice" | "receipt";

export type FeeDocLine = {
  description: string;
  amount: number;
  paid: number;
  balance: number;
};

export type FeeDocPayment = {
  voucher_no: string;
  paid_date: string;
  payment_mode: string;
  amount: number;
  status: string;
  note: string;
  reference_number: string;
};

export type FeeDocEntry = { label: string; value: string };

export type FeeDocTotal = { label: string; value: string; emphasis?: boolean };

export type FeeDocumentModel = {
  kind: FeeDocKind;
  /** e.g. "FEE INVOICE" / "FEE PAYMENT RECEIPT" — comes from the backend */
  title: string;
  /** Short statement of what the document represents */
  purpose: string;
  generated_at: string;
  institution: FeeDocEntry[];
  student: FeeDocEntry[];
  reference: FeeDocEntry[];
  status: string;
  lines: FeeDocLine[];
  lineColumns: Array<"amount" | "paid" | "balance">;
  payments: FeeDocPayment[];
  totals: FeeDocTotal[];
  notes: string[];
  fileName: string;
};

const DASH = "—";

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const text = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s;
};

const orDash = (v: unknown) => text(v) || DASH;

export const formatFeeMoney = (v: unknown) =>
  `₨ ${num(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const formatDate = (v: unknown) => {
  const raw = text(v);
  if (!raw) return DASH;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const formatDateTime = (v: unknown) => {
  const raw = text(v);
  if (!raw) return DASH;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toISOString().slice(0, 19).replace("T", " ");
};

const named = (v: unknown, key: "name" | "title" = "name") => {
  const rec = asRecord(v);
  return text(rec[key]) || "";
};

const slug = (v: string) =>
  v.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";

const buildLines = (raw: unknown): FeeDocLine[] =>
  (Array.isArray(raw) ? raw : []).map((entry) => {
    const l = asRecord(entry);
    const amount = num(l.amount ?? l.fee_amount);
    const paid = num(l.paid ?? l.fee_paid_amount);
    return {
      description: text(l.description ?? l.fee_head) || DASH,
      amount,
      paid,
      balance: l.balance !== undefined ? num(l.balance) : Math.max(0, amount - paid),
    };
  });

const buildPayments = (raw: unknown): FeeDocPayment[] =>
  (Array.isArray(raw) ? raw : []).map((entry) => {
    const p = asRecord(entry);
    return {
      voucher_no: orDash(p.voucher_no),
      paid_date: formatDate(p.paid_date ?? p.recorded_at),
      payment_mode: orDash(p.payment_mode),
      amount: num(p.paid_amount),
      status: orDash(p.payment_status),
      note: text(p.note),
      reference_number: text(p.reference_number),
    };
  });

const buildStudentEntries = (student: Record<string, unknown>): FeeDocEntry[] => {
  const entries: FeeDocEntry[] = [
    { label: "Student Name", value: orDash(student.name) },
    { label: "Registration No", value: orDash(student.reg_no) },
  ];
  const program = named(student.program);
  const klass = named(student.class);
  const board = named(student.board);
  if (program) entries.push({ label: "Program", value: program });
  if (klass) entries.push({ label: "Class", value: klass });
  if (board) entries.push({ label: "Board", value: board });
  const contact = text(student.mobile_1) || text(student.email);
  if (contact) entries.push({ label: "Contact", value: contact });
  return entries;
};

const buildInstitutionEntries = (
  student: Record<string, unknown>
): FeeDocEntry[] => {
  const branch = asRecord(student.branch);
  const entries: FeeDocEntry[] = [
    { label: "Branch", value: orDash(branch.name) },
  ];
  const code = text(branch.branch_code);
  if (code) entries.push({ label: "Branch Code", value: code });
  const session = named(student.session, "title");
  if (session) entries.push({ label: "Session", value: session });
  return entries;
};

/** Build the invoice model — a fee bill: what is charged and still owed. */
const buildInvoiceModel = (data: Record<string, unknown>): FeeDocumentModel => {
  const student = asRecord(data.student);
  const invoice = asRecord(data.invoice);
  const totals = asRecord(invoice.totals);
  const lateFee = asRecord(invoice.late_fee);
  const installment = asRecord(invoice.installment);
  const discountType = asRecord(invoice.discount_type);

  const reference: FeeDocEntry[] = [
    { label: "Invoice No", value: orDash(invoice.bill_no) },
    { label: "Voucher Date", value: formatDate(invoice.voucher_date) },
    { label: "Due From", value: formatDate(invoice.due_date_start) },
    { label: "Due Until", value: formatDate(invoice.due_date_end) },
    { label: "Fee Structure", value: orDash(invoice.fee_structure_code) },
  ];
  const planName = text(installment.name);
  if (planName) reference.push({ label: "Installment", value: planName });

  const totalRows: FeeDocTotal[] = [
    { label: "Total Charged", value: formatFeeMoney(totals.due) },
  ];
  if (num(invoice.discount_fee) > 0) {
    totalRows.push({
      label: `Discount${text(discountType.name) ? ` (${text(discountType.name)})` : ""}`,
      value: formatFeeMoney(invoice.discount_fee),
    });
  }
  totalRows.push({ label: "Amount Paid", value: formatFeeMoney(totals.paid) });
  if (num(totals.late_fee) > 0) {
    totalRows.push({
      label: "Late Fee",
      value: formatFeeMoney(totals.late_fee),
    });
  }
  totalRows.push({
    label: "Outstanding Balance",
    value: formatFeeMoney(
      num(totals.late_fee) > 0 ? totals.total_with_late : totals.balance
    ),
    emphasis: true,
  });

  const notes: string[] = [];
  const comment = text(invoice.special_discount_comment);
  if (comment) notes.push(comment);
  const lateReason = text(lateFee.reason ?? lateFee.rule_title);
  if (num(totals.late_fee) > 0 && lateReason) {
    notes.push(`Late fee applied: ${lateReason}`);
  }

  return {
    kind: "invoice",
    title: text(data.document_title) || "FEE INVOICE",
    purpose: "Fee bill — amount charged and payable by the student",
    generated_at: formatDateTime(data.generated_at),
    institution: buildInstitutionEntries(student),
    student: buildStudentEntries(student),
    reference,
    status: orDash(invoice.status),
    lines: buildLines(invoice.lines),
    lineColumns: ["amount", "paid", "balance"],
    payments: [],
    totals: totalRows,
    notes,
    fileName: `Invoice-${slug(text(invoice.bill_no))}-${slug(text(student.reg_no) || text(student.name))}.pdf`,
  };
};

/** Build the receipt model — proof of payment actually received. */
const buildReceiptModel = (data: Record<string, unknown>): FeeDocumentModel => {
  const student = asRecord(data.student);
  const receipt = asRecord(data.receipt);
  const payments = buildPayments(receipt.payments);
  const modes = Array.isArray(receipt.payment_modes)
    ? (receipt.payment_modes as unknown[]).map((m) => text(m)).filter(Boolean)
    : [];

  const lastRefNo = payments.find((p) => p.reference_number)?.reference_number || "";

  const reference: FeeDocEntry[] = [
    { label: "Receipt No", value: orDash(receipt.receipt_no) },
    { label: "Against Invoice", value: orDash(receipt.bill_no) },
    {
      label: "Payment Date",
      value: formatDate(receipt.last_payment_date ?? receipt.voucher_date),
    },
    {
      label: "Payment Mode",
      value: modes.length ? modes.join(", ") : orDash(receipt.last_payment_mode),
    },
    { label: "Voucher / Txn No", value: orDash(receipt.last_voucher_no) },
  ];
  if (lastRefNo) {
    reference.push({ label: "Reference No", value: lastRefNo });
  }

  const totalRows: FeeDocTotal[] = [
    {
      label: "Amount Received",
      value: formatFeeMoney(receipt.total_paid),
      emphasis: true,
    },
    {
      label: "Remaining Balance",
      value: formatFeeMoney(receipt.remaining_balance),
    },
  ];

  const notes: string[] = [];
  const transactionsTotal = num(receipt.transactions_total);
  if (!payments.length) {
    notes.push(
      "Payment mode and voucher details are shown where a payment transaction was recorded for this statement."
    );
  } else if (Math.abs(transactionsTotal - num(receipt.total_paid)) > 0.5) {
    notes.push(
      `Recorded payment transactions listed above total ${formatFeeMoney(
        transactionsTotal
      )}; the remaining amount received was posted against the fee heads without a separate transaction record.`
    );
  }

  return {
    kind: "receipt",
    title: text(data.document_title) || "FEE PAYMENT RECEIPT",
    purpose: "Proof of payment — amount actually received from the student",
    generated_at: formatDateTime(data.generated_at),
    institution: buildInstitutionEntries(student),
    student: buildStudentEntries(student),
    reference,
    status: num(receipt.remaining_balance) <= 0 ? "Paid" : orDash(receipt.status),
    lines: buildLines(receipt.lines),
    lineColumns: ["amount", "paid"],
    payments,
    totals: totalRows,
    notes,
    fileName: `Receipt-${slug(text(receipt.receipt_no))}-${slug(text(student.reg_no) || text(student.name))}.pdf`,
  };
};

export const buildFeeDocumentModel = (
  data: unknown,
  kind: FeeDocKind
): FeeDocumentModel => {
  const payload = asRecord(data);
  return kind === "invoice"
    ? buildInvoiceModel(payload)
    : buildReceiptModel(payload);
};

export const feeDocColumnLabel = (col: "amount" | "paid" | "balance") =>
  col === "amount" ? "Amount" : col === "paid" ? "Paid" : "Balance";

export const feeDocLineValue = (
  line: FeeDocLine,
  col: "amount" | "paid" | "balance"
) => formatFeeMoney(line[col]);
