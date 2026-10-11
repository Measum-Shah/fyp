import { prisma } from "../../../config/db";
import { postJournalEntry } from "../../accountsModule/services/posting.service";
import { AppError } from "../utils/fee.helpers";
import {
  getStudentFeeDashboard,
  getInvoiceView,
  getReceiptView,
} from "./studentFeeRecord.service";

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const MODE_PREFIX = {
  PERCENT: "[PERCENT]",
  FIXED: "[FIXED]",
} as const;

type CalcMode = "PERCENT" | "FIXED";

const encodeDescription = (mode: CalcMode, text?: string | null) => {
  const body = (text || "").trim().slice(0, 170);
  return `${MODE_PREFIX[mode]}${body ? ` ${body}` : ""}`.slice(0, 191);
};

const decodeDescription = (raw: string) => {
  if (raw.startsWith(MODE_PREFIX.FIXED)) {
    return {
      calculation_mode: "FIXED" as CalcMode,
      description: raw.slice(MODE_PREFIX.FIXED.length).trim(),
    };
  }
  if (raw.startsWith(MODE_PREFIX.PERCENT)) {
    return {
      calculation_mode: "PERCENT" as CalcMode,
      description: raw.slice(MODE_PREFIX.PERCENT.length).trim(),
    };
  }
  // Legacy Module 2 rows without prefix → treat as percentage
  return { calculation_mode: "PERCENT" as CalcMode, description: raw };
};

const mapDiscountType = (row: {
  id: number;
  name: string;
  description: string;
  percentage: number;
  status: string;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}) => {
  const decoded = decodeDescription(row.description);
  return {
    ...row,
    calculation_mode: decoded.calculation_mode,
    description: decoded.description,
    value: row.percentage,
    display_label:
      decoded.calculation_mode === "FIXED"
        ? `${row.name} (Fixed ₨ ${row.percentage})`
        : `${row.name} (${row.percentage}%)`,
  };
};

const computeDiscountAmount = (
  mode: CalcMode,
  value: number,
  gross: number
) => {
  if (mode === "PERCENT") return Math.round(((gross * value) / 100) * 100) / 100;
  return Math.round(value * 100) / 100;
};

const getGrossPayable = async (basicId: number) => {
  const basic = await prisma.feeMasterBasics.findUnique({ where: { id: basicId } });
  if (!basic) throw new AppError("Fee statement not found", 404);
  const lines = await prisma.feeMasters.findMany({
    where: { fee_master_basic_id_fk: basicId },
  });
  const gross =
    num(basic.total_fee) ||
    lines.reduce((s, l) => s + num(l.fee_amount), 0) ||
    num(basic.basic_fee);
  const paid = lines.reduce((s, l) => s + num(l.fee_paid_amount), 0);
  return { basic, lines, gross, paid };
};

const getActiveScholarshipLimit = async (opts: {
  session_id?: number | null;
  branch_id?: number | null;
  program_id?: number | null;
}) => {
  const settings = await prisma.scholarshipSettings.findMany({
    where: { status: 1 },
    orderBy: { id: "desc" },
  });
  const match =
    settings.find(
      (s) =>
        (!opts.session_id || !s.session_id || s.session_id === opts.session_id) &&
        (!opts.branch_id || !s.branch_id || s.branch_id === opts.branch_id) &&
        (!opts.program_id || !s.program_id || s.program_id === opts.program_id)
    ) || settings[0];
  return match?.maximum_limit ?? 100;
};

// ── Discount Types ────────────────────────────────────────────────────────────

export const listDiscountTypesAdmin = async (params?: {
  search?: string;
  status?: string;
}) => {
  const where: Record<string, unknown> = { deleted_by: null };
  if (params?.status) where.status = params.status;
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }
  const items = await prisma.discountTypes.findMany({
    where,
    orderBy: { id: "asc" },
  });
  return items.map(mapDiscountType);
};

