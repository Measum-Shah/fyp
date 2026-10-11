import { Router } from "express";
import * as ctrl from "../controllers/accounts.controller";

const router = Router();

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get("/dashboard/kpis", ctrl.getDashboardKpis);

// ── Groups & Ledgers (hierarchical COA) ───────────────────────────────────
router.get("/groups/tree", ctrl.getAccountGroupsTree);
router.post("/groups", ctrl.createAccountGroup);
router.put("/groups/:id", ctrl.updateAccountGroup);
router.get("/ledgers", ctrl.getLedgers);
router.post("/ledgers", ctrl.createLedger);
router.put("/ledgers/:id", ctrl.updateLedger);

// ── Chart of Accounts (flat, legacy) ──────────────────────────────────────
router.get("/chart-of-accounts", ctrl.getChartOfAccounts);
router.post("/chart-of-accounts", ctrl.createAccount);
router.post("/chart-of-accounts/seed", ctrl.seedChartOfAccounts);

// ── Vouchers (double-entry engine) ────────────────────────────────────────
router.get("/vouchers", ctrl.getVouchers);
router.post("/vouchers", ctrl.createVoucher);
router.get("/vouchers/templates", ctrl.getVoucherTemplates);
router.post("/vouchers/templates", ctrl.createVoucherTemplate);
router.get("/vouchers/templates/use/:id", ctrl.getVoucherTemplateForUse);
router.delete("/vouchers/templates/:id", ctrl.deleteVoucherTemplate);
router.get("/vouchers/:id", ctrl.getVoucherById);
router.put("/vouchers/:id", ctrl.updateVoucher);
router.post("/vouchers/:id/post", ctrl.postVoucher);

// ── Journals (legacy) ─────────────────────────────────────────────────────
router.get("/journals", ctrl.getJournals);
router.post("/journals", ctrl.createJournal);
router.put("/journals/:id/post", ctrl.postJournal);

// ── General Ledger ────────────────────────────────────────────────────────
router.get("/ledger/:accountId", ctrl.getGeneralLedger);

// ── Accounts Payable ──────────────────────────────────────────────────────
router.get("/vendors", ctrl.getVendors);
router.post("/vendors", ctrl.createVendor);
router.get("/vendor-bills", ctrl.getVendorBills);
router.post("/vendor-bills", ctrl.createVendorBill);
router.get("/vendor-payments", ctrl.getVendorPayments);
router.post("/vendor-payments", ctrl.createVendorPayment);

// ── Accounts Receivable ───────────────────────────────────────────────────
router.get("/customer-invoices", ctrl.getCustomerInvoices);
router.post("/customer-invoices", ctrl.createCustomerInvoice);
router.get("/customer-payments", ctrl.getCustomerPayments);
router.post("/customer-payments", ctrl.createCustomerPayment);

// ── Credit & Debit Notes ──────────────────────────────────────────────────
router.get("/credit-debit-notes", ctrl.getCreditDebitNotes);
router.post("/credit-debit-notes", ctrl.createCreditDebitNote);

// ── Cash & Bank ───────────────────────────────────────────────────────────
router.get("/cash-bank-accounts", ctrl.getCashBankAccounts);
router.post("/cash-bank-accounts", ctrl.createCashBankAccount);
router.post("/cash-bank-accounts/seed", ctrl.seedCashBank);
router.get("/bank-reconciliations", ctrl.getBankReconciliations);
router.post("/bank-reconciliations", ctrl.createBankReconciliation);

// ── Expenses ──────────────────────────────────────────────────────────────
router.get("/expenses", ctrl.getExpenses);
router.post("/expenses", ctrl.createExpense);

// ── Fixed Assets ──────────────────────────────────────────────────────────
router.get("/fixed-assets", ctrl.getFixedAssets);
router.post("/fixed-assets", ctrl.createFixedAsset);
router.post("/fixed-assets/:id/depreciate", ctrl.runDepreciation);

// ── Financial Reports ─────────────────────────────────────────────────────
router.get("/reports/chart-of-accounts", ctrl.getChartOfAccountsReport);
router.get("/reports/trial-balance", ctrl.getTrialBalance);
router.get("/reports/profit-loss", ctrl.getProfitAndLoss);
router.get("/reports/balance-sheet", ctrl.getBalanceSheet);
router.get("/reports/ledger-statement", ctrl.getLedgerStatement);
router.get("/reports/vendor-ledger", ctrl.getVendorLedgerReport);
router.get("/reports/reconciliation", ctrl.getReconciliationReport);

// ── Period Closing & Audit ────────────────────────────────────────────────
router.get("/period-closings", ctrl.getPeriodClosings);
router.post("/period-closings", ctrl.closePeriod);
router.get("/audit-logs", ctrl.getAuditLogs);

export default router;
