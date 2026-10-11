import axios from "axios";

const API_URL = "http://localhost:5000/api/accounts";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface AccountItem {
  id: number;
  code: string;
  name: string;
  type: string;
  level?: number;
  account_category?: string;
  parent_id?: number | null;
  normal_balance: string;
  opening_balance: number;
  current_balance: number;
  description?: string;
  is_active: boolean;
  tax_applicable: boolean;
  children?: AccountItem[];
}

export interface VoucherLineItem {
  id?: number;
  account_id: number;
  debit: number;
  credit: number;
  description?: string;
  partner_type?: string;
  partner_id?: number;
  account?: AccountItem;
}

export interface VoucherItem {
  id: number;
  journal_number: string;
  voucher_type?: string;
  date: string;
  reference?: string;
  description?: string;
  narration?: string;
  instrument_no?: string;
  journal_type: string;
  total_debit: number;
  total_credit: number;
  status: string;
  financial_year?: string;
  lines: VoucherLineItem[];
}

export interface VoucherTemplateItem {
  id: number;
  name: string;
  voucher_type: string;
  narration?: string;
  lines: VoucherLineItem[];
  created_by?: string;
  created_at: string;
}

export interface JournalLineItem {
  id?: number;
  account_id: number;
  debit: number;
  credit: number;
  description?: string;
  account?: AccountItem;
}

export interface JournalEntryItem {
  id: number;
  journal_number: string;
  date: string;
  reference?: string;
  description?: string;
  journal_type: string;
  total_debit: number;
  total_credit: number;
  status: string;
  lines: JournalLineItem[];
}

export interface VendorItem {
  id: number;
  vendor_code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  payment_terms?: string;
  credit_limit: number;
  status: string;
}

export interface VendorBillItem {
  id: number;
  bill_number: string;
  vendor_id: number;
  vendor?: VendorItem;
  bill_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  notes?: string;
}

export interface CustomerInvoiceItem {
  id: number;
  invoice_number: string;
  customer_name: string;
  customer_email?: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  status: string;
}

export interface CashBankAccountItem {
  id: number;
  name: string;
  account_type: "CASH" | "BANK";
  account_number?: string;
  bank_name?: string;
  iban?: string;
  currency: string;
  current_balance: number;
  is_active: boolean;
}

export interface ExpenseItem {
  id: number;
  expense_number: string;
  category: string;
  account_id: number;
  amount: number;
  date: string;
  payee: string;
  payment_mode: string;
  description?: string;
  status: string;
}

