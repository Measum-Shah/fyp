import { prisma } from "../../../config/db";
import { AppError } from "../utils/fee.helpers";
import {
  LATE_FEE_CALC_TYPES,
  LATE_FEE_RULE_STATUS,
  LATE_FEE_SETTINGS_IDENTITY,
  type LateFeeCalculationType,
  type LateFeeRuleStatus,
} from "../constants/lateFee.constants";

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export type LateFeeRule = {
  id: number;
  name: string;
  branch_id?: number | null;
  program_id?: number | null;
  class_id?: number | null;
  calculation_type: LateFeeCalculationType;
  fixed_amount?: number | null;
  percentage?: number | null;
  per_day_amount?: number | null;
  max_cap?: number | null;
  grace_period_days: number;
  effective_from?: string | null;
  effective_to?: string | null;
  status: LateFeeRuleStatus;
  created_at?: string;
  updated_at?: string;
};

type LateFeeConfig = {
  rules: LateFeeRule[];
  next_rule_id: number;
};

export type LateFeeComputation = {
  applicable: boolean;
  late_fee_amount: number;
  outstanding_balance: number;
  total_outstanding_with_late: number;
  original_fee_amount: number;
  paid_amount: number;
  due_date: string | null;
  due_date_start: string | null;
  grace_period_days: number;
  late_fee_starts_on: string | null;
  days_in_grace_remaining: number;
  days_overdue: number;
  payment_status: "Paid" | "Partial" | "Unpaid" | "Overdue" | "In Grace";
  rule: Pick<
    LateFeeRule,
    "id" | "name" | "calculation_type" | "grace_period_days" | "max_cap"
  > | null;
  reason?: string;
};

