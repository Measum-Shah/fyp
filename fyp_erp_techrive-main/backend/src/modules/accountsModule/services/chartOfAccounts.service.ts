import { prisma } from "../../../config/db";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AccountGroupInput {
  name: string;
  type: string;
  parent_id?: number | null;
  description?: string;
}

export interface LedgerInput {
  name: string;
  type: string;
  parent_id: number;
  normal_balance?: string;
  opening_balance?: number;
  description?: string;
  tax_applicable?: boolean;
  branch_id?: number;
  cost_center_id?: number;
}

// ─── Recursive tree helper ────────────────────────────────────────────────────

const buildTree = (accounts: any[], parentId: number | null = null): any[] => {
  return accounts
    .filter((a) => a.parent_id === parentId)
    .map((a) => ({
      ...a,
      children: buildTree(accounts, a.id),
    }));
};

// ─── COA flat list ────────────────────────────────────────────────────────────

export const getChartOfAccounts = async () => {
  return await prisma.accAccount.findMany({ orderBy: { code: "asc" } });
};

export const getAccountById = async (id: number) => {
  return await prisma.accAccount.findUnique({ where: { id } });
};

// ─── Hierarchical tree ────────────────────────────────────────────────────────

export const getAccountGroupsTree = async () => {
  const all = await prisma.accAccount.findMany({ orderBy: { code: "asc" } });
  return buildTree(all, null);
};

// ─── Create Group (levels 1-4) ────────────────────────────────────────────────

export const createAccountGroup = async (data: AccountGroupInput) => {
  let level = 1;
  let codePrefix = "";

  if (data.parent_id) {
    const parent = await prisma.accAccount.findUnique({ where: { id: data.parent_id } });
    if (!parent) throw new Error("Parent account not found");
    if (parent.level >= 4) throw new Error("Cannot create a group under a Level-4 group — use createLedger instead");
    level = parent.level + 1;
    codePrefix = parent.code;
  }

  // Auto-generate code: find max sibling code and increment
  const siblings = await prisma.accAccount.findMany({
    where: { parent_id: data.parent_id ?? null, account_category: "GROUP" },
    orderBy: { code: "desc" },
  });

  let code: string;
  if (siblings.length === 0) {
    code = codePrefix ? `${codePrefix}01` : getTypeRoot(data.type);
  } else {
    const lastCode = siblings[0].code;
    const lastNum = parseInt(lastCode.slice(-2), 10);
    code = `${codePrefix}${String(lastNum + 1).padStart(2, "0")}`;
  }

  return await prisma.accAccount.create({
    data: {
      code,
      name: data.name,
      type: data.type.toUpperCase(),
      parent_id: data.parent_id ?? null,
      level,
      account_category: "GROUP",
      normal_balance: ["ASSET", "EXPENSE"].includes(data.type.toUpperCase()) ? "DEBIT" : "CREDIT",
      description: data.description ?? null,
    },
  });
};

const getTypeRoot = (type: string): string => {
  const roots: Record<string, string> = {
    ASSET: "1000",
    LIABILITY: "2000",
    EQUITY: "3000",
    REVENUE: "4000",
    EXPENSE: "5000",
  };
  return roots[type?.toUpperCase()] ?? "9000";
};

// ─── Update Group ─────────────────────────────────────────────────────────────

export const updateAccountGroup = async (id: number, data: Partial<AccountGroupInput>) => {
  const existing = await prisma.accAccount.findUnique({ where: { id } });
  if (!existing) throw new Error("Account not found");
  if (existing.account_category !== "GROUP") throw new Error("This account is a ledger, not a group");

  if (data.parent_id !== undefined && data.parent_id !== existing.parent_id) {
    // Check no children exist that would break hierarchy
    const children = await prisma.accAccount.count({ where: { parent_id: id } });
    if (children > 0) throw new Error("Cannot change parent of a group that has children");
  }

  return await prisma.accAccount.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
    },
  });
};

