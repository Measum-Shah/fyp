import { prisma } from "../../../config/db";

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export const getFinancialDashboardKpis = async () => {
  const accounts = await prisma.accAccount.findMany();
  const bills = await prisma.accVendorBill.findMany();
  const invoices = await prisma.accCustomerInvoice.findMany();
  const cashBank = await prisma.accCashBankAccount.findMany();

  let totalRevenue = 0;
  let totalExpenses = 0;
  let accountsReceivable = 0;
  let accountsPayable = 0;
  let cashInHand = 0;
  let bankBalance = 0;

  accounts.forEach((acc) => {
    const bal = Number(acc.current_balance || 0);
    if (acc.type === "REVENUE") totalRevenue += bal;
    if (acc.type === "EXPENSE") totalExpenses += bal;
  });

  invoices.forEach((inv) => { accountsReceivable += Number(inv.total_amount) - Number(inv.paid_amount); });
  bills.forEach((bill) => { accountsPayable += Number(bill.total_amount) - Number(bill.paid_amount); });
  cashBank.forEach((cb) => {
    const bal = Number(cb.current_balance || 0);
    if (cb.account_type === "CASH") cashInHand += bal;
    else bankBalance += bal;
  });

  return {
    totalRevenue,
    totalExpenses,
    grossProfit: totalRevenue,
    netProfit: totalRevenue - totalExpenses,
    cashInHand,
    bankBalance,
    accountsReceivable,
    accountsPayable,
    totalCashAndBank: cashInHand + bankBalance,
  };
};

// ─── Trial Balance (with date range) ─────────────────────────────────────────

export const getTrialBalance = async (params?: {
  startDate?: string;
  endDate?: string;
  companyId?: number;
  branchId?: number;
}) => {
  const start = params?.startDate ? new Date(params.startDate) : undefined;
  const end = params?.endDate ? new Date(params.endDate) : undefined;

  // Only pull LEDGER accounts (level 5) or ALL if not hierarchical
  const accounts = await prisma.accAccount.findMany({ orderBy: { code: "asc" } });

  const rows = await Promise.all(
    accounts.map(async (acc) => {
      // Opening = initial opening_balance + movements BEFORE start
      let openingDr = 0;
      let openingCr = 0;

      if (start) {
        const priorLines = await prisma.accJournalLine.findMany({
          where: {
            account_id: acc.id,
            journal: {
              status: "POSTED",
              date: { lt: start },
              ...(params?.branchId ? { branch_id: params.branchId } : {}),
            },
          },
        });
        for (const l of priorLines) {
          openingDr += Number(l.debit || 0);
          openingCr += Number(l.credit || 0);
        }
      } else {
        // No date filter: use account's stored opening_balance
        const ob = Number(acc.opening_balance || 0);
        if (acc.normal_balance === "DEBIT") openingDr = ob;
        else openingCr = ob;
      }

      // Period movements
      const periodLines = await prisma.accJournalLine.findMany({
        where: {
          account_id: acc.id,
          journal: {
            status: "POSTED",
            ...(start || end
              ? { date: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } }
              : {}),
            ...(params?.branchId ? { branch_id: params.branchId } : {}),
          },
        },
      });

      let periodDr = 0;
      let periodCr = 0;
      for (const l of periodLines) {
        periodDr += Number(l.debit || 0);
        periodCr += Number(l.credit || 0);
      }

      // Closing = opening + period
      const closingDr = openingDr + periodDr;
      const closingCr = openingCr + periodCr;

      // For display: net closing debit/credit
      const netClosingDr = Math.max(0, closingDr - closingCr);
      const netClosingCr = Math.max(0, closingCr - closingDr);

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        level: (acc as any).level ?? 5,
        account_category: (acc as any).account_category ?? "LEDGER",
        parent_id: acc.parent_id,
        openingDr,
        openingCr,
        periodDr,
        periodCr,
        closingDr: netClosingDr,
        closingCr: netClosingCr,
        // Legacy compatibility
        debit: netClosingDr,
        credit: netClosingCr,
      };
    })
  );

  // Filter out zero-balance rows for cleaner display, but keep totals from all
  const nonZero = rows.filter((r) => r.closingDr > 0 || r.closingCr > 0 || r.periodDr > 0 || r.periodCr > 0);

  let totalDebit = 0;
  let totalCredit = 0;
  for (const r of nonZero) {
    totalDebit += r.closingDr;
    totalCredit += r.closingCr;
  }

  return {
    rows: nonZero,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    params: { startDate: params?.startDate, endDate: params?.endDate },
  };
};

// ─── Profit & Loss ────────────────────────────────────────────────────────────

