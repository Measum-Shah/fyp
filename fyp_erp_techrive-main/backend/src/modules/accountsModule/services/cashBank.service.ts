import { prisma } from "../../../config/db";

// ── Cash & Bank Accounts ───────────────────────────────────────────────────
export const getCashBankAccounts = async () => {
  return await prisma.accCashBankAccount.findMany({
    orderBy: { created_at: "desc" },
  });
};

export const createCashBankAccount = async (data: {
  name: string;
  account_type: string; // CASH, BANK
  account_number?: string;
  bank_name?: string;
  iban?: string;
  currency?: string;
  current_balance?: number;
  gl_account_id?: number;
}) => {
  return await prisma.accCashBankAccount.create({
    data: {
      name: data.name,
      account_type: data.account_type.toUpperCase(),
      account_number: data.account_number || null,
      bank_name: data.bank_name || null,
      iban: data.iban || null,
      currency: data.currency || "PKR",
      current_balance: data.current_balance || 0,
      gl_account_id: data.gl_account_id || null,
    },
  });
};

export const seedDefaultCashBankAccounts = async () => {
  const count = await prisma.accCashBankAccount.count();
  if (count > 0) return { message: "Cash & Bank accounts already initialized" };

  await prisma.accCashBankAccount.createMany({
    data: [
      {
        name: "Main Cash Float",
        account_type: "CASH",
        currency: "PKR",
        current_balance: 50000.0,
      },
      {
        name: "Meezan Bank Operating Account",
        account_type: "BANK",
        account_number: "01020304050607",
        bank_name: "Meezan Bank Ltd",
        iban: "PK36MEZN0001020304050607",
        currency: "PKR",
        current_balance: 1250000.0,
      },
      {
        name: "HBL Corporate Account",
        account_type: "BANK",
        account_number: "99887766554433",
        bank_name: "Habib Bank Limited",
        iban: "PK36HABB0099887766554433",
        currency: "PKR",
        current_balance: 4500000.0,
      },
    ],
  });

  return { message: "Default Cash & Bank accounts seeded!" };
};

// ── Bank Reconciliations ──────────────────────────────────────────────────
export const getBankReconciliations = async () => {
  return await prisma.accBankReconciliation.findMany({
    orderBy: { statement_date: "desc" },
  });
};

export const createBankReconciliation = async (data: {
  bank_account_id: number;
  statement_date: string;
  statement_balance: number;
  gl_balance: number;
  notes?: string;
}) => {
  const diff = Math.abs(data.statement_balance - data.gl_balance);
  const status = diff < 0.01 ? "RECONCILED" : "DISCREPANCY";

  return await prisma.accBankReconciliation.create({
    data: {
      bank_account_id: data.bank_account_id,
      statement_date: new Date(data.statement_date),
      statement_balance: data.statement_balance,
      gl_balance: data.gl_balance,
      difference: diff,
      status,
      notes: data.notes || null,
    },
  });
};
