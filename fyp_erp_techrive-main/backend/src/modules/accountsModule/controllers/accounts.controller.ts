import { Request, Response } from "express";
import * as chartService from "../services/chartOfAccounts.service";
import * as journalService from "../services/journal.service";
import * as voucherService from "../services/voucher.service";
import * as ledgerService from "../services/generalLedger.service";
import * as apService from "../services/accountsPayable.service";
import * as arService from "../services/accountsReceivable.service";
import * as cashBankService from "../services/cashBank.service";
import * as expenseService from "../services/expenses.service";
import * as assetService from "../services/fixedAssets.service";
import * as noteService from "../services/creditDebitNotes.service";
import * as reportService from "../services/reports.service";
import * as closingService from "../services/periodClosing.service";

// ── Dashboard ──────────────────────────────────────────────────────────────
export const getDashboardKpis = async (_req: Request, res: Response) => {
  try {
    const kpis = await reportService.getFinancialDashboardKpis();
    res.json({ success: true, data: kpis });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Groups & Ledgers ────────────────────────────────────────────────────────
export const getAccountGroupsTree = async (_req: Request, res: Response) => {
  try {
    const tree = await chartService.getAccountGroupsTree();
    res.json({ success: true, data: tree });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAccountGroup = async (req: Request, res: Response) => {
  try {
    const group = await chartService.createAccountGroup(req.body);
    res.status(201).json({ success: true, data: group });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAccountGroup = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const group = await chartService.updateAccountGroup(id, req.body);
    res.json({ success: true, data: group });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getLedgers = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const search = (req.query.search as string) || "";
    const groupId = req.query.groupId ? Number(req.query.groupId) : undefined;
    const result = await chartService.getLedgers(page, search, groupId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLedger = async (req: Request, res: Response) => {
  try {
    const ledger = await chartService.createLedger(req.body);
    res.status(201).json({ success: true, data: ledger });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateLedger = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const ledger = await chartService.updateLedger(id, req.body);
    res.json({ success: true, data: ledger });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Chart of Accounts (flat/legacy) ────────────────────────────────────────
export const getChartOfAccounts = async (_req: Request, res: Response) => {
  try {
    const accounts = await chartService.getChartOfAccounts();
    res.json({ success: true, data: accounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const account = await chartService.createAccount(req.body);
    res.status(201).json({ success: true, data: account });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const seedChartOfAccounts = async (_req: Request, res: Response) => {
  try {
    const result = await chartService.seedDefaultChartOfAccounts();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Vouchers ────────────────────────────────────────────────────────────────
export const getVouchers = async (req: Request, res: Response) => {
  try {
    const vouchers = await voucherService.getVouchers({
      voucher_type: req.query.voucher_type as string,
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.json({ success: true, data: vouchers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createVoucher = async (req: Request, res: Response) => {
  try {
    const voucher = await voucherService.createVoucher(req.body);
    res.status(201).json({ success: true, data: voucher });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getVoucherById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const voucher = await voucherService.getVoucherById(id);
    res.json({ success: true, data: voucher });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const updateVoucher = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const voucher = await voucherService.updateVoucher(id, req.body);
    res.json({ success: true, data: voucher });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const postVoucher = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const voucher = await voucherService.postVoucher(id);
    res.json({ success: true, data: voucher, message: "Voucher posted successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createVoucherTemplate = async (req: Request, res: Response) => {
  try {
    const template = await voucherService.createVoucherTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getVoucherTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await voucherService.getVoucherTemplates();
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVoucherTemplateForUse = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const template = await voucherService.getVoucherTemplateForUse(id);
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const deleteVoucherTemplate = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await voucherService.deleteVoucherTemplate(id);
    res.json({ success: true, message: "Template deleted" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Journals (legacy) ───────────────────────────────────────────────────────
export const getJournals = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const journals = await journalService.getAllJournals(status);
    res.json({ success: true, data: journals });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createJournal = async (req: Request, res: Response) => {
  try {
    const journal = await journalService.createJournalEntry(req.body);
    res.status(201).json({ success: true, data: journal });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const postJournal = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const journal = await journalService.postJournalEntry(id);
    res.json({ success: true, data: journal, message: "Journal posted successfully" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── General Ledger ──────────────────────────────────────────────────────────
export const getGeneralLedger = async (req: Request, res: Response) => {
  try {
    const accountId = Number(req.params.accountId);
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const ledger = await ledgerService.getGeneralLedgerByAccount(accountId, startDate, endDate);
    res.json({ success: true, data: ledger });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Reports ─────────────────────────────────────────────────────────────────
export const getChartOfAccountsReport = async (_req: Request, res: Response) => {
  try {
    const tree = await reportService.getChartOfAccountsReport();
    res.json({ success: true, data: tree });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTrialBalance = async (req: Request, res: Response) => {
  try {
    const report = await reportService.getTrialBalance({
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      companyId: req.query.companyId ? Number(req.query.companyId) : undefined,
      branchId: req.query.branchId ? Number(req.query.branchId) : undefined,
    });
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfitAndLoss = async (req: Request, res: Response) => {
  try {
    const report = await reportService.getProfitAndLoss({
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      companyId: req.query.companyId ? Number(req.query.companyId) : undefined,
      branchId: req.query.branchId ? Number(req.query.branchId) : undefined,
    });
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBalanceSheet = async (req: Request, res: Response) => {
  try {
    const report = await reportService.getBalanceSheet({
      asOfDate: req.query.asOfDate as string,
      endDate: req.query.endDate as string,
      companyId: req.query.companyId ? Number(req.query.companyId) : undefined,
      branchId: req.query.branchId ? Number(req.query.branchId) : undefined,
    });
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReconciliationReport = async (_req: Request, res: Response) => {
  try {
    const report = await reportService.getReconciliationReport();
    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLedgerStatement = async (req: Request, res: Response) => {
  try {
    const ledgerId = Number(req.query.ledger_id);
    if (!ledgerId) throw new Error("ledger_id is required");
    const statement = await ledgerService.getGeneralLedgerByAccount(
      ledgerId,
      req.query.start_date as string,
      req.query.end_date as string
    );
    res.json({ success: true, data: statement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getVendorLedgerReport = async (req: Request, res: Response) => {
  try {
    const vendorId = Number(req.query.vendor_id);
    if (!vendorId) throw new Error("vendor_id is required");
    const statement = await ledgerService.getVendorLedger(
      vendorId,
      req.query.start_date as string,
      req.query.end_date as string
    );
    res.json({ success: true, data: statement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── Accounts Payable ────────────────────────────────────────────────────────
export const getVendors = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await apService.getVendors() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const createVendor = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await apService.createVendor(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};
export const getVendorBills = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await apService.getVendorBills() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const createVendorBill = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await apService.createVendorBill(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};
export const getVendorPayments = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await apService.getVendorPayments() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const createVendorPayment = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await apService.createVendorPayment(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};

// ── Accounts Receivable ─────────────────────────────────────────────────────
export const getCustomerInvoices = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await arService.getCustomerInvoices() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const createCustomerInvoice = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await arService.createCustomerInvoice(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};
export const getCustomerPayments = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await arService.getCustomerPayments() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const createCustomerPayment = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await arService.createCustomerPayment(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};

// ── Credit & Debit Notes ────────────────────────────────────────────────────
export const getCreditDebitNotes = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await noteService.getCreditDebitNotes() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const createCreditDebitNote = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await noteService.createCreditDebitNote(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};

// ── Cash & Bank ─────────────────────────────────────────────────────────────
export const getCashBankAccounts = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await cashBankService.getCashBankAccounts() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const createCashBankAccount = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await cashBankService.createCashBankAccount(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};
export const seedCashBank = async (_req: Request, res: Response) => {
  try { res.json({ success: true, ...(await cashBankService.seedDefaultCashBankAccounts()) }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const getBankReconciliations = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await cashBankService.getBankReconciliations() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const createBankReconciliation = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await cashBankService.createBankReconciliation(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};

// ── Expenses ────────────────────────────────────────────────────────────────
export const getExpenses = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await expenseService.getExpenses() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const createExpense = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await expenseService.createExpense(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};

// ── Fixed Assets ────────────────────────────────────────────────────────────
export const getFixedAssets = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await assetService.getFixedAssets() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const createFixedAsset = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await assetService.createFixedAsset(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};
export const runDepreciation = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const asset = await assetService.runDepreciation(id);
    res.json({ success: true, data: asset, message: "Depreciation calculated" });
  } catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};

// ── Period Closing & Audit ──────────────────────────────────────────────────
export const getPeriodClosings = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await closingService.getPeriodClosings() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
export const closePeriod = async (req: Request, res: Response) => {
  try { res.status(201).json({ success: true, data: await closingService.closePeriod(req.body) }); }
  catch (error: any) { res.status(400).json({ success: false, message: error.message }); }
};
export const getAuditLogs = async (_req: Request, res: Response) => {
  try { res.json({ success: true, data: await closingService.getAuditLogs() }); }
  catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
};