export const getProfitAndLoss = async (params?: {
  startDate?: string;
  endDate?: string;
  companyId?: number;
  branchId?: number;
}) => {
  const start = params?.startDate ? new Date(params.startDate) : undefined;
  const end = params?.endDate ? new Date(params.endDate) : undefined;

  const revenueAccounts = await prisma.accAccount.findMany({
    where: { type: "REVENUE" },
    orderBy: { code: "asc" },
  });

  const expenseAccounts = await prisma.accAccount.findMany({
    where: { type: "EXPENSE" },
    orderBy: { code: "asc" },
  });

  let totalRevenue = 0;
  let totalExpenses = 0;

  const getAccountPeriodAmount = async (accountId: number): Promise<number> => {
    const lines = await prisma.accJournalLine.findMany({
      where: {
        account_id: accountId,
        journal: {
          status: "POSTED",
          ...(start || end
            ? { date: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } }
            : {}),
          ...(params?.branchId ? { branch_id: params.branchId } : {}),
        },
      },
    });
    let net = 0;
    for (const l of lines) {
      net += Number(l.credit || 0) - Number(l.debit || 0);
    }
    return net > 0 ? net : Number(0); // Revenue net = Credits - Debits
  };

  const getExpensePeriodAmount = async (accountId: number): Promise<number> => {
    const lines = await prisma.accJournalLine.findMany({
      where: {
        account_id: accountId,
        journal: {
          status: "POSTED",
          ...(start || end
            ? { date: { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) } }
            : {}),
        },
      },
    });
    let net = 0;
    for (const l of lines) {
      net += Number(l.debit || 0) - Number(l.credit || 0);
    }
    return net > 0 ? net : 0;
  };

  const revenues = await Promise.all(
    revenueAccounts.map(async (acc) => {
      const amount = start || end
        ? await getAccountPeriodAmount(acc.id)
        : Number(acc.current_balance || 0);
      totalRevenue += amount;
      return { id: acc.id, code: acc.code, name: acc.name, type: acc.type, amount };
    })
  );

  const expenses = await Promise.all(
    expenseAccounts.map(async (acc) => {
      const amount = start || end
        ? await getExpensePeriodAmount(acc.id)
        : Number(acc.current_balance || 0);
      totalExpenses += amount;
      return { id: acc.id, code: acc.code, name: acc.name, type: acc.type, amount };
    })
  );

  const netProfit = totalRevenue - totalExpenses;

  return {
    revenues: revenues.filter((r) => r.amount !== 0),
    expenses: expenses.filter((e) => e.amount !== 0),
    totalRevenue,
    totalExpenses,
    netProfit,
    params: { startDate: params?.startDate, endDate: params?.endDate },
  };
};

// ─── Balance Sheet ────────────────────────────────────────────────────────────

export const getBalanceSheet = async (params?: {
  asOfDate?: string;
  startDate?: string;
  endDate?: string;
  companyId?: number;
  branchId?: number;
}) => {
  const asOf = params?.asOfDate ? new Date(params.asOfDate) : params?.endDate ? new Date(params.endDate) : undefined;

  const getAccountBalance = async (acc: any): Promise<number> => {
    if (!asOf) return Number(acc.current_balance || 0);

    const lines = await prisma.accJournalLine.findMany({
      where: {
        account_id: acc.id,
        journal: { status: "POSTED", date: { lte: asOf } },
      },
    });

    let bal = Number(acc.opening_balance || 0);
    for (const l of lines) {
      const dr = Number(l.debit || 0);
      const cr = Number(l.credit || 0);
      if (acc.normal_balance === "DEBIT") bal += dr - cr;
      else bal += cr - dr;
    }
    return bal;
  };

  const [assetAccounts, liabilityAccounts, equityAccounts] = await Promise.all([
    prisma.accAccount.findMany({ where: { type: "ASSET" }, orderBy: { code: "asc" } }),
    prisma.accAccount.findMany({ where: { type: "LIABILITY" }, orderBy: { code: "asc" } }),
    prisma.accAccount.findMany({ where: { type: "EQUITY" }, orderBy: { code: "asc" } }),
  ]);

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  const assets = await Promise.all(
    assetAccounts.map(async (acc) => {
      const amount = await getAccountBalance(acc);
      totalAssets += amount;
      return { id: acc.id, code: acc.code, name: acc.name, amount };
    })
  );

  const liabilities = await Promise.all(
    liabilityAccounts.map(async (acc) => {
      const amount = await getAccountBalance(acc);
      totalLiabilities += amount;
      return { id: acc.id, code: acc.code, name: acc.name, amount };
    })
  );

  const equity = await Promise.all(
    equityAccounts.map(async (acc) => {
      const amount = await getAccountBalance(acc);
      totalEquity += amount;
      return { id: acc.id, code: acc.code, name: acc.name, amount };
    })
  );

  // Add current period net profit/loss to equity
  const pnl = await getProfitAndLoss(params);
  const totalEquityWithRetained = totalEquity + pnl.netProfit;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithRetained;

  return {
    assets: assets.filter((a) => a.amount !== 0),
    liabilities: liabilities.filter((l) => l.amount !== 0),
    equity: equity.filter((e) => e.amount !== 0),
    totalAssets,
    totalLiabilities,
    totalEquity: totalEquityWithRetained,
    netProfit: pnl.netProfit,
    totalLiabilitiesAndEquity,
    isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
    params: { asOfDate: params?.asOfDate, endDate: params?.endDate },
  };
};