// ─── Get Ledgers (Level 5) ────────────────────────────────────────────────────

export const getLedgers = async (page = 1, search = "", groupId?: number) => {
  const pageSize = 50;
  const where: any = { account_category: "LEDGER" };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }
  if (groupId) where.parent_id = groupId;

  const [items, total] = await Promise.all([
    prisma.accAccount.findMany({
      where,
      orderBy: { code: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.accAccount.count({ where }),
  ]);

  return { items, total, page, pageSize };
};

// ─── Create Ledger (Level 5) ──────────────────────────────────────────────────

export const createLedger = async (data: LedgerInput) => {
  const parent = await prisma.accAccount.findUnique({ where: { id: data.parent_id } });
  if (!parent) throw new Error("Parent group not found");
  if (parent.account_category !== "GROUP")
    throw new Error("Parent must be a GROUP (level 1-4)");
  if (parent.level > 4)
    throw new Error("Ledgers can only be created under Level 1-4 groups");

  // Auto-generate ledger code: parent code + sequential suffix
  const siblings = await prisma.accAccount.findMany({
    where: { parent_id: data.parent_id, account_category: "LEDGER" },
    orderBy: { code: "desc" },
  });

  let code: string;
  if (siblings.length === 0) {
    code = `${parent.code}001`;
  } else {
    const lastNum = parseInt(siblings[0].code.slice(-3), 10);
    code = `${parent.code}${String(lastNum + 1).padStart(3, "0")}`;
  }

  const opening = data.opening_balance ?? 0;
  return await prisma.accAccount.create({
    data: {
      code,
      name: data.name,
      type: data.type.toUpperCase(),
      parent_id: data.parent_id,
      level: 5,
      account_category: "LEDGER",
      normal_balance: data.normal_balance ?? (["ASSET", "EXPENSE"].includes(data.type.toUpperCase()) ? "DEBIT" : "CREDIT"),
      opening_balance: opening,
      current_balance: opening,
      description: data.description ?? null,
      tax_applicable: data.tax_applicable ?? false,
      branch_id: data.branch_id ?? null,
      cost_center_id: data.cost_center_id ?? null,
    },
  });
};

// ─── Update Ledger ─────────────────────────────────────────────────────────────

export const updateLedger = async (id: number, data: Partial<LedgerInput>) => {
  return await prisma.accAccount.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      tax_applicable: data.tax_applicable,
      is_active: true,
    },
  });
};

// ─── Create Account (generic, backward compat) ───────────────────────────────

export const createAccount = async (data: {
  code: string;
  name: string;
  type: string;
  parent_id?: number | null;
  normal_balance?: string;
  opening_balance?: number;
  description?: string;
  branch_id?: number | null;
  cost_center_id?: number | null;
  tax_applicable?: boolean;
  level?: number;
  account_category?: string;
}) => {
  const openingBalance = data.opening_balance || 0;
  return await prisma.accAccount.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type.toUpperCase(),
      parent_id: data.parent_id || null,
      level: data.level ?? 5,
      account_category: data.account_category ?? "LEDGER",
      normal_balance: data.normal_balance || (["ASSET", "EXPENSE"].includes(data.type.toUpperCase()) ? "DEBIT" : "CREDIT"),
      opening_balance: openingBalance,
      current_balance: openingBalance,
      description: data.description || null,
      branch_id: data.branch_id || null,
      cost_center_id: data.cost_center_id || null,
      tax_applicable: data.tax_applicable || false,
    },
  });
};

export const updateAccount = async (id: number, data: any) => {
  return await prisma.accAccount.update({ where: { id }, data });
};

// ─── Seed 5-Level Hierarchy ───────────────────────────────────────────────────

