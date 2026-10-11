import { prisma } from "../../../config/db";
import { AppError } from "../utils/fee.helpers";
import {
  computeLateFeeForBasic,
  loadActiveRules,
  type LateFeeComputation,
} from "./lateFeeManagement.service";

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const studentName = (s: {
  id: number;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  reg_no?: string | null;
}) =>
  [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ").trim() ||
  `Student #${s.id}`;

type SummaryInput = {
  basics: Array<{
    id: number;
    total_fee: string | null;
    total_after_discount: string | null;
    discount_fee: string | null;
    basic_fee: string | null;
    fee_due_date_end: Date | null;
    status: string | null;
    bill_no: string | null;
    fee_structure_code: number;
    voucher_date: Date | null;
    created_at: Date | null;
  }>;
  lines: Array<{
    id: number;
    fee_master_basic_id_fk: number;
    fee_head: string;
    fee_amount: number | null;
    fee_paid_amount: number | null;
    status: number;
    updated_at: Date | null;
    created_at: Date | null;
    fee_discount_comment: string | null;
  }>;
};

export const computeStudentFeeSummary = ({ basics, lines }: SummaryInput) => {
  const activeBasics = basics.filter(
    (b) => b.status === "1" || b.status === "Active" || b.status == null
  );
  const relevantBasics = activeBasics.length ? activeBasics : basics;

  let totalDues = 0;
  let totalPaid = 0;
  let overdue = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const basic of relevantBasics) {
    const basicLines = lines.filter((l) => l.fee_master_basic_id_fk === basic.id);
    const due =
      num(basic.total_after_discount) ||
      num(basic.total_fee) ||
      basicLines.reduce((s, l) => s + num(l.fee_amount), 0);
    const paid = basicLines.reduce((s, l) => s + num(l.fee_paid_amount), 0);
    const balance = Math.max(0, due - paid);
    totalDues += due;
    totalPaid += paid;

    const dueEnd = basic.fee_due_date_end
      ? new Date(basic.fee_due_date_end)
      : null;
    if (dueEnd) dueEnd.setHours(0, 0, 0, 0);
    if (balance > 0 && dueEnd && dueEnd < today) {
      overdue += balance;
    }
  }

  const outstanding = Math.max(0, totalDues - totalPaid);
  let feeStatus: "Paid" | "Partial" | "Unpaid" | "Overdue" | "No Record" =
    "No Record";
  if (relevantBasics.length === 0 && lines.length === 0) {
    feeStatus = "No Record";
  } else if (outstanding <= 0 && totalDues > 0) {
    feeStatus = "Paid";
  } else if (overdue > 0) {
    feeStatus = "Overdue";
  } else if (totalPaid > 0 && outstanding > 0) {
    feeStatus = "Partial";
  } else {
    feeStatus = "Unpaid";
  }

  return {
    total_dues: totalDues,
    total_paid: totalPaid,
    outstanding_balance: outstanding,
    overdue_amount: overdue,
    fee_status: feeStatus,
    assignment_count: basics.length,
    active_assignment_count: relevantBasics.length,
  };
};