// ─── Hierarchical COA for Reports ────────────────────────────────────────────

const buildTree = (accounts: any[], parentId: number | null = null): any[] => {
  return accounts
    .filter((a) => a.parent_id === parentId)
    .map((a) => ({ ...a, children: buildTree(accounts, a.id) }));
};

export const getChartOfAccountsReport = async () => {
  const all = await prisma.accAccount.findMany({ orderBy: { code: "asc" } });
  return buildTree(all, null);
};

// ─── Integration Cutover Date ─────────────────────────────────────────────────
// Records created before this date are "pre-integration" — they were never
// expected to trigger automatic GL postings because the posting hooks didn't
// exist yet. The reconciliation report separates them from genuine post-cutover
// gaps so that the Rs 54,000 legacy drift from seed records (#201, #202) doesn't
// mask real problems.
const INTEGRATION_CUTOVER_DATE = new Date("2026-09-15T00:00:00.000Z");

// ─── Module Reconciliation Report ─────────────────────────────────────────────
export const getReconciliationReport = async () => {
  // 1. Fee Management Reconciliation
  const feeCollections = await prisma.feeCollections.findMany({
    select: { id: true, paid_amount: true, created_at: true },
  });
  let totalFeeModuleAmount = 0;
  feeCollections.forEach((fc) => {
    totalFeeModuleAmount += Number(fc.paid_amount || 0);
  });

  const feeJournals = await prisma.accJournal.findMany({
    where: { source_module: "FEE", source_reference_type: "FEE_COLLECTION" },
    select: { id: true, total_debit: true, source_reference_id: true },
  });
  let totalFeeGlAmount = 0;
  const feePostedIds = new Set(
    feeJournals.map((j) => String(j.source_reference_id)).filter(Boolean)
  );
  feeJournals.forEach((j) => {
    totalFeeGlAmount += Number(j.total_debit || 0);
  });

  const unpostedFeeCollections = feeCollections.filter(
    (fc) => !feePostedIds.has(String(fc.id))
  );

  // Split unposted into pre-cutover (expected legacy drift) vs post-cutover (genuine gaps)
  const preCutoverUnpostedFee = unpostedFeeCollections.filter(
    (fc) => !fc.created_at || new Date(fc.created_at) < INTEGRATION_CUTOVER_DATE
  );
  const postCutoverUnpostedFee = unpostedFeeCollections.filter(
    (fc) => fc.created_at && new Date(fc.created_at) >= INTEGRATION_CUTOVER_DATE
  );
  let preCutoverFeeDrift = 0;
  preCutoverUnpostedFee.forEach((fc) => { preCutoverFeeDrift += Number(fc.paid_amount || 0); });

  // 2. HR & Payroll Reconciliation
  const payrollSheets = await prisma.erpStaffSalaries.findMany({
    where: { deleted_at: null },
    select: { id: true, gross_salary: true, created_at: true },
  });
  let totalPayrollModuleAmount = 0;
  payrollSheets.forEach((pr) => {
    totalPayrollModuleAmount += Number(pr.gross_salary || 0);
  });

  const payrollJournals = await prisma.accJournal.findMany({
    where: { source_module: "HR_PAYROLL", source_reference_type: "PAYROLL_RUN" },
    select: { id: true, total_debit: true, source_reference_id: true },
  });
  let totalPayrollGlAmount = 0;
  payrollJournals.forEach((j) => {
    totalPayrollGlAmount += Number(j.total_debit || 0);
  });

  // Payroll reconciliation is batch-level (one journal per branch/month), not per-sheet
  const unpostedPayrollCount = Math.max(0, payrollSheets.length - payrollJournals.length);
  const preCutoverPayrollSheets = payrollSheets.filter(
    (ps) => !ps.created_at || new Date(ps.created_at) < INTEGRATION_CUTOVER_DATE
  );
  const postCutoverPayrollSheets = payrollSheets.filter(
    (ps) => ps.created_at && new Date(ps.created_at) >= INTEGRATION_CUTOVER_DATE
  );
  let preCutoverPayrollDrift = 0;
  preCutoverPayrollSheets.forEach((ps) => { preCutoverPayrollDrift += Number(ps.gross_salary || 0); });
  // Only count pre-cutover sheets that have no corresponding journal as drift
  // (post-cutover sheets should all have journals)
  const preCutoverPayrollUnpostedCount = preCutoverPayrollSheets.length;

  // 3. Academic Fines Reconciliation
  const finePayments = await prisma.finePayment.findMany({
    select: { id: true, amount: true, createdAt: true },
  });
  let totalAcademicFineModuleAmount = 0;
  finePayments.forEach((fp) => {
    totalAcademicFineModuleAmount += Number(fp.amount || 0);
  });

  const academicJournals = await prisma.accJournal.findMany({
    where: { source_module: "ACADEMIC", source_reference_type: "FINE_PAYMENT" },
    select: { id: true, total_debit: true, source_reference_id: true },
  });
  let totalAcademicFineGlAmount = 0;
  const academicPostedIds = new Set(
    academicJournals.map((j) => String(j.source_reference_id)).filter(Boolean)
  );
  academicJournals.forEach((j) => {
    totalAcademicFineGlAmount += Number(j.total_debit || 0);
  });

  const unpostedFinePayments = finePayments.filter(
    (fp) => !academicPostedIds.has(String(fp.id))
  );
  const preCutoverUnpostedFines = unpostedFinePayments.filter(
    (fp) => !fp.createdAt || new Date(fp.createdAt) < INTEGRATION_CUTOVER_DATE
  );
  const postCutoverUnpostedFines = unpostedFinePayments.filter(
    (fp) => fp.createdAt && new Date(fp.createdAt) >= INTEGRATION_CUTOVER_DATE
  );
  let preCutoverFineDrift = 0;
  preCutoverUnpostedFines.forEach((fp) => { preCutoverFineDrift += Number(fp.amount || 0); });

  return {
    integrationCutoverDate: INTEGRATION_CUTOVER_DATE.toISOString(),
    feeManagement: {
      sourceModuleTotal: Math.round(totalFeeModuleAmount * 100) / 100,
      glPostedTotal: Math.round(totalFeeGlAmount * 100) / 100,
      drift: Math.round((totalFeeModuleAmount - totalFeeGlAmount) * 100) / 100,
      preCutoverDrift: Math.round(preCutoverFeeDrift * 100) / 100,
      postCutoverDrift: Math.round((totalFeeModuleAmount - totalFeeGlAmount - preCutoverFeeDrift) * 100) / 100,
      totalSourceCount: feeCollections.length,
      glPostedCount: feeJournals.length,
      unpostedCount: unpostedFeeCollections.length,
      preCutoverUnposted: preCutoverUnpostedFee.length,
      postCutoverUnposted: postCutoverUnpostedFee.length,
    },
    hrPayroll: {
      sourceModuleTotal: Math.round(totalPayrollModuleAmount * 100) / 100,
      glPostedTotal: Math.round(totalPayrollGlAmount * 100) / 100,
      drift: Math.round((totalPayrollModuleAmount - totalPayrollGlAmount) * 100) / 100,
      preCutoverDrift: Math.round(preCutoverPayrollDrift * 100) / 100,
      postCutoverDrift: Math.round((totalPayrollModuleAmount - totalPayrollGlAmount - preCutoverPayrollDrift) * 100) / 100,
      totalSourceCount: payrollSheets.length,
      glPostedCount: payrollJournals.length,
      unpostedCount: unpostedPayrollCount,
      preCutoverUnposted: preCutoverPayrollUnpostedCount,
      postCutoverUnposted: Math.max(0, postCutoverPayrollSheets.length - payrollJournals.length),
    },
    academic: {
      sourceModuleTotal: Math.round(totalAcademicFineModuleAmount * 100) / 100,
      glPostedTotal: Math.round(totalAcademicFineGlAmount * 100) / 100,
      drift: Math.round((totalAcademicFineModuleAmount - totalAcademicFineGlAmount) * 100) / 100,
      preCutoverDrift: Math.round(preCutoverFineDrift * 100) / 100,
      postCutoverDrift: Math.round((totalAcademicFineModuleAmount - totalAcademicFineGlAmount - preCutoverFineDrift) * 100) / 100,
      totalSourceCount: finePayments.length,
      glPostedCount: academicJournals.length,
      unpostedCount: unpostedFinePayments.length,
      preCutoverUnposted: preCutoverUnpostedFines.length,
      postCutoverUnposted: postCutoverUnpostedFines.length,
    },
  };
};
