import { prisma } from "../../../config/db";
import {
  computeLateFeeForBasic,
  loadActiveRules,
} from "./lateFeeManagement.service";
import { listFeeAuditTrail } from "./feeAudit.service";

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const toDateOnly = (d: Date | null | undefined) =>
  d ? startOfDay(d).toISOString().slice(0, 10) : null;

const studentName = (s: {
  first_name?: string | null;
  last_name?: string | null;
  id: number;
}) =>
  [s.first_name, s.last_name].filter(Boolean).join(" ").trim() ||
  `Student #${s.id}`;

export type ReportFilters = {
  date_from?: string;
  date_to?: string;
  branch_id?: number;
  session_id?: number;
  program_id?: number;
  class_id?: number;
  class_ids?: number[];
  student_id?: number;
  payment_mode?: string;
  fee_status?: string;
  due_status?: "all" | "outstanding" | "overdue" | "paid" | "partial";
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
};

const resolveDateRange = (filters: ReportFilters) => {
  let from: Date | undefined;
  let to: Date | undefined;
  if (filters.date_from) from = startOfDay(new Date(filters.date_from));
  if (filters.date_to) {
    to = new Date(filters.date_to);
    to.setHours(23, 59, 59, 999);
  }
  return { from, to };
};

const parsePaidDate = (paidDate: string | null | undefined): Date | null => {
  if (!paidDate) return null;
  const d = new Date(paidDate.slice(0, 10));
  return Number.isNaN(d.getTime()) ? null : d;
};

const isActiveBasic = (status: string | null) =>
  status === "1" || status === "Active" || status == null;

/** Normalize payment mode labels for aggregation */
const normalizeMode = (mode: string | null | undefined) => {
  const m = (mode || "Other").trim();
  if (!m) return "Other";
  const lower = m.toLowerCase();
  if (lower.includes("cash")) return "Cash";
  if (lower.includes("cheque") || lower.includes("check")) return "Cheque";
  if (lower.includes("bank") || lower.includes("transfer") || lower.includes("eft"))
    return "Bank Transfer";
  if (lower.includes("stripe") || lower.includes("paypal") || lower.includes("online"))
    return "Online";
  return m;
};

// ── Analytics dashboard ──────────────────────────────────────────────────────