export interface FixedAssetItem {
  id: number;
  asset_code: string;
  name: string;
  category: string;
  purchase_date: string;
  purchase_cost: number;
  useful_life_years: number;
  accumulated_depreciation: number;
  net_book_value: number;
  status: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchDashboardKpis = async () => {
  const res = await axios.get(`${API_URL}/dashboard/kpis`);
  return res.data;
};

// ── Groups & Ledgers (Hierarchical COA) ──────────────────────────────────────
export const fetchAccountGroupsTree = async () => {
  const res = await axios.get(`${API_URL}/groups/tree`);
  return res.data;
};

export const createAccountGroupApi = async (payload: any) => {
  const res = await axios.post(`${API_URL}/groups`, payload);
  return res.data;
};

export const updateAccountGroupApi = async (id: number, payload: any) => {
  const res = await axios.put(`${API_URL}/groups/${id}`, payload);
  return res.data;
};

export const fetchLedgersApi = async (params?: { search?: string; groupId?: number; page?: number }) => {
  const res = await axios.get(`${API_URL}/ledgers`, { params });
  return res.data;
};

export const createLedgerApi = async (payload: any) => {
  const res = await axios.post(`${API_URL}/ledgers`, payload);
  return res.data;
};

export const updateLedgerApi = async (id: number, payload: any) => {
  const res = await axios.put(`${API_URL}/ledgers/${id}`, payload);
  return res.data;
};

// ── Chart of Accounts (flat/legacy) ──────────────────────────────────────────
export const fetchChartOfAccounts = async () => {
  const res = await axios.get(`${API_URL}/chart-of-accounts`);
  return res.data;
};

export const createAccountApi = async (payload: any) => {
  const res = await axios.post(`${API_URL}/chart-of-accounts`, payload);
  return res.data;
};

export const seedChartOfAccountsApi = async () => {
  const res = await axios.post(`${API_URL}/chart-of-accounts/seed`);
  return res.data;
};

// ── Vouchers ──────────────────────────────────────────────────────────────────
export const fetchVouchersApi = async (params?: { voucher_type?: string; status?: string; startDate?: string; endDate?: string }) => {
  const res = await axios.get(`${API_URL}/vouchers`, { params });
  return res.data;
};

export const createVoucherApi = async (payload: any) => {
  const res = await axios.post(`${API_URL}/vouchers`, payload);
  return res.data;
};

export const getVoucherApi = async (id: number) => {
  const res = await axios.get(`${API_URL}/vouchers/${id}`);
  return res.data;
};

export const updateVoucherApi = async (id: number, payload: any) => {
  const res = await axios.put(`${API_URL}/vouchers/${id}`, payload);
  return res.data;
};

export const postVoucherApi = async (id: number) => {
  const res = await axios.post(`${API_URL}/vouchers/${id}/post`);
  return res.data;
};

export const fetchVoucherTemplatesApi = async () => {
  const res = await axios.get(`${API_URL}/vouchers/templates`);
  return res.data;
};

export const createVoucherTemplateApi = async (payload: any) => {
  const res = await axios.post(`${API_URL}/vouchers/templates`, payload);
  return res.data;
};

export const getVoucherTemplateForUseApi = async (id: number) => {
  const res = await axios.get(`${API_URL}/vouchers/templates/use/${id}`);
  return res.data;
};

export const deleteVoucherTemplateApi = async (id: number) => {
  const res = await axios.delete(`${API_URL}/vouchers/templates/${id}`);
  return res.data;
};

// ── Journals (legacy) ─────────────────────────────────────────────────────────
export const fetchJournalsApi = async () => {
  const res = await axios.get(`${API_URL}/journals`);
  return res.data;
};

export const createJournalApi = async (payload: any) => {
  const res = await axios.post(`${API_URL}/journals`, payload);
  return res.data;
};

export const postJournalApi = async (id: number) => {
  const res = await axios.put(`${API_URL}/journals/${id}/post`);
  return res.data;
};

// ── General Ledger ────────────────────────────────────────────────────────────
export const fetchGeneralLedgerApi = async (accountId: number, startDate?: string, endDate?: string) => {
  const res = await axios.get(`${API_URL}/ledger/${accountId}`, { params: { startDate, endDate } });
  return res.data;
};

export const fetchLedgerStatementApi = async (ledgerId: number, startDate?: string, endDate?: string, branchId?: number) => {
  const res = await axios.get(`${API_URL}/reports/ledger-statement`, {
    params: { ledger_id: ledgerId, start_date: startDate, end_date: endDate, branch_id: branchId },
  });
  return res.data;
};

export const fetchVendorLedgerApi = async (vendorId: number, startDate?: string, endDate?: string) => {
  const res = await axios.get(`${API_URL}/reports/vendor-ledger`, {
    params: { vendor_id: vendorId, start_date: startDate, end_date: endDate },
  });
  return res.data;
};

// ── Accounts Payable ──────────────────────────────────────────────────────────
export const fetchVendorsApi = async () => { const res = await axios.get(`${API_URL}/vendors`); return res.data; };
export const createVendorApi = async (payload: any) => { const res = await axios.post(`${API_URL}/vendors`, payload); return res.data; };
export const fetchVendorBillsApi = async () => { const res = await axios.get(`${API_URL}/vendor-bills`); return res.data; };
export const createVendorBillApi = async (payload: any) => { const res = await axios.post(`${API_URL}/vendor-bills`, payload); return res.data; };
export const fetchVendorPaymentsApi = async () => { const res = await axios.get(`${API_URL}/vendor-payments`); return res.data; };
export const createVendorPaymentApi = async (payload: any) => { const res = await axios.post(`${API_URL}/vendor-payments`, payload); return res.data; };

// ── Accounts Receivable ───────────────────────────────────────────────────────
export const fetchCustomerInvoicesApi = async () => { const res = await axios.get(`${API_URL}/customer-invoices`); return res.data; };
export const createCustomerInvoiceApi = async (payload: any) => { const res = await axios.post(`${API_URL}/customer-invoices`, payload); return res.data; };
export const createCustomerPaymentApi = async (payload: any) => { const res = await axios.post(`${API_URL}/customer-payments`, payload); return res.data; };

// ── Cash & Bank ───────────────────────────────────────────────────────────────
export const fetchCashBankAccountsApi = async () => { const res = await axios.get(`${API_URL}/cash-bank-accounts`); return res.data; };
export const seedCashBankApi = async () => { const res = await axios.post(`${API_URL}/cash-bank-accounts/seed`); return res.data; };
export const createCashBankAccountApi = async (payload: any) => { const res = await axios.post(`${API_URL}/cash-bank-accounts`, payload); return res.data; };

// ── Expenses ──────────────────────────────────────────────────────────────────
export const fetchExpensesApi = async () => { const res = await axios.get(`${API_URL}/expenses`); return res.data; };
export const createExpenseApi = async (payload: any) => { const res = await axios.post(`${API_URL}/expenses`, payload); return res.data; };

// ── Fixed Assets ──────────────────────────────────────────────────────────────
export const fetchFixedAssetsApi = async () => { const res = await axios.get(`${API_URL}/fixed-assets`); return res.data; };
export const createFixedAssetApi = async (payload: any) => { const res = await axios.post(`${API_URL}/fixed-assets`, payload); return res.data; };
export const runDepreciationApi = async (id: number) => { const res = await axios.post(`${API_URL}/fixed-assets/${id}/depreciate`); return res.data; };

// ── Financial Reports ─────────────────────────────────────────────────────────
export const fetchTrialBalanceApi = async (params?: { startDate?: string; endDate?: string; companyId?: number; branchId?: number }) => {
  const res = await axios.get(`${API_URL}/reports/trial-balance`, { params });
  return res.data;
};

export const fetchProfitLossApi = async (params?: { startDate?: string; endDate?: string; companyId?: number; branchId?: number }) => {
  const res = await axios.get(`${API_URL}/reports/profit-loss`, { params });
  return res.data;
};

export const fetchBalanceSheetApi = async (params?: { asOfDate?: string; endDate?: string; companyId?: number; branchId?: number }) => {
  const res = await axios.get(`${API_URL}/reports/balance-sheet`, { params });
  return res.data;
};

export const fetchCOAReportApi = async () => {
  const res = await axios.get(`${API_URL}/reports/chart-of-accounts`);
  return res.data;
};

// ── Period Closing ────────────────────────────────────────────────────────────
export const fetchPeriodClosingsApi = async () => { const res = await axios.get(`${API_URL}/period-closings`); return res.data; };
export const closePeriodApi = async (payload: any) => { const res = await axios.post(`${API_URL}/period-closings`, payload); return res.data; };
export const fetchAuditLogsApi = async () => { const res = await axios.get(`${API_URL}/audit-logs`); return res.data; };
