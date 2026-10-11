import { prisma } from "../../../config/db";

// ─── Ledger Statement with Opening Balance Algorithm ──────────────────────────

export const getGeneralLedgerByAccount = async (
  accountId: number,
  startDate?: string,
  endDate?: string
) => {
  const account = await prisma.accAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new Error("Account not found");

  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  // Step 1: Compute Opening Balance = initial opening_balance + all POSTED movements before startDate
  let openingBalance = Number(account.opening_balance || 0);

  if (start) {
    const priorLines = await prisma.accJournalLine.findMany({
      where: {
        account_id: accountId,
        journal: { status: "POSTED", date: { lt: start } },
      },
      include: { journal: true },
    });

    for (const line of priorLines) {
      const dr = Number(line.debit || 0);
      const cr = Number(line.credit || 0);
      if (account.normal_balance === "DEBIT") {
        openingBalance += dr - cr;
      } else {
        openingBalance += cr - dr;
      }
    }
  }

  // Step 2: Query lines in the period
  const lines = await prisma.accJournalLine.findMany({
    where: {
      account_id: accountId,
      journal: {
        status: "POSTED",
        ...(start || end
          ? {
              date: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
    },
    include: { journal: true },
    orderBy: { created_at: "asc" },
  });

  // Step 3: Compute running balance row-by-row
  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;

  const entries = lines.map((line) => {
    const dr = Number(line.debit || 0);
    const cr = Number(line.credit || 0);
    totalDebit += dr;
    totalCredit += cr;

    if (account.normal_balance === "DEBIT") {
      runningBalance += dr - cr;
    } else {
      runningBalance += cr - dr;
    }

    return {
      id: line.id,
      date: line.journal.date,
      voucher_number: line.journal.journal_number,
      voucher_type: (line.journal as any).voucher_type || line.journal.journal_type,
      description: line.description || line.journal.description,
      source: line.journal.source_module,
      reference: line.journal.reference,
      debit: dr,
      credit: cr,
      running_balance: runningBalance,
    };
  });

  const closingBalance = openingBalance + (totalDebit - totalCredit) * (account.normal_balance === "DEBIT" ? 1 : -1);

  return {
    account,
    opening_balance: openingBalance,
    entries,
    total_debit: totalDebit,
    total_credit: totalCredit,
    closing_balance: runningBalance,
  };
};

// ─── Vendor Ledger Statement ──────────────────────────────────────────────────

export const getVendorLedger = async (
  vendorId: number,
  startDate?: string,
  endDate?: string
) => {
  const vendor = await prisma.accVendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new Error("Vendor not found");

  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  const lines = await prisma.accJournalLine.findMany({
    where: {
      partner_type: "VENDOR",
      partner_id: vendorId,
      journal: {
        status: "POSTED",
        ...(start || end
          ? {
              date: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
    },
    include: { journal: true, account: true },
    orderBy: { created_at: "asc" },
  });

  let totalDebit = 0;
  let totalCredit = 0;
  let runningBalance = 0;

  const entries = lines.map((line) => {
    const dr = Number(line.debit || 0);
    const cr = Number(line.credit || 0);
    totalDebit += dr;
    totalCredit += cr;
    runningBalance += cr - dr; // Payable increases on Credit

    return {
      id: line.id,
      date: line.journal.date,
      voucher_number: line.journal.journal_number,
      voucher_type: (line.journal as any).voucher_type || line.journal.journal_type,
      account_name: line.account.name,
      description: line.description || line.journal.description,
      reference: line.journal.reference,
      debit: dr,
      credit: cr,
      running_balance: runningBalance,
    };
  });

  return {
    vendor,
    entries,
    total_debit: totalDebit,
    total_credit: totalCredit,
    closing_balance: runningBalance,
  };
};