export const getReportingAnalytics = async (filters: ReportFilters) => {
  const { from, to } = resolveDateRange(filters);
  const collectionWhere: Record<string, unknown> = {
    active_status: 1,
    cancel_voucher: { not: "Yes" },
  };
  if (filters.branch_id) collectionWhere.branch_id = filters.branch_id;
  if (filters.session_id) collectionWhere.session_id = filters.session_id;
  if (filters.program_id) collectionWhere.program_id = filters.program_id;
  if (filters.class_id) collectionWhere.class_id = filters.class_id;
  if (filters.student_id) collectionWhere.students_id = filters.student_id;
  if (filters.payment_mode) {
    collectionWhere.payment_mode = { contains: filters.payment_mode, mode: "insensitive" };
  }

  const collections = await prisma.feeCollections.findMany({
    where: collectionWhere,
    select: {
      id: true,
      paid_amount: true,
      fine: true,
      payment_mode: true,
      paid_date: true,
      post_date: true,
      created_at: true,
      students_id: true,
      discount: true,
    },
    orderBy: { id: "desc" },
    take: 5000,
  });

  const filteredCollections = collections.filter((c) => {
    const pd = parsePaidDate(c.paid_date) || c.post_date || c.created_at;
    if (!pd) return true;
    if (from && pd < from) return false;
    if (to && pd > to) return false;
    return true;
  });

  const byMode: Record<string, { count: number; amount: number }> = {};
  const byMonth: Record<string, number> = {};
  let totalCollected = 0;
  let totalFineCollected = 0;
  const paidStudentIds = new Set<number>();

  for (const c of filteredCollections) {
    const amount = num(c.paid_amount);
    totalCollected += amount;
    totalFineCollected += num(c.fine);
    paidStudentIds.add(c.students_id);
    const mode = normalizeMode(c.payment_mode);
    if (!byMode[mode]) byMode[mode] = { count: 0, amount: 0 };
    byMode[mode].count += 1;
    byMode[mode].amount += amount;

    const pd = parsePaidDate(c.paid_date) || c.post_date || c.created_at;
    if (pd) {
      const key = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + amount;
    }
  }

  const basicWhere: Record<string, unknown> = {
    student_id: { not: null },
  };
  if (filters.branch_id) basicWhere.branch_id = filters.branch_id;
  if (filters.session_id) basicWhere.session_id = filters.session_id;
  if (filters.program_id) basicWhere.program_id = filters.program_id;
  if (filters.class_id) basicWhere.class_id = filters.class_id;
  if (filters.student_id) basicWhere.student_id = filters.student_id;

  const basics = await prisma.feeMasterBasics.findMany({
    where: basicWhere,
    take: 3000,
    orderBy: { id: "desc" },
  });
  const activeBasics = basics.filter((b) => isActiveBasic(b.status));
  const basicIds = activeBasics.map((b) => b.id);
  const lines =
    basicIds.length > 0
      ? await prisma.feeMasters.findMany({
          where: { fee_master_basic_id_fk: { in: basicIds } },
        })
      : [];

  const rules = await loadActiveRules();
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let totalLateFees = 0;
  let totalDiscounts = 0;
  let paidStudents = 0;
  let partialStudents = 0;
  let unpaidStudents = 0;

  const studentAgg = new Map<
    number,
    { due: number; paid: number; overdue: number }
  >();

  for (const basic of activeBasics) {
    if (!basic.student_id) continue;
    const blines = lines.filter((l) => l.fee_master_basic_id_fk === basic.id);
    const due =
      num(basic.total_after_discount) ||
      num(basic.total_fee) ||
      blines.reduce((s, l) => s + num(l.fee_amount), 0);
    const paid = blines.reduce((s, l) => s + num(l.fee_paid_amount), 0);
    const balance = Math.max(0, due - paid);
    const discount =
      num(basic.discount_fee) + num(basic.other_discount_fee);
    totalDiscounts += discount;
    totalOutstanding += balance;

    const today = startOfDay(new Date());
    const dueEnd = basic.fee_due_date_end
      ? startOfDay(basic.fee_due_date_end)
      : null;
    if (balance > 0 && dueEnd && dueEnd < today) {
      totalOverdue += balance;
    }

    const late = await computeLateFeeForBasic(basic, blines, rules);
    totalLateFees += late.late_fee_amount;

    const agg = studentAgg.get(basic.student_id) || {
      due: 0,
      paid: 0,
      overdue: 0,
    };
    agg.due += due;
    agg.paid += paid;
    if (balance > 0 && dueEnd && dueEnd < today) agg.overdue += balance;
    studentAgg.set(basic.student_id, agg);
  }

  for (const [, agg] of studentAgg) {
    const outstanding = Math.max(0, agg.due - agg.paid);
    if (outstanding <= 0 && agg.due > 0) paidStudents += 1;
    else if (agg.overdue > 0) unpaidStudents += 1; // overdue counted with unpaid bucket for status card
    else if (agg.paid > 0 && outstanding > 0) partialStudents += 1;
    else if (outstanding > 0) unpaidStudents += 1;
  }

  // recount overdue vs unpaid more accurately
  paidStudents = 0;
  partialStudents = 0;
  unpaidStudents = 0;
  let overdueStudents = 0;
  for (const [, agg] of studentAgg) {
    const outstanding = Math.max(0, agg.due - agg.paid);
    if (outstanding <= 0 && agg.due > 0) paidStudents += 1;
    else if (agg.overdue > 0) overdueStudents += 1;
    else if (agg.paid > 0 && outstanding > 0) partialStudents += 1;
    else if (outstanding > 0) unpaidStudents += 1;
  }

  const monthKeys = Object.keys(byMonth).sort();
  const collectionTrend = monthKeys.slice(-12).map((k) => ({
    period: k,
    amount: Math.round(byMonth[k]! * 100) / 100,
  }));

  return {
    summary: {
      total_collected: Math.round(totalCollected * 100) / 100,
      total_outstanding: Math.round(totalOutstanding * 100) / 100,
      total_overdue: Math.round(totalOverdue * 100) / 100,
      total_late_fees: Math.round(totalLateFees * 100) / 100,
      total_discounts: Math.round(totalDiscounts * 100) / 100,
      total_fine_collected: Math.round(totalFineCollected * 100) / 100,
      payment_count: filteredCollections.length,
      paid_students: paidStudents,
      partial_students: partialStudents,
      unpaid_students: unpaidStudents,
      overdue_students: overdueStudents,
    },
    payment_mode_distribution: Object.entries(byMode).map(([mode, v]) => ({
      mode,
      count: v.count,
      amount: Math.round(v.amount * 100) / 100,
    })),
    collection_trend: collectionTrend,
    paid_vs_outstanding: [
      { label: "Collected", amount: Math.round(totalCollected * 100) / 100 },
      { label: "Outstanding", amount: Math.round(totalOutstanding * 100) / 100 },
    ],
  };
};

