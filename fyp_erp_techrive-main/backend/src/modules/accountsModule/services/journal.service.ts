import { prisma } from "../../../config/db";

export interface JournalLineInput {
  account_id: number;
  debit: number;
  credit: number;
  description?: string;
  partner_type?: string;
  partner_id?: number;
}

export const getAllJournals = async (status?: string) => {
  return await prisma.accJournal.findMany({
    where: status ? { status } : undefined,
    include: {
      lines: {
        include: {
          account: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
};

export const getJournalById = async (id: number) => {
  return await prisma.accJournal.findUnique({
    where: { id },
    include: {
      lines: {
        include: {
          account: true,
        },
      },
    },
  });
};

export const createJournalEntry = async (data: {
  date?: string;
  reference?: string;
  description?: string;
  journal_type?: string;
  lines: JournalLineInput[];
  source_module?: string;
}) => {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of data.lines) {
    totalDebit += Number(line.debit || 0);
    totalCredit += Number(line.credit || 0);
  }

  // Round to 2 decimal places for floating precision safety
  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Double-Entry Violation: Total Debit (${totalDebit}) must equal Total Credit (${totalCredit})`);
  }

  const count = await prisma.accJournal.count();
  const journalNumber = `JV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  return await prisma.accJournal.create({
    data: {
      journal_number: journalNumber,
      date: data.date ? new Date(data.date) : new Date(),
      reference: data.reference || null,
      description: data.description || null,
      journal_type: data.journal_type || "GENERAL",
      total_debit: totalDebit,
      total_credit: totalCredit,
      status: "DRAFT",
      source_module: data.source_module || "MANUAL",
      lines: {
        create: data.lines.map((l) => ({
          account_id: l.account_id,
          debit: l.debit || 0,
          credit: l.credit || 0,
          description: l.description || null,
          partner_type: l.partner_type || null,
          partner_id: l.partner_id || null,
        })),
      },
    },
    include: {
      lines: true,
    },
  });
};

export const postJournalEntry = async (id: number, userName: string = "Accountant") => {
  const journal = await prisma.accJournal.findUnique({
    where: { id },
    include: { lines: true },
  });

  if (!journal) throw new Error("Journal entry not found");
  if (journal.status === "POSTED") throw new Error("Journal entry is already posted");

  // Post inside transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Update journal status to POSTED
    const updatedJournal = await tx.accJournal.update({
      where: { id },
      data: { status: "POSTED" },
    });

    // 2. Update balances of accounts
    for (const line of journal.lines) {
      const account = await tx.accAccount.findUnique({ where: { id: line.account_id } });
      if (account) {
        const debitAmt = Number(line.debit || 0);
        const creditAmt = Number(line.credit || 0);
        let netChange = 0;

        if (account.normal_balance === "DEBIT") {
          netChange = debitAmt - creditAmt;
        } else {
          netChange = creditAmt - debitAmt;
        }

        await tx.accAccount.update({
          where: { id: line.account_id },
          data: {
            current_balance: {
              increment: netChange,
            },
          },
        });
      }
    }

    // 3. Log audit trail
    await tx.accAuditTrail.create({
      data: {
        user_name: userName,
        action: "POST_JOURNAL",
        entity_type: "JournalEntry",
        entity_id: String(journal.id),
        details: `Posted Journal ${journal.journal_number} with Total Debit/Credit: ${journal.total_debit}`,
      },
    });

    return updatedJournal;
  });
};