export const listStudentFeeRecords = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  branch_id?: number;
  program_id?: number;
  class_id?: number;
  status?: string;
}) => {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const studentWhere: Record<string, unknown> = {
    deleted_at: null,
  };
  if (params.branch_id) studentWhere.branch_id = params.branch_id;
  if (params.program_id) studentWhere.program_id = params.program_id;
  if (params.class_id) studentWhere.class_id = params.class_id;
  if (params.search) {
    const term = params.search.trim();
    const asId = Number(term);
    const isNumericId = /^\d+$/.test(term) && Number.isInteger(asId) && asId > 0;

    if (isNumericId) {
      const orFilters: Record<string, unknown>[] = [{ id: asId }];
      if (term.length >= 3) {
        orFilters.push(
          { walkin_reg_no: { contains: term, mode: "insensitive" } },
          { reg_no: { contains: term, mode: "insensitive" } }
        );
      }
      studentWhere.OR = orFilters;
    } else {
      const orFilters: Record<string, unknown>[] = [
        { first_name: { contains: term, mode: "insensitive" } },
        { middle_name: { contains: term, mode: "insensitive" } },
        { last_name: { contains: term, mode: "insensitive" } },
        { reg_no: { contains: term, mode: "insensitive" } },
        { walkin_reg_no: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
      const parts = term.split(/\s+/).filter(Boolean);
      if (parts.length > 1) {
        orFilters.push({
          AND: parts.map((part) => ({
            OR: [
              { first_name: { contains: part, mode: "insensitive" } },
              { middle_name: { contains: part, mode: "insensitive" } },
              { last_name: { contains: part, mode: "insensitive" } },
            ],
          })),
        });
      }
      studentWhere.OR = orFilters;
    }
  }

  // All active students are listed. Fee links are optional — students with
  // no fee_master_basics / settings / automate still appear as "No Record".
  const [students, total] = await Promise.all([
    prisma.students.findMany({
      where: studentWhere,
      orderBy: { id: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        reg_no: true,
        walkin_reg_no: true,
        email: true,
        branch_id: true,
        program_id: true,
        class_id: true,
        board_id: true,
        session_id: true,
        status: true,
        mobile_1: true,
      },
    }),
    prisma.students.count({ where: studentWhere }),
  ]);

  const studentIds = students.map((s) => s.id);
  const [basics, lines, settings] = studentIds.length
    ? await Promise.all([
        prisma.feeMasterBasics.findMany({
          where: { student_id: { in: studentIds } },
        }),
        prisma.feeMasters.findMany({
          where: { students_id: { in: studentIds } },
        }),
        prisma.studentFeeSettings.findMany({
          where: { student_id: { in: studentIds } },
        }),
      ])
    : [[], [], []];

  const items = students.map((student) => {
    const studentBasics = basics.filter((b) => b.student_id === student.id);
    const studentLines = lines.filter((l) => l.students_id === student.id);
    const summary = computeStudentFeeSummary({
      basics: studentBasics,
      lines: studentLines,
    });
    const setting = settings.find((s) => s.student_id === student.id) || null;
    return {
      student: {
        ...student,
        name: studentName(student),
        // Walk-in enrollments may have walkin_reg_no before an official reg_no.
        reg_no: student.reg_no || student.walkin_reg_no,
      },
      summary,
      settings: setting,
    };
  });

  const filtered =
    params.status && params.status !== ""
      ? items.filter((i) => i.summary.fee_status === params.status)
      : items;

  return {
    items: filtered,
    meta: {
      total: params.status ? filtered.length : total,
      page,
      limit,
      pages: Math.ceil((params.status ? filtered.length : total) / limit) || 1,
    },
  };
};

export const getStudentFeeDashboard = async (studentId: number) => {
  const student = await prisma.students.findFirst({
    where: { id: studentId, deleted_at: null },
  });
  if (!student) throw new AppError("Student not found", 404);

  const [basics, lines, settings, automate, discountTypes, installments] =
    await Promise.all([
      prisma.feeMasterBasics.findMany({
        where: { student_id: studentId },
        orderBy: { id: "desc" },
      }),
      prisma.feeMasters.findMany({
        where: { students_id: studentId },
        orderBy: { id: "asc" },
      }),
      prisma.studentFeeSettings.findMany({
        where: { student_id: studentId },
      }),
      prisma.feeAutomate.findMany({
        where: { student_id: String(studentId) },
      }),
      prisma.discountTypes.findMany({
        where: { status: "Active" },
        orderBy: { name: "asc" },
        take: 100,
      }),
      prisma.installmentPlans.findMany({
        where: { status: "1" },
        orderBy: { installment_no: "asc" },
        take: 100,
      }),
    ]);

  const structureCodes = [
    ...new Set(basics.map((b) => String(b.fee_structure_code))),
  ];
  const structures = structureCodes.length
    ? await prisma.feeStructures.findMany({
        where: { fee_structure_code: { in: structureCodes } },
      })
    : [];

  const installmentMap = Object.fromEntries(
    installments.map((i) => [i.id, i])
  );
  const discountMap = Object.fromEntries(
    discountTypes.map((d) => [d.id, d])
  );

  const summary = computeStudentFeeSummary({ basics, lines });
  const lateFeeRules = await loadActiveRules();

  let totalLateFee = 0;
  let totalWithLate = summary.outstanding_balance;

  const statements = await Promise.all(
    basics.map(async (basic) => {
    const basicLines = lines.filter((l) => l.fee_master_basic_id_fk === basic.id);
    const due =
      num(basic.total_after_discount) ||
      num(basic.total_fee) ||
      basicLines.reduce((s, l) => s + num(l.fee_amount), 0);
    const paid = basicLines.reduce((s, l) => s + num(l.fee_paid_amount), 0);
    const balance = Math.max(0, due - paid);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueEnd = basic.fee_due_date_end
      ? new Date(basic.fee_due_date_end)
      : null;
    const isOverdue = !!(balance > 0 && dueEnd && dueEnd < today);

    let lineStatus: "Paid" | "Partial" | "Unpaid" | "Overdue" = "Unpaid";
    if (balance <= 0 && due > 0) lineStatus = "Paid";
    else if (isOverdue) lineStatus = "Overdue";
    else if (paid > 0) lineStatus = "Partial";

    const late_fee: LateFeeComputation = await computeLateFeeForBasic(
      basic,
      basicLines,
      lateFeeRules
    );
    totalLateFee += late_fee.late_fee_amount;
    totalWithLate += late_fee.late_fee_amount;

    return {
      ...basic,
      lines: basicLines,
      due_amount: due,
      paid_amount: paid,
      balance,
      statement_status: lineStatus,
      late_fee,
      total_outstanding_with_late: late_fee.total_outstanding_with_late,
      installment: basic.installment_id
        ? installmentMap[basic.installment_id] || null
        : null,
      discount_type_info: discountMap[basic.discount_type] || null,
      structure_lines: structures.filter(
        (s) => s.fee_structure_code === String(basic.fee_structure_code)
      ),
    };
  })
  );

  const enrichedSummary = {
    ...summary,
    late_fee_amount: Math.round(totalLateFee * 100) / 100,
    total_outstanding_with_late: Math.round(totalWithLate * 100) / 100,
  };

  /** Payment history derived from fee_masters paid amounts + statement metadata */
  const paymentHistory = lines
    .filter((l) => num(l.fee_paid_amount) > 0)
    .map((l) => {
      const basic = basics.find((b) => b.id === l.fee_master_basic_id_fk);
      return {
        id: l.id,
        fee_master_basic_id: l.fee_master_basic_id_fk,
        bill_no: basic?.bill_no || null,
        fee_head: l.fee_head,
        fee_amount: num(l.fee_amount),
        paid_amount: num(l.fee_paid_amount),
        remaining: Math.max(0, num(l.fee_amount) - num(l.fee_paid_amount)),
        note: l.fee_discount_comment,
        recorded_at: l.updated_at || l.created_at,
        voucher_date: basic?.voucher_date || null,
      };
    })
    .sort((a, b) => {
      const ta = a.recorded_at ? new Date(a.recorded_at).getTime() : 0;
      const tb = b.recorded_at ? new Date(b.recorded_at).getTime() : 0;
      return tb - ta;
    });

  const [branch, program, classRow, board, session] = await Promise.all([
    student.branch_id
      ? prisma.erpBranches.findUnique({
          where: { id: student.branch_id },
          select: { id: true, name: true, branch_code: true },
        })
      : null,
    student.program_id
      ? prisma.programs.findUnique({
          where: { id: student.program_id },
          select: { id: true, name: true, code: true },
        })
      : null,
    student.class_id
      ? prisma.classes.findUnique({
          where: { id: student.class_id },
          select: { id: true, name: true, class_code: true },
        })
      : null,
    student.board_id
      ? prisma.boards.findUnique({
          where: { id: student.board_id },
          select: { id: true, name: true },
        })
      : null,
    student.session_id
      ? prisma.sessions.findUnique({
          where: { id: student.session_id },
          select: { id: true, title: true },
        })
      : null,
  ]);

  return {
    student: {
      ...student,
      name: studentName(student),
      branch,
      program,
      class: classRow,
      board,
      session,
    },
    summary: enrichedSummary,
    statements,
    payment_history: paymentHistory,
    settings: settings[0] || null,
    automate: automate,
    discount_types: discountTypes,
    installment_plans: installments,
  };
};

export const getInvoiceView = async (basicId: number) => {
  const basic = await prisma.feeMasterBasics.findUnique({ where: { id: basicId } });
  if (!basic) throw new AppError("Fee statement / invoice not found", 404);
  if (!basic.student_id) {
    throw new AppError("This fee record is not linked to a student", 400);
  }

  const dashboard = await getStudentFeeDashboard(basic.student_id);
  const statement = dashboard.statements.find((s) => s.id === basicId);
  if (!statement) throw new AppError("Invoice details not found", 404);

  return {
    type: "invoice",
    document_title: "FEE INVOICE",
    generated_at: new Date().toISOString(),
    student: dashboard.student,
    invoice: {
      bill_no: statement.bill_no || `INV-${statement.id}`,
      voucher_date: statement.voucher_date,
      due_date_start: statement.fee_due_date_start,
      due_date_end: statement.fee_due_date_end,
      fee_structure_code: statement.fee_structure_code,
      basic_fee: statement.basic_fee,
      discount_fee: statement.discount_fee,
      total_fee: statement.total_fee,
      total_after_discount: statement.total_after_discount,
      special_discount_comment: statement.special_discount_comment,
      status: statement.statement_status,
      lines: statement.lines.map((l) => ({
        id: l.id,
        description: l.fee_head,
        amount: num(l.fee_amount),
        paid: num(l.fee_paid_amount),
        balance: Math.max(0, num(l.fee_amount) - num(l.fee_paid_amount)),
      })),
      totals: {
        due: statement.due_amount,
        paid: statement.paid_amount,
        balance: statement.balance,
        late_fee: statement.late_fee?.late_fee_amount ?? 0,
        total_with_late: statement.total_outstanding_with_late ?? statement.balance,
      },
      late_fee: statement.late_fee,
      installment: statement.installment,
      discount_type: statement.discount_type_info,
    },
  };
};

export const getReceiptView = async (basicId: number) => {
  const invoice = await getInvoiceView(basicId);
  const paidLines = invoice.invoice.lines.filter((l) => l.paid > 0);
  if (!paidLines.length) {
    throw new AppError("No payments recorded for this statement yet", 400);
  }

  const basic = await prisma.feeMasterBasics.findUnique({
    where: { id: basicId },
    select: { id: true, bill_no: true, student_id: true },
  });

  // Real payment transactions already recorded for this statement (read-only).
  // Matched on the statement's own bill number variants or its fee line ids,
  // because Module 3 stores `bill_no || STMT-<id>` on fee_collections.
  const lineIds = invoice.invoice.lines.map((l) => l.id);
  const collections =
    basic?.student_id != null
      ? await prisma.feeCollections.findMany({
          where: { students_id: basic.student_id },
          orderBy: { id: "desc" },
          take: 100,
          select: {
            id: true,
            bill_no: true,
            fee_masters_id: true,
            paid_amount: true,
            total_amount: true,
            balance: true,
            fine: true,
            discount: true,
            payment_mode: true,
            paid_date: true,
            post_date: true,
            note: true,
            voucher_sequence: true,
            voucher_type: true,
            fee_status: true,
            all_paid: true,
            active_status: true,
            cancel_voucher: true,
            reference_number: true,
            receipt_image_path: true,
            created_at: true,
          },
        })
      : [];

  const billVariants = new Set(
    [basic?.bill_no, `STMT-${basicId}`, invoice.invoice.bill_no]
      .filter(Boolean)
      .map((b) => String(b))
  );

  const payments = collections
    .filter(
      (c) =>
        (c.active_status === 1 || c.active_status == null) &&
        c.cancel_voucher !== "Yes" &&
        ((c.bill_no && billVariants.has(String(c.bill_no))) ||
          (c.fee_masters_id != null && lineIds.includes(c.fee_masters_id)))
    )
    .map((c) => ({
      id: c.id,
      bill_no: c.bill_no,
      paid_amount: num(c.paid_amount),
      fine: num(c.fine),
      discount: num(c.discount),
      balance: num(c.balance),
      payment_mode: c.payment_mode,
      paid_date: c.paid_date,
      post_date: c.post_date,
      note: c.note,
      voucher_no: c.voucher_sequence,
      voucher_type: c.voucher_type,
      payment_status: c.all_paid === 1 ? "Paid" : "Partial",
      reference_number: c.reference_number || null,
      receipt_image_path: c.receipt_image_path || null,
      recorded_at: c.created_at,
    }));

  const paymentModes = [
    ...new Set(payments.map((p) => p.payment_mode).filter(Boolean)),
  ] as string[];

  const lastPayment = payments[0] || null;

  return {
    type: "receipt",
    document_title: "FEE PAYMENT RECEIPT",
    generated_at: new Date().toISOString(),
    student: invoice.student,
    receipt: {
      receipt_no: `RCP-${invoice.invoice.bill_no}`,
      bill_no: invoice.invoice.bill_no,
      voucher_date: invoice.invoice.voucher_date,
      lines: paidLines,
      total_paid: paidLines.reduce((s, l) => s + l.paid, 0),
      remaining_balance: invoice.invoice.totals.balance,
      status: invoice.invoice.status,
      payments,
      payment_modes: paymentModes,
      transactions_total: payments.reduce((s, p) => s + p.paid_amount, 0),
      last_payment_date: lastPayment?.paid_date || lastPayment?.recorded_at || null,
      last_payment_mode: lastPayment?.payment_mode || null,
      last_voucher_no: lastPayment?.voucher_no || null,
    },
  };
};

export const recordPayment = async (
  data: {
    fee_master_basic_id: number;
    fee_masters_id?: number;
    amount: number;
    note?: string | null;
  },
  userId: number
) => {
  const basic = await prisma.feeMasterBasics.findUnique({
    where: { id: data.fee_master_basic_id },
  });
  if (!basic) throw new AppError("Fee record not found", 404);
  if (!basic.student_id) {
    throw new AppError("Cannot record payment on a non-student fee assignment");
  }

  const lines = await prisma.feeMasters.findMany({
    where: {
      fee_master_basic_id_fk: basic.id,
      ...(data.fee_masters_id ? { id: data.fee_masters_id } : {}),
    },
    orderBy: { id: "asc" },
  });
  if (!lines.length) throw new AppError("No fee lines found for payment", 404);

  let remainingPayment = data.amount;
  const updates: Array<{ id: number; paid: number }> = [];

  for (const line of lines) {
    if (remainingPayment <= 0) break;
    const amount = num(line.fee_amount);
    const alreadyPaid = num(line.fee_paid_amount);
    const open = Math.max(0, amount - alreadyPaid);
    if (open <= 0) continue;
    const apply = Math.min(open, remainingPayment);
    updates.push({ id: line.id, paid: alreadyPaid + apply });
    remainingPayment -= apply;
  }

  if (!updates.length) {
    throw new AppError("Selected fee lines are already fully paid");
  }
  if (remainingPayment > 0.009) {
    throw new AppError(
      `Payment exceeds outstanding balance by ${remainingPayment.toFixed(2)}`
    );
  }

  await prisma.$transaction(
    updates.map((u) =>
      prisma.feeMasters.update({
        where: { id: u.id },
        data: {
          fee_paid_amount: Math.round(u.paid),
          fee_discount_comment: data.note
            ? `${data.note}`.slice(0, 250)
            : undefined,
          last_updated_by: userId,
          updated_at: new Date(),
        },
      })
    )
  );

  // Refresh totals on basic if all paid
  const refreshed = await prisma.feeMasters.findMany({
    where: { fee_master_basic_id_fk: basic.id },
  });
  const due =
    num(basic.total_after_discount) ||
    num(basic.total_fee) ||
    refreshed.reduce((s, l) => s + num(l.fee_amount), 0);
  const paid = refreshed.reduce((s, l) => s + num(l.fee_paid_amount), 0);
  if (paid >= due && due > 0) {
    await prisma.feeMasterBasics.update({
      where: { id: basic.id },
      data: {
        status: "1",
        last_updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  return getStudentFeeDashboard(basic.student_id);
};

export const upsertStudentFeeSettings = async (
  data: {
    student_id: number;
    program_id?: number;
    installment_id?: number;
    basic_fee?: string | null;
    discount?: string | null;
    status?: string;
  }
) => {
  const student = await prisma.students.findFirst({
    where: { id: data.student_id, deleted_at: null },
  });
  if (!student) throw new AppError("Student not found", 404);

  if (data.installment_id) {
    const plan = await prisma.installmentPlans.findUnique({
      where: { id: data.installment_id },
    });
    if (!plan) throw new AppError("Installment plan not found", 404);
  }

  const existing = await prisma.studentFeeSettings.findFirst({
    where: {
      student_id: data.student_id,
      ...(data.program_id ? { program_id: data.program_id } : {}),
    },
  });

  if (existing) {
    return prisma.studentFeeSettings.update({
      where: { id: existing.id },
      data: {
        program_id: data.program_id ?? existing.program_id,
        installment_id: data.installment_id ?? existing.installment_id,
        basic_fee: data.basic_fee ?? existing.basic_fee,
        discount: data.discount ?? existing.discount,
        status: data.status ?? existing.status,
        updated_at: new Date(),
      },
    });
  }

  return prisma.studentFeeSettings.create({
    data: {
      student_id: data.student_id,
      program_id: data.program_id ?? student.program_id,
      installment_id: data.installment_id ?? null,
      basic_fee: data.basic_fee ?? "0",
      discount: data.discount ?? "0",
      status: data.status ?? "1",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

export const upsertFeeAutomate = async (data: {
  student_id: string;
  branch_id?: number;
  board_id?: number;
  program_id?: number;
  class_id?: number;
  intake_id?: number;
  total_fee?: string | null;
  tuition_fee?: string | null;
  annual_fee?: string | null;
  safety_fee?: string | null;
  id_card?: string | null;
  computer_fee?: number;
  lms_fee?: string | null;
  ib_fee?: number;
  party_fee?: number | null;
  no_of_installments?: number | null;
  per_month_fee?: string;
  status?: number;
  fee_structure_code?: string | null;
}) => {
  const studentIdNum = Number(data.student_id);
  if (!Number.isFinite(studentIdNum)) {
    throw new AppError("student_id must be numeric");
  }
  const student = await prisma.students.findFirst({
    where: { id: studentIdNum, deleted_at: null },
  });
  if (!student) throw new AppError("Student not found", 404);

  if (data.fee_structure_code) {
    const exists = await prisma.feeStructures.findFirst({
      where: { fee_structure_code: data.fee_structure_code },
    });
    if (!exists) throw new AppError("Fee structure code not found", 404);
  }

  const existing = await prisma.feeAutomate.findFirst({
    where: { student_id: String(studentIdNum) },
  });

  const payload = {
    student_id: String(studentIdNum),
    branch_id: data.branch_id ?? student.branch_id,
    board_id: data.board_id ?? student.board_id,
    program_id: data.program_id ?? student.program_id,
    class_id: data.class_id ?? student.class_id,
    intake_id: data.intake_id ?? student.intake_id,
    total_fee: data.total_fee ?? null,
    tuition_fee: data.tuition_fee ?? null,
    annual_fee: data.annual_fee ?? null,
    safety_fee: data.safety_fee ?? null,
    id_card: data.id_card ?? null,
    computer_fee: data.computer_fee ?? 0,
    lms_fee: data.lms_fee ?? null,
    ib_fee: data.ib_fee ?? 0,
    party_fee: data.party_fee ?? 0,
    no_of_installments: data.no_of_installments ?? 1,
    per_month_fee: data.per_month_fee ?? "0",
    status: data.status ?? 1,
    fee_structure_code: data.fee_structure_code ?? null,
  };

  if (existing) {
    return prisma.feeAutomate.update({
      where: { fa_id: existing.fa_id },
      data: payload,
    });
  }

  const latest = await prisma.feeAutomate.findFirst({
    orderBy: { fa_id: "desc" },
    select: { fa_id: true },
  });
  const nextId = (latest?.fa_id || 0) + 1;

  return prisma.feeAutomate.create({
    data: {
      fa_id: nextId,
      ...payload,
    },
  });
};

export const listDiscountTypes = async () =>
  prisma.discountTypes.findMany({
    orderBy: { id: "asc" },
    take: 200,
  });