export const createDiscountType = async (
  data: {
    name: string;
    description?: string | null;
    calculation_mode: CalcMode;
    value: number;
    status?: string;
  },
  userId: number
) => {
  const name = data.name.trim();
  const dup = await prisma.discountTypes.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, deleted_by: null },
  });
  if (dup) throw new AppError("A discount type with this name already exists");

  const created = await prisma.discountTypes.create({
    data: {
      name,
      description: encodeDescription(data.calculation_mode, data.description),
      percentage: Math.round(data.value),
      status: data.status || "Active",
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  return mapDiscountType(created);
};

export const updateDiscountType = async (
  id: number,
  data: Partial<{
    name: string;
    description: string | null;
    calculation_mode: CalcMode;
    value: number;
    status: string;
  }>,
  userId: number
) => {
  const existing = await prisma.discountTypes.findUnique({ where: { id } });
  if (!existing || existing.deleted_by) {
    throw new AppError("Discount type not found", 404);
  }

  if (data.name) {
    const dup = await prisma.discountTypes.findFirst({
      where: {
        id: { not: id },
        name: { equals: data.name.trim(), mode: "insensitive" },
        deleted_by: null,
      },
    });
    if (dup) throw new AppError("A discount type with this name already exists");
  }

  const decoded = decodeDescription(existing.description);
  const mode = data.calculation_mode || decoded.calculation_mode;
  const descText =
    data.description !== undefined ? data.description : decoded.description;

  const updated = await prisma.discountTypes.update({
    where: { id },
    data: {
      name: data.name?.trim() ?? existing.name,
      description: encodeDescription(mode, descText),
      percentage:
        data.value !== undefined ? Math.round(data.value) : existing.percentage,
      status: data.status ?? existing.status,
      updated_by: userId,
      updated_at: new Date(),
    },
  });
  return mapDiscountType(updated);
};

export const setDiscountTypeStatus = async (
  id: number,
  status: "Active" | "Inactive",
  userId: number
) => {
  const existing = await prisma.discountTypes.findUnique({ where: { id } });
  if (!existing || existing.deleted_by) {
    throw new AppError("Discount type not found", 404);
  }
  const updated = await prisma.discountTypes.update({
    where: { id },
    data: { status, updated_by: userId, updated_at: new Date() },
  });
  return mapDiscountType(updated);
};

// ── Scholarship Catalog (fee_scholarship_definations + details) ───────────────

export const listScholarshipCatalog = async (params?: {
  branch_id?: number;
  session_id?: number;
  program_id?: number;
  status?: string;
  search?: string;
}) => {
  const where: Record<string, unknown> = {};
  if (params?.branch_id) where.branch_id = params.branch_id;
  if (params?.session_id) where.session_id = params.session_id;
  if (params?.program_id) where.program_id = params.program_id;
  if (params?.status) where.status = params.status;
  if (params?.search) {
    where.title = { contains: params.search, mode: "insensitive" };
  }

  const items = await prisma.feeScholarshipDefinations.findMany({
    where,
    orderBy: { id: "desc" },
  });
  const ids = items.map((i) => i.id);
  const details = ids.length
    ? await prisma.feeScholarshipDetails.findMany({
        where: { fsd_id: { in: ids } },
        orderBy: { id: "asc" },
      })
    : [];
  const headIds = [...new Set(details.map((d) => d.fee_head_id))];
  const heads = headIds.length
    ? await prisma.feeHeads.findMany({ where: { id: { in: headIds } } })
    : [];
  const headMap = Object.fromEntries(heads.map((h) => [h.id, h]));

  return items.map((item) => ({
    ...item,
    term_percentage_num: num(item.term_percentage),
    details: details
      .filter((d) => d.fsd_id === item.id)
      .map((d) => ({
        ...d,
        fee_head: headMap[d.fee_head_id] || null,
      })),
  }));
};

export const getScholarshipCatalogById = async (id: number) => {
  const list = await listScholarshipCatalog({});
  const item = list.find((i) => i.id === id);
  if (!item) throw new AppError("Scholarship definition not found", 404);
  return item;
};

export const createScholarshipCatalog = async (
  data: {
    session_id: number;
    branch_id: number;
    program_id: number;
    title: string;
    no_of_a: number;
    term_percentage: number;
    status?: string;
    details?: Array<{
      fee_head_id: number;
      discount_percentage: number;
      status?: string;
    }>;
  },
  userId: number
) => {
  const title = data.title.trim();
  const dup = await prisma.feeScholarshipDefinations.findFirst({
    where: {
      branch_id: data.branch_id,
      session_id: data.session_id,
      program_id: data.program_id,
      title: { equals: title, mode: "insensitive" },
    },
  });
  if (dup) {
    throw new AppError(
      "A scholarship with this title already exists for the selected branch/session/program"
    );
  }

  if (data.details?.length) {
    const headIds = data.details.map((d) => d.fee_head_id);
    const found = await prisma.feeHeads.findMany({
      where: { id: { in: headIds } },
    });
    if (found.length !== new Set(headIds).size) {
      throw new AppError("One or more fee heads are invalid");
    }
  }

  const maxPct = Math.max(
    data.term_percentage,
    ...(data.details || []).map((d) => d.discount_percentage)
  );
  const limit = await getActiveScholarshipLimit({
    session_id: data.session_id,
    branch_id: data.branch_id,
    program_id: data.program_id,
  });
  if (maxPct > limit) {
    throw new AppError(
      `Scholarship percentage ${maxPct}% exceeds maximum limit of ${limit}%`
    );
  }

  const created = await prisma.feeScholarshipDefinations.create({
    data: {
      session_id: data.session_id,
      branch_id: data.branch_id,
      program_id: data.program_id,
      title,
      no_of_a: data.no_of_a,
      term_percentage: String(data.term_percentage),
      status: data.status || "1",
      created_by: userId,
      last_updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  if (data.details?.length) {
    await prisma.feeScholarshipDetails.createMany({
      data: data.details.map((d) => ({
        fsd_id: created.id,
        fee_head_id: d.fee_head_id,
        discount_percentage: d.discount_percentage,
        status: d.status || "1",
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      })),
    });
  }

  // GL Posting Trigger on Scholarship/Discount Policy Approval
  try {
    const discountExpenseAcc =
      (await prisma.accAccount.findFirst({ where: { code: "5020" } })) ||
      (await prisma.accAccount.findFirst({ where: { type: "EXPENSE" } }));
    const studentReceivableAcc =
      (await prisma.accAccount.findFirst({ where: { code: "1020" } })) ||
      (await prisma.accAccount.findFirst({ where: { type: "ASSET" } }));

    if (discountExpenseAcc && studentReceivableAcc) {
      await postJournalEntry({
        sourceModule: "FEE",
        sourceReferenceType: "DISCOUNT_APPROVED",
        sourceReferenceId: created.id,
        voucherType: "GJV",
        narration: `Discount/Scholarship Approved: ${title}`,
        lines: [
          { account_id: discountExpenseAcc.id, debit: Number(data.term_percentage || 0), credit: 0, description: `Scholarship/Discount Expense (${title})` },
          { account_id: studentReceivableAcc.id, debit: 0, credit: Number(data.term_percentage || 0), description: `Student Receivable Concession Adjustment` },
        ],
        autoPost: false, // DRAFT for accountant review
      });
    }
  } catch (glErr) {
    console.error("GL Posting Trigger Failed (Discount Approval):", glErr);
  }

  return getScholarshipCatalogById(created.id);
};

export const updateScholarshipCatalog = async (
  id: number,
  data: Partial<{
    session_id: number;
    branch_id: number;
    program_id: number;
    title: string;
    no_of_a: number;
    term_percentage: number;
    status: string;
    details: Array<{
      fee_head_id: number;
      discount_percentage: number;
      status?: string;
    }>;
  }>,
  userId: number
) => {
  const existing = await prisma.feeScholarshipDefinations.findUnique({
    where: { id },
  });
  if (!existing) throw new AppError("Scholarship definition not found", 404);

  const session_id = data.session_id ?? existing.session_id;
  const branch_id = data.branch_id ?? existing.branch_id;
  const program_id = data.program_id ?? existing.program_id;
  const title = data.title?.trim() ?? existing.title;
  const termPct =
    data.term_percentage !== undefined
      ? data.term_percentage
      : num(existing.term_percentage);

  if (data.title || data.branch_id || data.session_id || data.program_id) {
    const dup = await prisma.feeScholarshipDefinations.findFirst({
      where: {
        id: { not: id },
        branch_id,
        session_id,
        program_id,
        title: { equals: title, mode: "insensitive" },
      },
    });
    if (dup) {
      throw new AppError(
        "A scholarship with this title already exists for the selected branch/session/program"
      );
    }
  }

  const detailPcts = (data.details || []).map((d) => d.discount_percentage);
  const maxPct = Math.max(termPct, ...detailPcts, 0);
  const limit = await getActiveScholarshipLimit({
    session_id,
    branch_id,
    program_id,
  });
  if (maxPct > limit) {
    throw new AppError(
      `Scholarship percentage ${maxPct}% exceeds maximum limit of ${limit}%`
    );
  }

  await prisma.feeScholarshipDefinations.update({
    where: { id },
    data: {
      session_id,
      branch_id,
      program_id,
      title,
      no_of_a: data.no_of_a ?? existing.no_of_a,
      term_percentage: String(termPct),
      status: data.status ?? existing.status,
      last_updated_by: userId,
      updated_at: new Date(),
    },
  });

  if (data.details) {
    await prisma.feeScholarshipDetails.deleteMany({ where: { fsd_id: id } });
    if (data.details.length) {
      await prisma.feeScholarshipDetails.createMany({
        data: data.details.map((d) => ({
          fsd_id: id,
          fee_head_id: d.fee_head_id,
          discount_percentage: d.discount_percentage,
          status: d.status || "1",
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        })),
      });
    }
  }

  return getScholarshipCatalogById(id);
};

export const setScholarshipCatalogStatus = async (
  id: number,
  status: "1" | "0",
  userId: number
) => {
  const existing = await prisma.feeScholarshipDefinations.findUnique({
    where: { id },
  });
  if (!existing) throw new AppError("Scholarship definition not found", 404);
  await prisma.feeScholarshipDefinations.update({
    where: { id },
    data: { status, last_updated_by: userId, updated_at: new Date() },
  });
  return getScholarshipCatalogById(id);
};

// ── Scholarship Rules (fee_scholarship_defination singular) ───────────────────

export const listScholarshipRules = async (params?: {
  branch_id?: number;
  session_id?: number;
  program_id?: number;
  class_id?: number;
  status?: number;
  search?: string;
}) => {
  const where: Record<string, unknown> = {};
  if (params?.branch_id) where.branch_id = params.branch_id;
  if (params?.session_id) where.session_id = params.session_id;
  if (params?.program_id) where.program_id = params.program_id;
  if (params?.class_id) where.class_id = params.class_id;
  if (params?.status !== undefined) where.status = params.status;
  if (params?.search) {
    where.title = { contains: params.search, mode: "insensitive" };
  }
  return prisma.feeScholarshipDefination.findMany({
    where,
    orderBy: { id: "desc" },
  });
};

export const createScholarshipRule = async (
  data: {
    session_id?: number;
    branch_id: number;
    board_id?: number;
    program_id: number;
    class_id?: number;
    title: string;
    no_of_a: number;
    term_percentage: number;
    status?: number;
  },
  userId: number
) => {
  const limit = await getActiveScholarshipLimit({
    session_id: data.session_id,
    branch_id: data.branch_id,
    program_id: data.program_id,
  });
  if (data.term_percentage > limit) {
    throw new AppError(
      `Scholarship percentage ${data.term_percentage}% exceeds maximum limit of ${limit}%`
    );
  }

  const dup = await prisma.feeScholarshipDefination.findFirst({
    where: {
      branch_id: data.branch_id,
      program_id: data.program_id,
      class_id: data.class_id ?? null,
      title: { equals: data.title.trim(), mode: "insensitive" },
      status: 1,
    },
  });
  if (dup) {
    throw new AppError(
      "An active scholarship rule with this title already exists for the selected scope"
    );
  }

  return prisma.feeScholarshipDefination.create({
    data: {
      session_id: data.session_id ?? null,
      branch_id: data.branch_id,
      board_id: data.board_id ?? null,
      program_id: data.program_id,
      class_id: data.class_id ?? null,
      title: data.title.trim(),
      no_of_a: data.no_of_a,
      term_percentage: data.term_percentage,
      status: data.status ?? 1,
      created_by: userId,
      last_updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

export const updateScholarshipRule = async (
  id: number,
  data: Partial<{
    session_id: number;
    branch_id: number;
    board_id: number;
    program_id: number;
    class_id: number;
    title: string;
    no_of_a: number;
    term_percentage: number;
    status: number;
  }>,
  userId: number
) => {
  const existing = await prisma.feeScholarshipDefination.findUnique({
    where: { id },
  });
  if (!existing) throw new AppError("Scholarship rule not found", 404);

  const termPct = data.term_percentage ?? num(existing.term_percentage);
  const limit = await getActiveScholarshipLimit({
    session_id: data.session_id ?? existing.session_id,
    branch_id: data.branch_id ?? existing.branch_id,
    program_id: data.program_id ?? existing.program_id,
  });
  if (termPct > limit) {
    throw new AppError(
      `Scholarship percentage ${termPct}% exceeds maximum limit of ${limit}%`
    );
  }

  return prisma.feeScholarshipDefination.update({
    where: { id },
    data: {
      session_id: data.session_id ?? existing.session_id,
      branch_id: data.branch_id ?? existing.branch_id,
      board_id: data.board_id ?? existing.board_id,
      program_id: data.program_id ?? existing.program_id,
      class_id: data.class_id ?? existing.class_id,
      title: data.title?.trim() ?? existing.title,
      no_of_a: data.no_of_a ?? existing.no_of_a,
      term_percentage: termPct,
      status: data.status ?? existing.status,
      last_updated_by: userId,
      updated_at: new Date(),
    },
  });
};

// ── Scholarship Settings ──────────────────────────────────────────────────────

export const listScholarshipSettings = async () =>
  prisma.scholarshipSettings.findMany({ orderBy: { id: "asc" } });

export const upsertScholarshipSettings = async (
  data: {
    id?: number;
    session_id?: number;
    branch_id?: number;
    program_id?: number;
    maximum_limit: number;
    status?: number;
  },
  userId: number
) => {
  if (data.id) {
    const existing = await prisma.scholarshipSettings.findUnique({
      where: { id: data.id },
    });
    if (!existing) throw new AppError("Scholarship settings not found", 404);
    return prisma.scholarshipSettings.update({
      where: { id: data.id },
      data: {
        session_id: data.session_id ?? existing.session_id,
        branch_id: data.branch_id ?? existing.branch_id,
        program_id: data.program_id ?? existing.program_id,
        maximum_limit: data.maximum_limit,
        status: data.status ?? existing.status,
        last_updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  const latest = await prisma.scholarshipSettings.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const nextId = (latest?.id || 0) + 1;

  return prisma.scholarshipSettings.create({
    data: {
      id: nextId,
      session_id: data.session_id ?? null,
      branch_id: data.branch_id ?? null,
      program_id: data.program_id ?? null,
      maximum_limit: data.maximum_limit,
      status: data.status ?? 1,
      created_by: userId,
      last_updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

// ── Apply workspace & application ─────────────────────────────────────────────

export const getDiscountWorkspace = async (studentId: number) => {
  const dashboard = await getStudentFeeDashboard(studentId);
  const [discountTypes, scholarships, rules, settings, collections] =
    await Promise.all([
      listDiscountTypesAdmin({ status: "Active" }),
      listScholarshipCatalog({
        branch_id: dashboard.student.branch_id || undefined,
        status: "1",
      }),
      listScholarshipRules({
        branch_id: dashboard.student.branch_id || undefined,
        status: 1,
      }),
      listScholarshipSettings(),
      prisma.feeCollections.findMany({
        where: { students_id: studentId, active_status: 1 },
        orderBy: { id: "desc" },
        take: 20,
      }),
    ]);

  const invoices = [];
  const receipts = [];
  for (const s of dashboard.statements) {
    try {
      invoices.push(await getInvoiceView(s.id));
    } catch {
      /* skip */
    }
    try {
      receipts.push(await getReceiptView(s.id));
    } catch {
      /* skip */
    }
  }

  const limit = await getActiveScholarshipLimit({
    session_id: dashboard.student.session_id,
    branch_id: dashboard.student.branch_id,
    program_id: dashboard.student.program_id,
  });

  return {
    dashboard,
    discount_types: discountTypes,
    scholarships,
    scholarship_rules: rules,
    scholarship_settings: settings,
    scholarship_maximum_limit: limit,
    recent_collections: collections.map((c) => ({
      id: c.id,
      bill_no: c.bill_no,
      paid_amount: c.paid_amount,
      discount: c.discount,
      discount_type: c.discount_type,
      balance: c.balance,
      payment_mode: c.payment_mode,
      paid_date: c.paid_date,
    })),
    invoices,
    receipts,
  };
};

const refreshDocs = async (basicId: number, studentId: number) => {
  const dashboard = await getStudentFeeDashboard(studentId);
  let invoice = null;
  let receipt = null;
  try {
    invoice = await getInvoiceView(basicId);
  } catch {
    invoice = null;
  }
  try {
    receipt = await getReceiptView(basicId);
  } catch {
    receipt = null;
  }
  return { dashboard, invoice, receipt };
};

export const applyDiscount = async (
  data: {
    student_id: number;
    fee_master_basic_id: number;
    discount_type_id: number;
    calculation_mode: CalcMode;
    value: number;
    comment?: string | null;
    replace_existing?: boolean;
  },
  userId: number
) => {
  const dtype = await prisma.discountTypes.findUnique({
    where: { id: data.discount_type_id },
  });
  if (!dtype || dtype.deleted_by || dtype.status !== "Active") {
    throw new AppError("Discount type is not available", 404);
  }

  const { basic, lines, gross, paid } = await getGrossPayable(
    data.fee_master_basic_id
  );
  if (basic.student_id !== data.student_id) {
    throw new AppError("Fee statement does not belong to the selected student");
  }

  const existingDiscount = num(basic.discount_fee);
  if (existingDiscount > 0 && !data.replace_existing) {
    throw new AppError(
      "A discount is already applied on this invoice. Enable replace to overwrite."
    );
  }
  if (
    basic.discount_type === data.discount_type_id &&
    existingDiscount > 0 &&
    !data.replace_existing
  ) {
    throw new AppError("This discount type is already applied on the invoice");
  }

  const discountAmount = computeDiscountAmount(
    data.calculation_mode,
    data.value,
    gross
  );
  const otherRelief = num(basic.other_discount_fee);
  if (discountAmount + otherRelief > gross + 0.009) {
    throw new AppError("Discount cannot exceed the payable fee");
  }

  const totalAfter = Math.max(
    0,
    Math.round((gross - discountAmount - otherRelief) * 100) / 100
  );
  if (totalAfter + 0.009 < paid) {
    throw new AppError(
      `Discount would reduce payable below already paid amount (paid ₨ ${paid.toFixed(2)})`
    );
  }

  const pctOnLines =
    data.calculation_mode === "PERCENT"
      ? data.value
      : gross > 0
        ? (discountAmount / gross) * 100
        : 0;

  const comment = (
    data.comment ||
    `${dtype.name} · ${data.calculation_mode === "PERCENT" ? `${data.value}%` : `₨ ${data.value}`}`
  ).slice(0, 191);

  await prisma.$transaction([
    prisma.feeMasterBasics.update({
      where: { id: basic.id },
      data: {
        discount_fee: String(discountAmount),
        total_after_discount: String(totalAfter),
        discount_type: data.discount_type_id,
        special_discount_comment: comment,
        last_updated_by: userId,
        updated_at: new Date(),
      },
    }),
    ...lines.map((line) =>
      prisma.feeMasters.update({
        where: { id: line.id },
        data: {
          fee_discount_percentage: pctOnLines,
          discount_type: data.discount_type_id,
          fee_discount_comment: comment.slice(0, 250),
          last_updated_by: userId,
          updated_at: new Date(),
        },
      })
    ),
  ]);

  const docs = await refreshDocs(basic.id, data.student_id);
  return {
    applied: {
      kind: "discount",
      discount_type_id: data.discount_type_id,
      discount_amount: discountAmount,
      total_after_discount: totalAfter,
      outstanding: Math.max(0, totalAfter - paid),
    },
    ...docs,
  };
};

export const applyScholarship = async (
  data: {
    student_id: number;
    fee_master_basic_id: number;
    scholarship_catalog_id?: number;
    scholarship_rule_id?: number;
    replace_existing?: boolean;
    comment?: string | null;
  },
  userId: number
) => {
  if (!data.scholarship_catalog_id && !data.scholarship_rule_id) {
    throw new AppError("Select a scholarship definition or rule");
  }

  const { basic, lines, gross, paid } = await getGrossPayable(
    data.fee_master_basic_id
  );
  if (basic.student_id !== data.student_id) {
    throw new AppError("Fee statement does not belong to the selected student");
  }

  if (num(basic.scholarship) > 0 && !data.replace_existing) {
    throw new AppError(
      "A scholarship is already applied on this invoice. Enable replace to overwrite."
    );
  }

  let scholarshipId = 0;
  let noOfA = 0;
  let termPct = 0;
  let title = "";
  let headPctMap: Record<number, number> = {};

  if (data.scholarship_catalog_id) {
    const catalog = await getScholarshipCatalogById(data.scholarship_catalog_id);
    if (catalog.status !== "1") {
      throw new AppError("Scholarship definition is inactive");
    }
    scholarshipId = catalog.id;
    noOfA = catalog.no_of_a;
    termPct = num(catalog.term_percentage);
    title = catalog.title;
    for (const d of catalog.details) {
      if (d.status === "1") headPctMap[d.fee_head_id] = d.discount_percentage;
    }
  } else if (data.scholarship_rule_id) {
    const rule = await prisma.feeScholarshipDefination.findUnique({
      where: { id: data.scholarship_rule_id },
    });
    if (!rule || rule.status !== 1) {
      throw new AppError("Scholarship rule is not available", 404);
    }
    scholarshipId = rule.id;
    noOfA = rule.no_of_a;
    termPct = num(rule.term_percentage);
    title = rule.title;
  }

  const limit = await getActiveScholarshipLimit({
    session_id: basic.session_id,
    branch_id: basic.branch_id,
    program_id: basic.program_id,
  });

  const heads = await prisma.feeHeads.findMany({ take: 500 });
  const headById = Object.fromEntries(heads.map((h) => [h.id, h]));
  const headByTitle = Object.fromEntries(
    heads
      .filter((h) => h.fee_head_title)
      .map((h) => [String(h.fee_head_title).toLowerCase(), h.id])
  );

  let scholarshipAmount = 0;
  const lineUpdates: Array<{ id: number; pct: number }> = [];

  for (const line of lines) {
    const headId =
      headByTitle[String(line.fee_head || "").toLowerCase()] || null;
    const headPct =
      headId && headPctMap[headId] !== undefined
        ? headPctMap[headId]
        : termPct;
    if (headPct > limit) {
      throw new AppError(
        `Fee-head scholarship ${headPct}% exceeds maximum limit of ${limit}%`
      );
    }
    const lineAmt = num(line.fee_amount);
    const cut = Math.round(((lineAmt * headPct) / 100) * 100) / 100;
    scholarshipAmount += cut;
    lineUpdates.push({ id: line.id, pct: headPct });
  }

  // If no lines, apply term % on gross
  if (!lines.length) {
    if (termPct > limit) {
      throw new AppError(
        `Scholarship percentage ${termPct}% exceeds maximum limit of ${limit}%`
      );
    }
    scholarshipAmount =
      Math.round(((gross * termPct) / 100) * 100) / 100;
  }

  const existingDiscount = num(basic.discount_fee);
  const priorOther = num(basic.other_discount_fee);
  const priorIsScholarship = String(basic.other_discount_type || "").startsWith(
    "SCHOLARSHIP:"
  );
  // Preserve non-scholarship concession when replacing scholarship only
  const concessionOnly =
    !priorIsScholarship && priorOther > 0 ? priorOther : 0;

  const totalRelief = existingDiscount + scholarshipAmount + concessionOnly;
  if (totalRelief > gross + 0.009) {
    throw new AppError("Combined discounts cannot exceed the payable fee");
  }

  const totalAfter =
    Math.max(0, Math.round((gross - totalRelief) * 100) / 100);
  if (totalAfter + 0.009 < paid) {
    throw new AppError(
      `Scholarship would reduce payable below already paid amount (paid ₨ ${paid.toFixed(2)})`
    );
  }

  const comment = (
    data.comment ||
    `Scholarship: ${title} (${termPct}% / heads)`
  ).slice(0, 191);

  const otherType =
    concessionOnly > 0
      ? `SCHOLARSHIP:${title}|CONCESSION`.slice(0, 191)
      : `SCHOLARSHIP:${title}`.slice(0, 191);

  await prisma.$transaction([
    prisma.feeMasterBasics.update({
      where: { id: basic.id },
      data: {
        scholarship: scholarshipId,
        scholarship_no_of_a: noOfA,
        other_discount_fee: String(scholarshipAmount + concessionOnly),
        other_discount_type: otherType,
        total_after_discount: String(totalAfter),
        special_discount_comment: comment,
        last_updated_by: userId,
        updated_at: new Date(),
      },
    }),
    ...lineUpdates.map((u) =>
      prisma.feeMasters.update({
        where: { id: u.id },
        data: {
          scholarship: scholarshipId,
          scholarship_no_of_a: noOfA,
          fee_discount_percentage: u.pct,
          fee_discount_comment: comment.slice(0, 250),
          last_updated_by: userId,
          updated_at: new Date(),
        },
      })
    ),
  ]);

  const docs = await refreshDocs(basic.id, data.student_id);
  return {
    applied: {
      kind: "scholarship",
      scholarship_id: scholarshipId,
      title,
      scholarship_amount: scholarshipAmount,
      term_percentage: termPct,
      fee_heads_applied: Object.keys(headPctMap).map((id) => ({
        fee_head_id: Number(id),
        title: headById[Number(id)]?.fee_head_title || null,
        percentage: headPctMap[Number(id)],
      })),
      total_after_discount: totalAfter,
      outstanding: Math.max(0, totalAfter - paid),
    },
    ...docs,
  };
};

export const applyConcession = async (
  data: {
    student_id: number;
    fee_master_basic_id: number;
    calculation_mode: CalcMode;
    value: number;
    concession_label: string;
    comment?: string | null;
    replace_existing?: boolean;
  },
  userId: number
) => {
  const { basic, lines, gross, paid } = await getGrossPayable(
    data.fee_master_basic_id
  );
  if (basic.student_id !== data.student_id) {
    throw new AppError("Fee statement does not belong to the selected student");
  }

  const existingOther = num(basic.other_discount_fee);
  const otherType = String(basic.other_discount_type || "");
  const isScholarshipTagged = otherType.startsWith("SCHOLARSHIP:");
  const hasConcession = otherType.includes("CONCESSION:");
  const pureConcession = !isScholarshipTagged && existingOther > 0;

  if ((pureConcession || hasConcession) && !data.replace_existing) {
    throw new AppError(
      "A concession is already applied. Enable replace to overwrite."
    );
  }

  const concessionAmount = computeDiscountAmount(
    data.calculation_mode,
    data.value,
    gross
  );
  const discountFee = num(basic.discount_fee);

  let scholarshipPart = 0;
  if (isScholarshipTagged) {
    if (hasConcession) {
      scholarshipPart = lines.reduce((s, l) => {
        const pct = num(l.fee_discount_percentage);
        return s + Math.round(((num(l.fee_amount) * pct) / 100) * 100) / 100;
      }, 0);
    } else {
      scholarshipPart = existingOther;
    }
  }

  const combinedOther = isScholarshipTagged
    ? scholarshipPart + concessionAmount
    : concessionAmount;

  if (discountFee + combinedOther > gross + 0.009) {
    throw new AppError("Discount / concession cannot exceed the payable fee");
  }

  const totalAfter = Math.max(
    0,
    Math.round((gross - discountFee - combinedOther) * 100) / 100
  );
  if (totalAfter + 0.009 < paid) {
    throw new AppError(
      `Concession would reduce payable below already paid amount (paid ₨ ${paid.toFixed(2)})`
    );
  }

  const label = data.concession_label.trim();
  const scholarshipTitle = isScholarshipTagged
    ? otherType.replace(/^SCHOLARSHIP:/, "").split("|")[0]
    : "";
  const typeTag = isScholarshipTagged
    ? `SCHOLARSHIP:${scholarshipTitle}|CONCESSION:${label}`.slice(0, 191)
    : `CONCESSION:${label}`.slice(0, 191);
  const comment = (
    data.comment ||
    `Concession: ${label} · ${
      data.calculation_mode === "PERCENT"
        ? `${data.value}%`
        : `₨ ${data.value}`
    }`
  ).slice(0, 191);

  await prisma.$transaction([
    prisma.feeMasterBasics.update({
      where: { id: basic.id },
      data: {
        other_discount_fee: String(combinedOther),
        other_discount_type: typeTag,
        total_after_discount: String(totalAfter),
        special_discount_comment: comment,
        last_updated_by: userId,
        updated_at: new Date(),
      },
    }),
    ...lines.map((line) =>
      prisma.feeMasters.update({
        where: { id: line.id },
        data: {
          fee_discount_comment: comment.slice(0, 250),
          last_updated_by: userId,
          updated_at: new Date(),
        },
      })
    ),
  ]);

  const docs = await refreshDocs(basic.id, data.student_id);
  return {
    applied: {
      kind: "concession",
      label,
      concession_amount: concessionAmount,
      other_discount_total: combinedOther,
      total_after_discount: totalAfter,
      outstanding: Math.max(0, totalAfter - paid),
    },
    ...docs,
  };
};

export const applyNoDiscountFullFee = async (
  data: {
    student_id: number;
    fee_master_basic_id: number;
    comment?: string | null;
  },
  userId: number
) => {
  const { basic, lines, gross, paid } = await getGrossPayable(data.fee_master_basic_id);
  if (basic.student_id !== data.student_id) {
    throw new AppError("Fee statement does not belong to the selected student");
  }

  const totalAfter = Math.round(gross * 100) / 100;
  if (totalAfter + 0.009 < paid) {
    throw new AppError(
      `Full fee cannot be lower than already paid amount (paid ₨ ${paid.toFixed(2)})`
    );
  }

  const note = (data.comment || "No Discount / Full Fee").slice(0, 191);

  await prisma.$transaction([
    prisma.feeMasterBasics.update({
      where: { id: basic.id },
      data: {
        discount_fee: null,
        other_discount_fee: null,
        total_after_discount: String(totalAfter),
        discount_type: 1,
        special_discount_comment: note,
        scholarship: null,
        scholarship_no_of_a: null,
        other_discount_type: null,
        last_updated_by: userId,
        updated_at: new Date(),
      },
    }),
    ...lines.map((line) =>
      prisma.feeMasters.update({
        where: { id: line.id },
        data: {
          fee_discount_percentage: 0,
          fee_discount_comment: note.slice(0, 250),
          scholarship: 0,
          scholarship_no_of_a: 0,
          discount_type: 1,
          last_updated_by: userId,
          updated_at: new Date(),
        },
      })
    ),
  ]);

  const docs = await refreshDocs(basic.id, data.student_id);
  return {
    applied: {
      kind: "no_discount",
      full_fee_amount: totalAfter,
      outstanding: Math.max(0, totalAfter - paid),
    },
    ...docs,
  };
};
