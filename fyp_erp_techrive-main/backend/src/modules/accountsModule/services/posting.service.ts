import { prisma } from "../../../config/db";

export interface PostingLineInput {
  account_id: number;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface PostJournalEntryInput {
  sourceModule: "FEE" | "HR_PAYROLL" | "ACADEMIC" | "MANUAL";
  sourceReferenceType: string;
  sourceReferenceId: string | number;
  voucherType?: "GJV" | "CPV" | "BPV" | "CRV" | "BRV";
  date?: Date | string;
  narration?: string;
  lines: PostingLineInput[];
  autoPost?: boolean;
  company_id?: number;
  branch_id?: number;
}

// ─── Numbering generator ───────────────────────────────────────────────────────
const generateVoucherNumber = async (type: string): Promise<string> => {
  const prefix = type || "GJV";
  const year = new Date().getFullYear();
  const count = await prisma.accJournal.count({
    where: { voucher_type: prefix },
  });
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
};

// ─── Double-entry validation ──────────────────────────────────────────────────
const validateDoubleEntry = (lines: PostingLineInput[]) => {
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
      `Double-Entry Violation: Total Debit (${totalDebit}) must equal Total Credit (${totalCredit}).`
    );
  }
  return { totalDebit, totalCredit };
};

// ─── Period Closing Check ─────────────────────────────────────────────────────
const validatePeriodOpen = async (targetDate: Date) => {
  const fiscalYear = targetDate.getFullYear();
  const periodMonth = targetDate.getMonth() + 1;
  const closings = await prisma.accPeriodClosing.findMany({
    where: {
      status: { in: ["CLOSED", "LOCKED"] },
      fiscal_year: fiscalYear,
      period_month: periodMonth,
    },
  });
  if (closings.length > 0) {
    throw new Error(
      `Posting Rejected: Financial period (${closings[0].period_name}) is ${closings[0].status}. Transactions in closed periods are strictly prohibited.`
    );
  }
};

// ─── Post Journal Entry (Central Service) ─────────────────────────────────────
export const postJournalEntry = async (params: PostJournalEntryInput) => {
  const {
    sourceModule,
    sourceReferenceType,
    sourceReferenceId,
    voucherType = "GJV",
    date = new Date(),
    narration,
    lines,
    company_id,
    branch_id,
  } = params;

  const refIdStr = String(sourceReferenceId);

  // 1. Idempotency Check — Return existing voucher if already posted
  const existing = await prisma.accJournal.findFirst({
    where: {
      source_module: sourceModule,
      source_reference_type: sourceReferenceType,
      source_reference_id: refIdStr,
    },
    include: { lines: true },
  });

  if (existing) {
    return existing;
  }

  // 2. Validate input lines
  if (!lines || lines.length < 2) {
    throw new Error("A double-entry journal entry must contain at least 2 lines");
  }
  const { totalDebit, totalCredit } = validateDoubleEntry(lines);

  // 3. Period Closing Validation
  const postingDate = typeof date === "string" ? new Date(date) : date;
  await validatePeriodOpen(postingDate);

  // 4. Resolve autoPost Policy
  let isAutoPost = params.autoPost;
  if (isAutoPost === undefined) {
    const config = await prisma.gLMappingConfig.findUnique({
      where: { event_key: sourceReferenceType },
    });
    isAutoPost = config ? config.auto_post : false;
  }

  const finalStatus = isAutoPost ? "POSTED" : "DRAFT";
  const voucherNumber = await generateVoucherNumber(voucherType);

  // 5. Atomic DB Transaction
  const journal = await prisma.$transaction(async (tx) => {
    const createdJournal = await tx.accJournal.create({
      data: {
        journal_number: voucherNumber,
        voucher_type: voucherType,
        date: postingDate,
        narration: narration || `${sourceModule} Auto-Posting (${sourceReferenceType})`,
        journal_type: "GENERAL",
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: finalStatus,
        source_module: sourceModule,
        source_reference_type: sourceReferenceType,
        source_reference_id: refIdStr,
        company_id: company_id || null,
        branch_id: branch_id || null,
      },
    });

    await tx.accJournalLine.createMany({
      data: lines.map((l) => ({
        journal_id: createdJournal.id,
        account_id: l.account_id,
        debit: l.debit || 0,
        credit: l.credit || 0,
        description: l.description || null,
      })),
    });

    // 6. Record Audit Trail
    await tx.accAuditTrail.create({
      data: {
        action: isAutoPost ? "AUTO_POST" : "AUTO_DRAFT",
        entity_type: "AccJournal",
        entity_id: String(createdJournal.id),
        user_name: "SYSTEM_POSTING_SERVICE",
        details: `Voucher ${voucherNumber} generated for ${sourceModule} (${sourceReferenceType}:${refIdStr})`,
      },
    });

    return createdJournal;
  });

  return journal;
};

// ─── Reverse Journal Entry ────────────────────────────────────────────────────
export const reverseJournalEntry = async (
  journalId: number,
  reason: string
) => {
  const original = await prisma.accJournal.findUnique({
    where: { id: journalId },
    include: { lines: true },
  });

  if (!original) {
    throw new Error(`Original voucher ID #${journalId} not found for reversal`);
  }

  const reversalLines: PostingLineInput[] = original.lines.map((l) => ({
    account_id: l.account_id,
    debit: Number(l.credit),  // Swap credit to debit
    credit: Number(l.debit),  // Swap debit to credit
    description: `Reversal of Line #${l.id}: ${l.description || ""}`,
  }));

  return await postJournalEntry({
    sourceModule: (original.source_module as any) || "MANUAL",
    sourceReferenceType: "REVERSAL",
    sourceReferenceId: `REV-${original.id}-${Date.now()}`,
    voucherType: (original.voucher_type as any) || "GJV",
    date: new Date(),
    narration: `REVERSAL of Voucher ${original.journal_number}. Reason: ${reason}`,
    lines: reversalLines,
    autoPost: true,
  });
};