export const seedDefaultChartOfAccounts = async () => {
  const count = await prisma.accAccount.count();
  if (count > 0) return { message: "Chart of Accounts already initialized" };

  const accounts = [
    // ── Level 1 — Account Types ─────────────────────────────────────
    { code: "1", name: "Assets", type: "ASSET", level: 1, account_category: "GROUP", parent_id: null, normal_balance: "DEBIT" },
    { code: "2", name: "Liabilities", type: "LIABILITY", level: 1, account_category: "GROUP", parent_id: null, normal_balance: "CREDIT" },
    { code: "3", name: "Equity", type: "EQUITY", level: 1, account_category: "GROUP", parent_id: null, normal_balance: "CREDIT" },
    { code: "4", name: "Revenue", type: "REVENUE", level: 1, account_category: "GROUP", parent_id: null, normal_balance: "CREDIT" },
    { code: "5", name: "Expenses", type: "EXPENSE", level: 1, account_category: "GROUP", parent_id: null, normal_balance: "DEBIT" },
  ];

  // Create level-1 nodes first and track ids
  const created: Record<string, any> = {};
  for (const acc of accounts) {
    const r = await prisma.accAccount.create({ data: acc });
    created[acc.code] = r;
  }

  // ── Level 2 Groups ───────────────────────────────────────────────
  const l2 = [
    { code: "101", name: "Current Assets", type: "ASSET", level: 2, account_category: "GROUP", parent_id: created["1"].id, normal_balance: "DEBIT" },
    { code: "102", name: "Fixed Assets", type: "ASSET", level: 2, account_category: "GROUP", parent_id: created["1"].id, normal_balance: "DEBIT" },
    { code: "201", name: "Current Liabilities", type: "LIABILITY", level: 2, account_category: "GROUP", parent_id: created["2"].id, normal_balance: "CREDIT" },
    { code: "202", name: "Long-term Liabilities", type: "LIABILITY", level: 2, account_category: "GROUP", parent_id: created["2"].id, normal_balance: "CREDIT" },
    { code: "301", name: "Share Capital", type: "EQUITY", level: 2, account_category: "GROUP", parent_id: created["3"].id, normal_balance: "CREDIT" },
    { code: "302", name: "Retained Earnings", type: "EQUITY", level: 2, account_category: "GROUP", parent_id: created["3"].id, normal_balance: "CREDIT" },
    { code: "401", name: "Operating Revenue", type: "REVENUE", level: 2, account_category: "GROUP", parent_id: created["4"].id, normal_balance: "CREDIT" },
    { code: "402", name: "Other Revenue", type: "REVENUE", level: 2, account_category: "GROUP", parent_id: created["4"].id, normal_balance: "CREDIT" },
    { code: "501", name: "Cost of Goods Sold", type: "EXPENSE", level: 2, account_category: "GROUP", parent_id: created["5"].id, normal_balance: "DEBIT" },
    { code: "502", name: "Operating Expenses", type: "EXPENSE", level: 2, account_category: "GROUP", parent_id: created["5"].id, normal_balance: "DEBIT" },
  ];
  for (const acc of l2) {
    const r = await prisma.accAccount.create({ data: acc });
    created[acc.code] = r;
  }

  // ── Level 3 Groups ───────────────────────────────────────────────
  const l3 = [
    { code: "10101", name: "Cash & Cash Equivalents", type: "ASSET", level: 3, account_category: "GROUP", parent_id: created["101"].id, normal_balance: "DEBIT" },
    { code: "10102", name: "Trade Receivables", type: "ASSET", level: 3, account_category: "GROUP", parent_id: created["101"].id, normal_balance: "DEBIT" },
    { code: "10103", name: "Inventories", type: "ASSET", level: 3, account_category: "GROUP", parent_id: created["101"].id, normal_balance: "DEBIT" },
    { code: "10201", name: "Property Plant & Equipment", type: "ASSET", level: 3, account_category: "GROUP", parent_id: created["102"].id, normal_balance: "DEBIT" },
    { code: "20101", name: "Trade Payables", type: "LIABILITY", level: 3, account_category: "GROUP", parent_id: created["201"].id, normal_balance: "CREDIT" },
    { code: "20102", name: "Tax Payables", type: "LIABILITY", level: 3, account_category: "GROUP", parent_id: created["201"].id, normal_balance: "CREDIT" },
    { code: "40101", name: "Product Sales", type: "REVENUE", level: 3, account_category: "GROUP", parent_id: created["401"].id, normal_balance: "CREDIT" },
    { code: "40102", name: "Service Revenue", type: "REVENUE", level: 3, account_category: "GROUP", parent_id: created["401"].id, normal_balance: "CREDIT" },
    { code: "50201", name: "Employee Costs", type: "EXPENSE", level: 3, account_category: "GROUP", parent_id: created["502"].id, normal_balance: "DEBIT" },
    { code: "50202", name: "Overhead Expenses", type: "EXPENSE", level: 3, account_category: "GROUP", parent_id: created["502"].id, normal_balance: "DEBIT" },
  ];
  for (const acc of l3) {
    const r = await prisma.accAccount.create({ data: acc });
    created[acc.code] = r;
  }

  // ── Level 4 Groups ───────────────────────────────────────────────
  const l4 = [
    { code: "1010101", name: "Cash in Hand", type: "ASSET", level: 4, account_category: "GROUP", parent_id: created["10101"].id, normal_balance: "DEBIT" },
    { code: "1010102", name: "Bank Accounts", type: "ASSET", level: 4, account_category: "GROUP", parent_id: created["10101"].id, normal_balance: "DEBIT" },
    { code: "1010201", name: "Accounts Receivable", type: "ASSET", level: 4, account_category: "GROUP", parent_id: created["10102"].id, normal_balance: "DEBIT" },
    { code: "1010301", name: "Raw Material Inventory", type: "ASSET", level: 4, account_category: "GROUP", parent_id: created["10103"].id, normal_balance: "DEBIT" },
    { code: "1020101", name: "Office Equipment", type: "ASSET", level: 4, account_category: "GROUP", parent_id: created["10201"].id, normal_balance: "DEBIT" },
    { code: "2010101", name: "Accounts Payable", type: "LIABILITY", level: 4, account_category: "GROUP", parent_id: created["20101"].id, normal_balance: "CREDIT" },
    { code: "2010201", name: "Sales Tax Payable", type: "LIABILITY", level: 4, account_category: "GROUP", parent_id: created["20102"].id, normal_balance: "CREDIT" },
    { code: "4010101", name: "Manufactured Goods Revenue", type: "REVENUE", level: 4, account_category: "GROUP", parent_id: created["40101"].id, normal_balance: "CREDIT" },
    { code: "4010201", name: "Consulting Revenue", type: "REVENUE", level: 4, account_category: "GROUP", parent_id: created["40102"].id, normal_balance: "CREDIT" },
    { code: "5020101", name: "Salaries & Wages", type: "EXPENSE", level: 4, account_category: "GROUP", parent_id: created["50201"].id, normal_balance: "DEBIT" },
    { code: "5020201", name: "Utilities & Rent", type: "EXPENSE", level: 4, account_category: "GROUP", parent_id: created["50202"].id, normal_balance: "DEBIT" },
    { code: "5010101", name: "COGS - Direct Material", type: "EXPENSE", level: 4, account_category: "GROUP", parent_id: created["501"].id, normal_balance: "DEBIT" },
  ];
  for (const acc of l4) {
    const r = await prisma.accAccount.create({ data: acc });
    created[acc.code] = r;
  }

  // ── Level 5 Ledgers ──────────────────────────────────────────────
  const l5 = [
    { code: "101010101", name: "Petty Cash", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: created["1010101"].id, normal_balance: "DEBIT" },
    { code: "101010201", name: "Main Bank Account – HBL", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: created["1010102"].id, normal_balance: "DEBIT" },
    { code: "101010202", name: "Main Bank Account – UBL", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: created["1010102"].id, normal_balance: "DEBIT" },
    { code: "101020101", name: "Accounts Receivable – Trade", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: created["1010201"].id, normal_balance: "DEBIT" },
    { code: "101030101", name: "Raw Material Store", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: created["1010301"].id, normal_balance: "DEBIT" },
    { code: "201010101", name: "Accounts Payable – Trade", type: "LIABILITY", level: 5, account_category: "LEDGER", parent_id: created["2010101"].id, normal_balance: "CREDIT" },
    { code: "201020101", name: "Sales Tax Payable – FBR", type: "LIABILITY", level: 5, account_category: "LEDGER", parent_id: created["2010201"].id, normal_balance: "CREDIT" },
    { code: "401010101", name: "Product Sales Revenue", type: "REVENUE", level: 5, account_category: "LEDGER", parent_id: created["4010101"].id, normal_balance: "CREDIT" },
    { code: "401020101", name: "Consulting Fee Revenue", type: "REVENUE", level: 5, account_category: "LEDGER", parent_id: created["4010201"].id, normal_balance: "CREDIT" },
    { code: "502010101", name: "Basic Salaries Expense", type: "EXPENSE", level: 5, account_category: "LEDGER", parent_id: created["5020101"].id, normal_balance: "DEBIT" },
    { code: "502020101", name: "Office Rent Expense", type: "EXPENSE", level: 5, account_category: "LEDGER", parent_id: created["5020201"].id, normal_balance: "DEBIT" },
    { code: "502020102", name: "Electricity & Utilities Expense", type: "EXPENSE", level: 5, account_category: "LEDGER", parent_id: created["5020201"].id, normal_balance: "DEBIT" },
    { code: "501010101", name: "COGS – Raw Material Consumed", type: "EXPENSE", level: 5, account_category: "LEDGER", parent_id: created["5010101"].id, normal_balance: "DEBIT" },
  ];
  for (const acc of l5) {
    await prisma.accAccount.create({ data: acc });
  }

  // ── Integration-Specific Ledger Accounts (flat codes used by posting hooks) ─
  // These are standalone LEDGER accounts with short codes that the payroll,
  // fee, and loan GL posting hooks look up by code. They sit outside the
  // 9-digit hierarchical tree above but are valid ledger-level accounts.
  const integrationAccounts = [
    { code: "1010", name: "Cash / Bank (Integration)", type: "ASSET", level: 5, account_category: "LEDGER", normal_balance: "DEBIT", description: "Default cash/bank account for automated GL postings" },
    { code: "1020", name: "Student Fee Receivable", type: "ASSET", level: 5, account_category: "LEDGER", normal_balance: "DEBIT", description: "Student receivables for fee management postings" },
    { code: "1050", name: "Employee Loan Receivable", type: "ASSET", level: 5, account_category: "LEDGER", normal_balance: "DEBIT", description: "Tracks outstanding employee loan balances" },
    { code: "2020", name: "Tax Withholding Payable", type: "LIABILITY", level: 5, account_category: "LEDGER", normal_balance: "CREDIT", description: "Payroll tax withholdings pending remittance" },
    { code: "4010", name: "Fee Revenue", type: "REVENUE", level: 5, account_category: "LEDGER", normal_balance: "CREDIT", description: "Tuition and fee income from students" },
    { code: "4020", name: "Fine & Penalty Income", type: "REVENUE", level: 5, account_category: "LEDGER", normal_balance: "CREDIT", description: "Academic fines and late fee income" },
    { code: "5010", name: "Salary Expense", type: "EXPENSE", level: 5, account_category: "LEDGER", normal_balance: "DEBIT", description: "Gross salary expense for payroll postings" },
    { code: "5020", name: "Discount / Scholarship Expense", type: "EXPENSE", level: 5, account_category: "LEDGER", normal_balance: "DEBIT", description: "Fee discount and scholarship contra-revenue" },
  ];
  for (const acc of integrationAccounts) {
    const exists = await prisma.accAccount.findFirst({ where: { code: acc.code } });
    if (!exists) {
      await prisma.accAccount.create({ data: acc });
    }
  }

  return { message: "5-Level Chart of Accounts seeded successfully!" };
};