// ── Collection reports ───────────────────────────────────────────────────────

export const getCollectionReport = async (
  filters: ReportFilters & { group_by?: "day" | "month" | "year" }
) => {
  const groupBy = filters.group_by || "month";
  const { from, to } = resolveDateRange(filters);
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 200);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    active_status: 1,
  };
  if (filters.branch_id) where.branch_id = filters.branch_id;
  if (filters.session_id) where.session_id = filters.session_id;
  if (filters.program_id) where.program_id = filters.program_id;
  if (filters.class_id) where.class_id = filters.class_id;
  if (filters.student_id) where.students_id = filters.student_id;
  if (filters.payment_mode) {
    where.payment_mode = { contains: filters.payment_mode, mode: "insensitive" };
  }

  const collections = await prisma.feeCollections.findMany({
    where,
    orderBy: { id: "desc" },
    take: 5000,
  });

  const filtered = collections.filter((c) => {
    if (c.cancel_voucher === "Yes") return false;
    const pd = parsePaidDate(c.paid_date) || c.post_date || c.created_at;
    if (from && pd && pd < from) return false;
    if (to && pd && pd > to) return false;
    return true;
  });

  const byMode: Record<string, { count: number; amount: number }> = {};
  const buckets: Record<
    string,
    { period: string; count: number; amount: number; fine: number }
  > = {};
  let totalAmount = 0;
  let totalFine = 0;

  for (const c of filtered) {
    const amount = num(c.paid_amount);
    const fine = num(c.fine);
    totalAmount += amount;
    totalFine += fine;
    const mode = normalizeMode(c.payment_mode);
    if (!byMode[mode]) byMode[mode] = { count: 0, amount: 0 };
    byMode[mode].count += 1;
    byMode[mode].amount += amount;

    const pd = parsePaidDate(c.paid_date) || c.post_date || c.created_at;
    let period = "Unknown";
    if (pd) {
      if (groupBy === "day") period = toDateOnly(pd)!;
      else if (groupBy === "year") period = String(pd.getFullYear());
      else
        period = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!buckets[period]) {
      buckets[period] = { period, count: 0, amount: 0, fine: 0 };
    }
    const bucket = buckets[period]!;
    bucket.count += 1;
    bucket.amount += amount;
    bucket.fine += fine;
  }

  const periods = Object.values(buckets)
    .map((b) => ({
      ...b,
      amount: Math.round(b.amount * 100) / 100,
      fine: Math.round(b.fine * 100) / 100,
    }))
    .sort((a, b) => b.period.localeCompare(a.period));

  const studentIds = [...new Set(filtered.map((c) => c.students_id))];
  const students =
    studentIds.length > 0
      ? await prisma.students.findMany({
          where: { id: { in: studentIds }, deleted_at: null },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            reg_no: true,
          },
        })
      : [];
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const detailRows = filtered.map((c) => {
    const s = studentMap[c.students_id];
    return {
      id: c.id,
      bill_no: c.bill_no,
      voucher_sequence: c.voucher_sequence,
      student_id: c.students_id,
      student_name: s ? studentName(s) : `Student #${c.students_id}`,
      reg_no: s?.reg_no || null,
      paid_amount: num(c.paid_amount),
      fine: num(c.fine),
      discount: num(c.discount),
      payment_mode: c.payment_mode,
      payment_mode_group: normalizeMode(c.payment_mode),
      paid_date: c.paid_date,
      fee_status: c.fee_status,
      balance: num(c.balance),
      branch_id: c.branch_id,
      class_id: c.class_id,
      program_id: c.program_id,
      session_id: c.session_id,
    };
  });

  const total = detailRows.length;
  const items = detailRows.slice(skip, skip + limit);

  return {
    summary: {
      payment_count: filtered.length,
      total_collected: Math.round(totalAmount * 100) / 100,
      total_fine: Math.round(totalFine * 100) / 100,
      net_collection: Math.round((totalAmount) * 100) / 100,
      by_mode: Object.entries(byMode).map(([mode, v]) => ({
        mode,
        count: v.count,
        amount: Math.round(v.amount * 100) / 100,
      })),
      refunds: 0,
      refunds_note: "No refund ledger is present in existing Fee Management tables.",
    },
    periods,
    group_by: groupBy,
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

// ── Outstanding dues ─────────────────────────────────────────────────────────

export const getOutstandingDuesReport = async (filters: ReportFilters) => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 200);
  const skip = (page - 1) * limit;
  const rules = await loadActiveRules();

  const where: Record<string, unknown> = {
    student_id: { not: null },
  };
  if (filters.branch_id) where.branch_id = filters.branch_id;
  if (filters.session_id) where.session_id = filters.session_id;
  if (filters.program_id) where.program_id = filters.program_id;
  if (filters.class_id) where.class_id = filters.class_id;
  if (filters.class_ids && filters.class_ids.length) {
    where.class_id = { in: filters.class_ids };
  }
  if (filters.student_id) where.student_id = filters.student_id;

  const basics = await prisma.feeMasterBasics.findMany({
    where,
    orderBy: { id: "desc" },
    take: 3000,
  });
  const active = basics.filter((b) => isActiveBasic(b.status));
  const basicIds = active.map((b) => b.id);
  const lines =
    basicIds.length > 0
      ? await prisma.feeMasters.findMany({
          where: { fee_master_basic_id_fk: { in: basicIds } },
        })
      : [];

  const studentIds = [
    ...new Set(active.map((b) => b.student_id).filter(Boolean)),
  ] as number[];
  const students = studentIds.length
    ? await prisma.students.findMany({
        where: {
          id: { in: studentIds },
          deleted_at: null,
          ...(filters.search
            ? {
                OR: [
                  { first_name: { contains: filters.search, mode: "insensitive" } },
                  { last_name: { contains: filters.search, mode: "insensitive" } },
                  { reg_no: { contains: filters.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          reg_no: true,
          class_id: true,
          program_id: true,
          branch_id: true,
        },
      })
    : [];
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const rows: Array<Record<string, unknown>> = [];
  const today = startOfDay(new Date());

  for (const basic of active) {
    if (!basic.student_id || !studentMap[basic.student_id]) continue;
    if (
      filters.class_ids &&
      filters.class_ids.length &&
      !filters.class_ids.includes(basic.class_id)
    ) {
      continue;
    }
    const blines = lines.filter((l) => l.fee_master_basic_id_fk === basic.id);
    const original =
      num(basic.total_fee) ||
      blines.reduce((s, l) => s + num(l.fee_amount), 0) ||
      num(basic.basic_fee);
    const discount =
      num(basic.discount_fee) + num(basic.other_discount_fee);
    const due =
      num(basic.total_after_discount) || Math.max(0, original - discount);
    const paid = blines.reduce((s, l) => s + num(l.fee_paid_amount), 0);
    const outstanding = Math.max(0, due - paid);
    if (outstanding <= 0) continue;

    const late = await computeLateFeeForBasic(basic, blines, rules);
    const dueEnd = basic.fee_due_date_end
      ? startOfDay(basic.fee_due_date_end)
      : null;
    const daysOverdue =
      dueEnd && today > dueEnd
        ? Math.floor(
            (today.getTime() - dueEnd.getTime()) / (24 * 60 * 60 * 1000)
          )
        : 0;

    let paymentStatus = late.payment_status;
    if (paymentStatus === "Paid") paymentStatus = "Partial";

    if (filters.due_status === "overdue" && paymentStatus !== "Overdue") continue;
    if (filters.due_status === "outstanding" && outstanding <= 0) continue;
    if (
      filters.due_status === "partial" &&
      !(paid > 0 && outstanding > 0)
    )
      continue;

    const s = studentMap[basic.student_id]!;
    rows.push({
      fee_master_basic_id: basic.id,
      bill_no: basic.bill_no || `STMT-${basic.id}`,
      student_id: s.id,
      student_name: studentName(s),
      reg_no: s.reg_no,
      class_id: basic.class_id || s.class_id,
      program_id: basic.program_id || s.program_id,
      branch_id: basic.branch_id || s.branch_id,
      original_amount: Math.round(original * 100) / 100,
      discount_amount: Math.round(discount * 100) / 100,
      paid_amount: Math.round(paid * 100) / 100,
      outstanding_amount: Math.round(outstanding * 100) / 100,
      due_date: toDateOnly(basic.fee_due_date_end),
      days_overdue: daysOverdue,
      grace_period_days: late.grace_period_days,
      late_fee: late.late_fee_amount,
      total_due: late.total_outstanding_with_late,
      payment_status: paymentStatus,
      in_grace: paymentStatus === "In Grace",
    });
  }

  const sort = filters.sort || "outstanding_desc";
  rows.sort((a, b) => {
    if (sort === "outstanding_desc")
      return num(b.outstanding_amount) - num(a.outstanding_amount);
    if (sort === "due_date_asc")
      return String(a.due_date || "9999").localeCompare(String(b.due_date || "9999"));
    if (sort === "overdue_desc")
      return num(b.days_overdue) - num(a.days_overdue);
    if (sort === "name_asc")
      return String(a.student_name).localeCompare(String(b.student_name));
    return 0;
  });

  const totalOutstanding = rows.reduce((s, r) => s + num(r.outstanding_amount), 0);
  const totalLate = rows.reduce((s, r) => s + num(r.late_fee), 0);
  const total = rows.length;

  return {
    summary: {
      statement_count: total,
      total_outstanding: Math.round(totalOutstanding * 100) / 100,
      total_late_fees: Math.round(totalLate * 100) / 100,
      total_amount_due: Math.round((totalOutstanding + totalLate) * 100) / 100,
    },
    items: rows.slice(skip, skip + limit),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

// ── Discount & concession reports ────────────────────────────────────────────

export const getDiscountReport = async (filters: ReportFilters) => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 200);
  const skip = (page - 1) * limit;
  const { from, to } = resolveDateRange(filters);

  const where: Record<string, unknown> = {
    student_id: { not: null },
    OR: [
      { discount_fee: { not: null } },
      { other_discount_fee: { not: null } },
      { scholarship: { not: null } },
    ],
  };
  if (filters.branch_id) where.branch_id = filters.branch_id;
  if (filters.session_id) where.session_id = filters.session_id;
  if (filters.program_id) where.program_id = filters.program_id;
  if (filters.class_id) where.class_id = filters.class_id;
  if (filters.student_id) where.student_id = filters.student_id;

  const basics = await prisma.feeMasterBasics.findMany({
    where,
    orderBy: { updated_at: "desc" },
    take: 3000,
  });

  const discountTypes = await prisma.discountTypes.findMany();
  const typeMap = Object.fromEntries(discountTypes.map((t) => [t.id, t]));

  const studentIds = [
    ...new Set(basics.map((b) => b.student_id).filter(Boolean)),
  ] as number[];
  const students = studentIds.length
    ? await prisma.students.findMany({
        where: { id: { in: studentIds }, deleted_at: null },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          reg_no: true,
          class_id: true,
          program_id: true,
        },
      })
    : [];
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const rows: Array<Record<string, unknown>> = [];
  const byType: Record<string, { count: number; amount: number }> = {};
  const byClass: Record<string, { count: number; amount: number }> = {};
  let totalDiscount = 0;
  const studentSet = new Set<number>();

  for (const basic of basics) {
    if (!basic.student_id || !studentMap[basic.student_id]) continue;
    const appliedAt = basic.updated_at || basic.created_at;
    if (from && appliedAt && appliedAt < from) continue;
    if (to && appliedAt && appliedAt > to) continue;

    const original = num(basic.total_fee) || num(basic.basic_fee);
    const discountFee = num(basic.discount_fee);
    const otherDiscount = num(basic.other_discount_fee);
    const totalDisc = discountFee + otherDiscount;
    if (totalDisc <= 0 && !basic.scholarship) continue;

    const finalAmount =
      num(basic.total_after_discount) || Math.max(0, original - totalDisc);
    const pct =
      original > 0 ? Math.round((totalDisc / original) * 10000) / 100 : 0;

    let typeLabel = "Discount";
    if (basic.other_discount_type?.startsWith("CONCESSION:")) {
      typeLabel = basic.other_discount_type.replace("CONCESSION:", "Concession: ");
    } else if (basic.scholarship || otherDiscount > 0) {
      typeLabel = basic.special_discount_comment || "Scholarship / Other";
    } else if (basic.discount_type && typeMap[basic.discount_type]) {
      typeLabel = typeMap[basic.discount_type]!.name;
    } else if (basic.special_discount_comment) {
      typeLabel = basic.special_discount_comment;
    }

    totalDiscount += totalDisc;
    studentSet.add(basic.student_id);
    if (!byType[typeLabel]) byType[typeLabel] = { count: 0, amount: 0 };
    const typeBucket = byType[typeLabel]!;
    typeBucket.count += 1;
    typeBucket.amount += totalDisc;

    const classKey = String(basic.class_id || "—");
    if (!byClass[classKey]) byClass[classKey] = { count: 0, amount: 0 };
    const classBucket = byClass[classKey]!;
    classBucket.count += 1;
    classBucket.amount += totalDisc;

    const s = studentMap[basic.student_id]!;
    rows.push({
      fee_master_basic_id: basic.id,
      bill_no: basic.bill_no || `STMT-${basic.id}`,
      student_id: s.id,
      student_name: studentName(s),
      reg_no: s.reg_no,
      class_id: basic.class_id,
      program_id: basic.program_id,
      session_id: basic.session_id,
      discount_type: typeLabel,
      discount_amount: Math.round(totalDisc * 100) / 100,
      discount_percentage: pct,
      original_amount: Math.round(original * 100) / 100,
      final_amount: Math.round(finalAmount * 100) / 100,
      applied_at: appliedAt ? appliedAt.toISOString() : null,
      status: basic.status || "Active",
    });
  }

  const total = rows.length;
  return {
    summary: {
      total_discount_amount: Math.round(totalDiscount * 100) / 100,
      students_with_discount: studentSet.size,
      record_count: total,
      by_type: Object.entries(byType).map(([type, v]) => ({
        type,
        count: v.count,
        amount: Math.round(v.amount * 100) / 100,
      })),
      by_class: Object.entries(byClass).map(([class_id, v]) => ({
        class_id,
        count: v.count,
        amount: Math.round(v.amount * 100) / 100,
      })),
    },
    items: rows.slice(skip, skip + limit),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

// ── Defaulters (Module 5 overdue + grace expired) ────────────────────────────

export const getDefaultersReport = async (filters: ReportFilters) => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 50, 200);
  const skip = (page - 1) * limit;
  const rules = await loadActiveRules();

  const where: Record<string, unknown> = {
    student_id: { not: null },
    fee_due_date_end: { not: null },
  };
  if (filters.branch_id) where.branch_id = filters.branch_id;
  if (filters.session_id) where.session_id = filters.session_id;
  if (filters.program_id) where.program_id = filters.program_id;
  if (filters.class_id) where.class_id = filters.class_id;
  if (filters.class_ids && filters.class_ids.length) {
    where.class_id = { in: filters.class_ids };
  }
  if (filters.student_id) where.student_id = filters.student_id;

  const basics = await prisma.feeMasterBasics.findMany({
    where,
    orderBy: { fee_due_date_end: "asc" },
    take: 3000,
  });
  const active = basics.filter((b) => isActiveBasic(b.status));
  const basicIds = active.map((b) => b.id);
  const lines =
    basicIds.length > 0
      ? await prisma.feeMasters.findMany({
          where: { fee_master_basic_id_fk: { in: basicIds } },
        })
      : [];

  const studentIds = [
    ...new Set(active.map((b) => b.student_id).filter(Boolean)),
  ] as number[];
  const students = studentIds.length
    ? await prisma.students.findMany({
        where: {
          id: { in: studentIds },
          deleted_at: null,
          ...(filters.search
            ? {
                OR: [
                  { first_name: { contains: filters.search, mode: "insensitive" } },
                  { last_name: { contains: filters.search, mode: "insensitive" } },
                  { reg_no: { contains: filters.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          reg_no: true,
          class_id: true,
          program_id: true,
        },
      })
    : [];
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  // last payment dates
  const lastPayments =
    studentIds.length > 0
      ? await prisma.feeCollections.findMany({
          where: {
            students_id: { in: studentIds },
            active_status: 1,
            cancel_voucher: { not: "Yes" },
          },
          select: { students_id: true, paid_date: true, created_at: true },
          orderBy: { id: "desc" },
          take: 5000,
        })
      : [];
  const lastPayMap: Record<number, string | null> = {};
  for (const p of lastPayments) {
    if (lastPayMap[p.students_id]) continue;
    lastPayMap[p.students_id] = p.paid_date || toDateOnly(p.created_at);
  }

  const rows: Array<Record<string, unknown>> = [];

  for (const basic of active) {
    if (!basic.student_id || !studentMap[basic.student_id]) continue;
    const blines = lines.filter((l) => l.fee_master_basic_id_fk === basic.id);
    const late = await computeLateFeeForBasic(basic, blines, rules);

    // Defaulter per Module 5: past grace period with outstanding (status Overdue)
    if (late.payment_status !== "Overdue") continue;
    if (late.outstanding_balance <= 0) continue;

    const original =
      num(basic.total_fee) ||
      blines.reduce((s, l) => s + num(l.fee_amount), 0) ||
      num(basic.basic_fee);
    const s = studentMap[basic.student_id]!;

    rows.push({
      fee_master_basic_id: basic.id,
      bill_no: basic.bill_no || `STMT-${basic.id}`,
      student_id: s.id,
      student_name: studentName(s),
      reg_no: s.reg_no,
      class_id: basic.class_id || s.class_id,
      program_id: basic.program_id || s.program_id,
      original_amount: Math.round(original * 100) / 100,
      paid_amount: late.paid_amount,
      outstanding_amount: late.outstanding_balance,
      due_date: late.due_date,
      grace_period_days: late.grace_period_days,
      late_fee_starts_on: late.late_fee_starts_on,
      days_overdue: late.days_overdue,
      late_fee: late.late_fee_amount,
      total_amount_due: late.total_outstanding_with_late,
      last_payment_date: lastPayMap[s.id] || null,
      status: late.payment_status,
      rule_name: late.rule?.name || null,
    });
  }

  const sort = filters.sort || "overdue_desc";
  rows.sort((a, b) => {
    if (sort === "overdue_desc")
      return num(b.days_overdue) - num(a.days_overdue);
    if (sort === "outstanding_desc")
      return num(b.outstanding_amount) - num(a.outstanding_amount);
    if (sort === "name_asc")
      return String(a.student_name).localeCompare(String(b.student_name));
    return 0;
  });

  const total = rows.length;
  return {
    summary: {
      defaulter_count: total,
      total_outstanding: Math.round(
        rows.reduce((s, r) => s + num(r.outstanding_amount), 0) * 100
      ) / 100,
      total_late_fees: Math.round(
        rows.reduce((s, r) => s + num(r.late_fee), 0) * 100
      ) / 100,
      total_amount_due: Math.round(
        rows.reduce((s, r) => s + num(r.total_amount_due), 0) * 100
      ) / 100,
    },
    items: rows.slice(skip, skip + limit),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

// ── Workspace ────────────────────────────────────────────────────────────────

export const getReportingWorkspace = async (filters: ReportFilters) => {
  const analytics = await getReportingAnalytics(filters);
  return {
    analytics,
    available_reports: [
      { key: "analytics", label: "Analytics Dashboard" },
      { key: "collections", label: "Collection Reports" },
      { key: "outstanding", label: "Outstanding Dues" },
      { key: "discounts", label: "Discount & Concession Reports" },
      { key: "defaulters", label: "Defaulters List" },
      { key: "audit", label: "Audit Trail" },
    ],
  };
};

export { listFeeAuditTrail };
