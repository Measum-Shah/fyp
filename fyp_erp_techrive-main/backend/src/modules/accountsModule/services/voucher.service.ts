import { prisma } from "../../../config/db";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VoucherLineInput {
  account_id: number;
  debit: number;
  credit: number;
  description?: string;
  partner_type?: string;  // VENDOR | CUSTOMER
  partner_id?: number;
  cost_center_id?: number;
}

export interface VoucherInput {
  voucher_type?: string;  // GJV | CPV | CRV | BPV | BRV
  date?: string;
  reference?: string;
  description?: string;
  narration?: string;
  instrument_no?: string;
  company_id?: number;
  financial_year?: string;
  branch_id?: number;
  lines: VoucherLineInput[];
}

// ─── Auto-generate voucher number ─────────────────────────────────────────────

const generateVoucherNumber = async (type: string): Promise<string> => {
  const prefix = type || "GJV";
  const year = new Date().getFullYear();
  const count = await prisma.accJournal.count({
    where: { voucher_type: prefix },
  });
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
};

// ─── Validate double-entry ────────────────────────────────────────────────────

const validateDoubleEntry = (lines: VoucherLineInput[]) => {
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    totalDebit += Number(line.debit || 0);
    totalCredit += Number(line.credit || 0);
  }
  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Double-Entry Violation: Total Debit (${totalDebit}) must exactly equal Total Credit (${totalCredit}). Difference: ${Math.abs(totalDebit - totalCredit).toFixed(2)}`
    );
  }
  return { totalDebit, totalCredit };
};

// ─── Create Voucher (atomic transaction) ─────────────────────────────────────

export const createVoucher = async (data: VoucherInput) => {
  if (!data.lines || data.lines.length < 2) {
    throw new Error("A voucher must have at least 2 line items");
  }

  const { totalDebit, totalCredit } = validateDoubleEntry(data.lines);

  const voucherNumber = await generateVoucherNumber(data.voucher_type || "GJV");

  return await prisma.$transaction(async (tx) => {
    // 1. Create the journal (voucher header)
    const journal = await tx.accJournal.create({
      data: {
        journal_number: voucherNumber,
        voucher_type: data.voucher_type || "GJV",
        date: data.date ? new Date(data.date) : new Date(),
        reference: data.reference || null,
        description: data.description || null,
        narration: data.narration || null,
        instrument_no: data.instrument_no || null,
        journal_type: getJournalType(data.voucher_type),
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: "DRAFT",
        source_module: "VOUCHER",
        company_id: data.company_id || null,
        financial_year: data.financial_year || null,
        branch_id: data.branch_id || null,
      },
    });

    // 2. Bulk-insert all line items
    await tx.accJournalLine.createMany({
      data: data.lines.map((l) => ({
        journal_id: journal.id,
        account_id: l.account_id,
        debit: l.debit || 0,
        credit: l.credit || 0,
        description: l.description || null,
        partner_type: l.partner_type || null,
        partner_id: l.partner_id || null,
        cost_center_id: l.cost_center_id || null,
        branch_id: data.branch_id || null,
      })),
    });

    return { ...journal, voucher_number: voucherNumber };
  });
};

const getJournalType = (voucherType?: string): string => {
  const map: Record<string, string> = {
    GJV: "GENERAL",
    CPV: "CASH_PAYMENT",
    CRV: "CASH_RECEIPT",
    BPV: "BANK_PAYMENT",
    BRV: "BANK_RECEIPT",
  };
  return map[voucherType || "GJV"] || "GENERAL";
};

// ─── Get Voucher by ID ────────────────────────────────────────────────────────

export const getVoucherById = async (id: number) => {
  const journal = await prisma.accJournal.findUnique({
    where: { id },
    include: {
      lines: {
        include: { account: true },
      },
    },
  });
  if (!journal) throw new Error("Voucher not found");
  return journal;
};

// ─── Update Voucher (atomic) ──────────────────────────────────────────────────

export const updateVoucher = async (id: number, data: VoucherInput) => {
  const existing = await prisma.accJournal.findUnique({ where: { id } });
  if (!existing) throw new Error("Voucher not found");
  if (existing.status === "POSTED") throw new Error("Cannot edit a posted voucher");

  const { totalDebit, totalCredit } = validateDoubleEntry(data.lines);

  return await prisma.$transaction(async (tx) => {
    // 1. Delete old lines
    await tx.accJournalLine.deleteMany({ where: { journal_id: id } });

    // 2. Update header
    const updated = await tx.accJournal.update({
      where: { id },
      data: {
        date: data.date ? new Date(data.date) : undefined,
        reference: data.reference,
        description: data.description,
        narration: data.narration,
        instrument_no: data.instrument_no,
        total_debit: totalDebit,
        total_credit: totalCredit,
        voucher_type: data.voucher_type,
        company_id: data.company_id,
        financial_year: data.financial_year,
        branch_id: data.branch_id,
      },
    });

    // 3. Re-insert new lines
    await tx.accJournalLine.createMany({
      data: data.lines.map((l) => ({
        journal_id: id,
        account_id: l.account_id,
        debit: l.debit || 0,
        credit: l.credit || 0,
        description: l.description || null,
        partner_type: l.partner_type || null,
        partner_id: l.partner_id || null,
        cost_center_id: l.cost_center_id || null,
        branch_id: data.branch_id || null,
      })),
    });

    return updated;
  });
};

// ─── Post Voucher ─────────────────────────────────────────────────────────────

export const postVoucher = async (id: number, userName = "Accountant") => {
  const journal = await prisma.accJournal.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!journal) throw new Error("Voucher not found");
  if (journal.status === "POSTED") throw new Error("Voucher already posted");

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.accJournal.update({
      where: { id },
      data: { status: "POSTED" },
    });

    // Update account balances
    for (const line of journal.lines) {
      const account = await tx.accAccount.findUnique({ where: { id: line.account_id } });
      if (account) {
        const dr = Number(line.debit || 0);
        const cr = Number(line.credit || 0);
        const netChange = account.normal_balance === "DEBIT" ? dr - cr : cr - dr;
        await tx.accAccount.update({
          where: { id: line.account_id },
          data: { current_balance: { increment: netChange } },
        });
      }
    }

    await tx.accAuditTrail.create({
      data: {
        user_name: userName,
        action: "POST_VOUCHER",
        entity_type: "AccJournal",
        entity_id: String(journal.id),
        details: `Posted ${journal.voucher_type} voucher ${journal.journal_number} — Dr/Cr: ${journal.total_debit}`,
      },
    });

    return updated;
  });
};

// ─── Voucher Templates ────────────────────────────────────────────────────────

export const createVoucherTemplate = async (data: {
  name: string;
  voucher_type: string;
  narration?: string;
  lines: VoucherLineInput[];
  created_by?: string;
}) => {
  return await prisma.accVoucherTemplate.create({
    data: {
      name: data.name,
      voucher_type: data.voucher_type,
      narration: data.narration || null,
      lines: data.lines as any,
      created_by: data.created_by || null,
    },
  });
};

export const getVoucherTemplates = async () => {
  return await prisma.accVoucherTemplate.findMany({
    orderBy: { created_at: "desc" },
  });
};

export const getVoucherTemplateForUse = async (id: number) => {
  const template = await prisma.accVoucherTemplate.findUnique({ where: { id } });
  if (!template) throw new Error("Template not found");

  // Resolve account names for pre-populated lines
  const lines = template.lines as VoucherLineInput[];
  const accountIds = [...new Set(lines.map((l) => l.account_id))];
  const accounts = await prisma.accAccount.findMany({
    where: { id: { in: accountIds } },
  });
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));

  const enrichedLines = lines.map((l) => ({
    ...l,
    account: accountMap[l.account_id] || null,
  }));

  return { ...template, lines: enrichedLines };
};

export const deleteVoucherTemplate = async (id: number) => {
  return await prisma.accVoucherTemplate.delete({ where: { id } });
};

// ─── List Vouchers ────────────────────────────────────────────────────────────

export const getVouchers = async (filters?: {
  voucher_type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const where: any = {};
  if (filters?.voucher_type) where.voucher_type = filters.voucher_type;
  if (filters?.status) where.status = filters.status;
  if (filters?.startDate || filters?.endDate) {
    where.date = {
      ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
      ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
    };
  }

  return await prisma.accJournal.findMany({
    where,
    include: { lines: { include: { account: true } } },
    orderBy: { created_at: "desc" },
    take: 200,
  });
};