const defaultConfig = (): LateFeeConfig => ({ rules: [], next_rule_id: 1 });

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const toDateOnlyString = (d: Date) => {
  const x = startOfDay(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const diffDays = (from: Date, to: Date) => {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};

/** Due 10 Aug + 5 grace days → late fee starts 16 Aug */
export const getLateFeeStartDate = (dueDate: Date, graceDays: number) => {
  const d = startOfDay(dueDate);
  d.setDate(d.getDate() + graceDays + 1);
  return d;
};

/**
 * Accepts numeric IDs or displayed statement refs like `STMT-12`.
 * Does not hardcode any statement — resolves dynamically.
 */
export const parseFeeStatementBasicId = (raw: string | number): number => {
  const s = String(raw ?? "").trim();
  if (!s) {
    throw new AppError(
      "Enter a fee statement ID (numeric or STMT-{id}).",
      400
    );
  }
  const stmtMatch = /^STMT-(\d+)$/i.exec(s);
  if (stmtMatch) {
    const id = Number(stmtMatch[1]);
    if (!Number.isFinite(id) || id <= 0) {
      throw new AppError("Invalid STMT reference.", 400);
    }
    return id;
  }
  if (!/^\d+$/.test(s)) {
    throw new AppError(
      "Invalid fee statement ID. Use a numeric ID or STMT-{id} (e.g. STMT-12).",
      400
    );
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) {
    throw new AppError("Invalid fee statement ID.", 400);
  }
  return n;
};

const parseConfig = (raw: string | null | undefined): LateFeeConfig => {
  if (!raw) return defaultConfig();
  try {
    const parsed = JSON.parse(raw) as Partial<LateFeeConfig>;
    return {
      rules: Array.isArray(parsed.rules) ? parsed.rules : [],
      next_rule_id: parsed.next_rule_id && parsed.next_rule_id > 0 ? parsed.next_rule_id : 1,
    };
  } catch {
    return defaultConfig();
  }
};

const serializeConfig = (config: LateFeeConfig) => JSON.stringify(config);

const getSettingsRow = async () =>
  prisma.paymentSettings.findFirst({
    where: { identity: LATE_FEE_SETTINGS_IDENTITY },
  });

const ensureSettingsRow = async () => {
  const existing = await getSettingsRow();
  if (existing) return existing;

  return prisma.paymentSettings.create({
    data: {
      identity: LATE_FEE_SETTINGS_IDENTITY,
      logo: "fee",
      link: "-",
      config: serializeConfig(defaultConfig()),
      status: 0,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

const saveConfig = async (config: LateFeeConfig) => {
  const row = await ensureSettingsRow();
  return prisma.paymentSettings.update({
    where: { id: row.id },
    data: {
      config: serializeConfig(config),
      updated_at: new Date(),
    },
  });
};

const ruleMatchesContext = (
  rule: LateFeeRule,
  ctx: {
    branch_id?: number | null;
    program_id?: number | null;
    class_id?: number | null;
    asOf: Date;
  }
) => {
  if (rule.status !== LATE_FEE_RULE_STATUS.ACTIVE) return false;
  if (rule.branch_id && rule.branch_id !== ctx.branch_id) return false;
  if (rule.program_id && rule.program_id !== ctx.program_id) return false;
  if (rule.class_id && rule.class_id !== ctx.class_id) return false;

  if (rule.effective_from) {
    const from = startOfDay(new Date(rule.effective_from));
    if (ctx.asOf < from) return false;
  }
  if (rule.effective_to) {
    const to = startOfDay(new Date(rule.effective_to));
    if (ctx.asOf > to) return false;
  }
  return true;
};

const pickRule = (
  rules: LateFeeRule[],
  ctx: {
    branch_id?: number | null;
    program_id?: number | null;
    class_id?: number | null;
    asOf: Date;
  }
): LateFeeRule | null => {
  const candidates = rules.filter((r) => ruleMatchesContext(r, ctx));
  if (!candidates.length) return null;

  const score = (r: LateFeeRule) =>
    (r.class_id ? 4 : 0) + (r.program_id ? 2 : 0) + (r.branch_id ? 1 : 0);

  // Most specific scope wins; ties broken by higher rule id (deterministic).
  return (
    candidates.sort((a, b) => {
      const diff = score(b) - score(a);
      if (diff !== 0) return diff;
      return b.id - a.id;
    })[0] ?? null
  );
};

const applyCap = (amount: number, cap?: number | null) => {
  if (cap === null || cap === undefined) return Math.round(amount * 100) / 100;
  return Math.round(Math.min(amount, cap) * 100) / 100;
};

export const computeLateFee = (input: {
  dueAmount: number;
  paidAmount: number;
  dueDateEnd: Date | null;
  dueDateStart?: Date | null;
  rule: LateFeeRule | null;
  asOf?: Date;
}): LateFeeComputation => {
  const asOf = startOfDay(input.asOf ?? new Date());
  const outstanding = Math.max(0, input.dueAmount - input.paidAmount);
  const base: LateFeeComputation = {
    applicable: false,
    late_fee_amount: 0,
    outstanding_balance: outstanding,
    total_outstanding_with_late: outstanding,
    original_fee_amount: input.dueAmount,
    paid_amount: input.paidAmount,
    due_date: input.dueDateEnd ? toDateOnlyString(startOfDay(input.dueDateEnd)) : null,
    due_date_start: input.dueDateStart
      ? toDateOnlyString(startOfDay(input.dueDateStart))
      : null,
    grace_period_days: input.rule?.grace_period_days ?? 0,
    late_fee_starts_on: null,
    days_in_grace_remaining: 0,
    days_overdue: 0,
    payment_status: "Unpaid",
    rule: null,
  };

  if (outstanding <= 0) {
    return { ...base, payment_status: "Paid", reason: "Fully paid" };
  }

  if (!input.dueDateEnd) {
    return { ...base, payment_status: outstanding > 0 && input.paidAmount > 0 ? "Partial" : "Unpaid", reason: "No due date" };
  }

  const dueEnd = startOfDay(input.dueDateEnd);
  const graceDays = input.rule?.grace_period_days ?? 0;
  const lateStart = getLateFeeStartDate(dueEnd, graceDays);

  base.grace_period_days = graceDays;
  base.late_fee_starts_on = toDateOnlyString(lateStart);

  if (asOf < dueEnd) {
    return {
      ...base,
      payment_status: input.paidAmount > 0 ? "Partial" : "Unpaid",
      reason: "Not yet due",
    };
  }

  if (asOf.getTime() === dueEnd.getTime()) {
    const daysLeft = Math.max(0, diffDays(asOf, lateStart));
    return {
      ...base,
      payment_status: graceDays > 0 ? "In Grace" : input.paidAmount > 0 ? "Partial" : "Unpaid",
      days_in_grace_remaining: graceDays > 0 ? daysLeft : 0,
      reason: "Due today",
      rule: input.rule
        ? {
            id: input.rule.id,
            name: input.rule.name,
            calculation_type: input.rule.calculation_type,
            grace_period_days: input.rule.grace_period_days,
            max_cap: input.rule.max_cap ?? null,
          }
        : null,
    };
  }

  if (asOf < lateStart) {
    const daysLeft = diffDays(asOf, lateStart);
    return {
      ...base,
      payment_status: "In Grace",
      days_in_grace_remaining: daysLeft,
      reason: "Within grace period",
      rule: input.rule
        ? {
            id: input.rule.id,
            name: input.rule.name,
            calculation_type: input.rule.calculation_type,
            grace_period_days: input.rule.grace_period_days,
            max_cap: input.rule.max_cap ?? null,
          }
        : null,
    };
  }

  if (!input.rule) {
    return {
      ...base,
      payment_status: "Overdue",
      days_overdue: diffDays(lateStart, asOf) + 1,
      reason: "Overdue — no active late fee rule",
    };
  }

  const daysOverdue = diffDays(lateStart, asOf) + 1;
  let lateFee = 0;

  switch (input.rule.calculation_type) {
    case LATE_FEE_CALC_TYPES.FIXED:
      lateFee = num(input.rule.fixed_amount);
      break;
    case LATE_FEE_CALC_TYPES.PERCENT:
      lateFee = (outstanding * num(input.rule.percentage)) / 100;
      break;
    case LATE_FEE_CALC_TYPES.PER_DAY:
      lateFee = daysOverdue * num(input.rule.per_day_amount);
      break;
    default:
      lateFee = 0;
  }

  lateFee = applyCap(lateFee, input.rule.max_cap);

  return {
    applicable: lateFee > 0,
    late_fee_amount: lateFee,
    outstanding_balance: outstanding,
    total_outstanding_with_late: Math.round((outstanding + lateFee) * 100) / 100,
    original_fee_amount: input.dueAmount,
    paid_amount: input.paidAmount,
    due_date: toDateOnlyString(dueEnd),
    due_date_start: base.due_date_start,
    grace_period_days: graceDays,
    late_fee_starts_on: toDateOnlyString(lateStart),
    days_in_grace_remaining: 0,
    days_overdue: daysOverdue,
    payment_status: "Overdue",
    reason:
      lateFee > 0
        ? `Overdue — ${input.rule.calculation_type} late fee applied`
        : "Overdue — calculated late fee is 0",
    rule: {
      id: input.rule.id,
      name: input.rule.name,
      calculation_type: input.rule.calculation_type,
      grace_period_days: input.rule.grace_period_days,
      max_cap: input.rule.max_cap ?? null,
    },
  };
};

export const listLateFeeRules = async (params?: {
  branch_id?: number;
  status?: string;
}) => {
  const row = await ensureSettingsRow();
  const config = parseConfig(row.config);
  let rules = config.rules;
  if (params?.branch_id) {
    rules = rules.filter((r) => !r.branch_id || r.branch_id === params.branch_id);
  }
  if (params?.status) {
    rules = rules.filter((r) => r.status === params.status);
  }
  return rules.sort((a, b) => b.id - a.id);
};

export const getLateFeeRulesConfig = async () => {
  const row = await ensureSettingsRow();
  return {
    settings_row_id: row.id,
    rules: parseConfig(row.config).rules,
  };
};

export const createLateFeeRule = async (
  data: Omit<LateFeeRule, "id" | "created_at" | "updated_at">
) => {
  const row = await ensureSettingsRow();
  const config = parseConfig(row.config);
  const now = new Date().toISOString();
  const rule: LateFeeRule = {
    ...data,
    id: config.next_rule_id,
    grace_period_days: data.grace_period_days ?? 0,
    created_at: now,
    updated_at: now,
  };
  config.rules.push(rule);
  config.next_rule_id += 1;
  await saveConfig(config);
  return rule;
};

export const updateLateFeeRule = async (
  id: number,
  data: Partial<Omit<LateFeeRule, "id" | "created_at">>
) => {
  const row = await ensureSettingsRow();
  const config = parseConfig(row.config);
  const idx = config.rules.findIndex((r) => r.id === id);
  if (idx < 0) throw new AppError("Late fee rule not found", 404);

  config.rules[idx] = {
    ...config.rules[idx]!,
    ...data,
    updated_at: new Date().toISOString(),
  };
  await saveConfig(config);
  return config.rules[idx];
};

export const setLateFeeRuleStatus = async (id: number, status: LateFeeRuleStatus) => {
  return updateLateFeeRule(id, { status });
};

export const deleteLateFeeRule = async (id: number) => {
  const row = await ensureSettingsRow();
  const config = parseConfig(row.config);
  const before = config.rules.length;
  config.rules = config.rules.filter((r) => r.id !== id);
  if (config.rules.length === before) {
    throw new AppError("Late fee rule not found", 404);
  }
  await saveConfig(config);
  return { deleted: true };
};

export const loadActiveRules = async () => {
  const rules = await listLateFeeRules({ status: LATE_FEE_RULE_STATUS.ACTIVE });
  return rules;
};

export const computeLateFeeForBasic = async (
  basic: {
    id: number;
    branch_id?: number | null;
    program_id?: number | null;
    class_id?: number | null;
    total_after_discount?: string | null;
    total_fee?: string | null;
    fee_due_date_end?: Date | null;
    fee_due_date_start?: Date | null;
  },
  lines: Array<{ fee_amount?: number | null; fee_paid_amount?: number | null }>,
  rules?: LateFeeRule[],
  asOf?: Date
): Promise<LateFeeComputation> => {
  const ruleList = rules ?? (await loadActiveRules());
  const due =
    num(basic.total_after_discount) ||
    num(basic.total_fee) ||
    lines.reduce((s, l) => s + num(l.fee_amount), 0);
  const paid = lines.reduce((s, l) => s + num(l.fee_paid_amount), 0);

  const rule = pickRule(ruleList, {
    branch_id: basic.branch_id,
    program_id: basic.program_id,
    class_id: basic.class_id,
    asOf: startOfDay(asOf ?? new Date()),
  });

  return computeLateFee({
    dueAmount: due,
    paidAmount: paid,
    dueDateEnd: basic.fee_due_date_end ?? null,
    dueDateStart: basic.fee_due_date_start ?? null,
    rule,
    asOf,
  });
};

export const previewLateFee = async (
  feeMasterBasicIdRaw: string | number,
  asOfDate?: string
) => {
  const feeMasterBasicId = parseFeeStatementBasicId(feeMasterBasicIdRaw);
  const basic = await prisma.feeMasterBasics.findUnique({
    where: { id: feeMasterBasicId },
  });
  if (!basic) {
    throw new AppError(
      `Fee statement not found for ${String(feeMasterBasicIdRaw).trim() || feeMasterBasicId}.`,
      404
    );
  }

  const lines = await prisma.feeMasters.findMany({
    where: { fee_master_basic_id_fk: basic.id },
  });

  const calc = await computeLateFeeForBasic(
    basic,
    lines,
    undefined,
    asOfDate ? new Date(asOfDate) : undefined
  );

  const statementRef = String(basic.bill_no || `STMT-${basic.id}`);
  return {
    ...calc,
    statement: {
      id: basic.id,
      bill_no: basic.bill_no,
      statement_ref: statementRef,
    },
    calculation_type: calc.rule?.calculation_type ?? null,
    matched_rule_name: calc.rule?.name ?? null,
  };
};

export const listLateFeeIncidents = async (params: {
  branch_id?: number;
  program_id?: number;
  class_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    student_id: { not: null },
    OR: [{ status: { in: ["1", "Active"] } }, { status: null }],
  };
  if (params.branch_id) where.branch_id = params.branch_id;
  if (params.program_id) where.program_id = params.program_id;
  if (params.class_id) where.class_id = params.class_id;

  const [basics, rules] = await Promise.all([
    prisma.feeMasterBasics.findMany({
      where,
      orderBy: { id: "desc" },
      take: 500,
    }),
    loadActiveRules(),
  ]);

  const studentIds = [
    ...new Set(basics.map((b) => b.student_id).filter(Boolean)),
  ] as number[];

  const students = studentIds.length
    ? await prisma.students.findMany({
        where: {
          id: { in: studentIds },
          deleted_at: null,
          ...(params.search
            ? {
                OR: [
                  { first_name: { contains: params.search, mode: "insensitive" } },
                  { last_name: { contains: params.search, mode: "insensitive" } },
                  { reg_no: { contains: params.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          reg_no: true,
          branch_id: true,
          program_id: true,
          class_id: true,
        },
      })
    : [];

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));
  const basicIds = basics.map((b) => b.id);
  const allLines = basicIds.length
    ? await prisma.feeMasters.findMany({
        where: { fee_master_basic_id_fk: { in: basicIds } },
      })
    : [];

  const incidents: Array<Record<string, unknown>> = [];

  for (const basic of basics) {
    if (!basic.student_id || !studentMap[basic.student_id]) continue;
    const lines = allLines.filter((l) => l.fee_master_basic_id_fk === basic.id);
    const calc = await computeLateFeeForBasic(basic, lines, rules);
    if (calc.late_fee_amount <= 0 && calc.payment_status !== "In Grace") continue;
    if (calc.payment_status === "Paid") continue;

    const student = studentMap[basic.student_id]!;
    incidents.push({
      fee_master_basic_id: basic.id,
      bill_no: basic.bill_no,
      student: {
        id: student.id,
        name: [student.first_name, student.last_name].filter(Boolean).join(" ").trim(),
        reg_no: student.reg_no,
      },
      ...calc,
    });
  }

  const filtered = params.search
    ? incidents.filter((i) => {
        const s = i.student as { name?: string; reg_no?: string };
        const q = params.search!.toLowerCase();
        return (
          s.name?.toLowerCase().includes(q) ||
          s.reg_no?.toLowerCase().includes(q) ||
          String(i.bill_no || "").toLowerCase().includes(q)
        );
      })
    : incidents;

  const total = filtered.length;
  const items = filtered.slice(skip, skip + limit);

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

export const getLateFeeWorkspace = async (branchId?: number) => {
  const [rules, incidents] = await Promise.all([
    listLateFeeRules(branchId ? { branch_id: branchId } : undefined),
    listLateFeeIncidents({
      branch_id: branchId,
      page: 1,
      limit: 10,
    }),
  ]);

  const activeRules = rules.filter((r) => r.status === LATE_FEE_RULE_STATUS.ACTIVE);
  const withLateFee = incidents.items.filter(
    (i) => Number((i as { late_fee_amount?: number }).late_fee_amount || 0) > 0
  );
  const inGrace = incidents.items.filter(
    (i) => (i as { payment_status?: string }).payment_status === "In Grace"
  );

  return {
    summary: {
      total_rules: rules.length,
      active_rules: activeRules.length,
      fees_with_late_fee: withLateFee.length,
      fees_in_grace: inGrace.length,
    },
    rules,
    recent_incidents: incidents.items,
  };
};
