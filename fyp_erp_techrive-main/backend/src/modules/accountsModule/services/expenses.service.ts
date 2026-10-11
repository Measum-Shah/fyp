import { prisma } from "../../../config/db";

export const getExpenses = async () => {
  return await prisma.accExpense.findMany({
    orderBy: { created_at: "desc" },
  });
};

export const createExpense = async (data: {
  category: string;
  account_id: number;
  amount: number;
  date: string;
  payee: string;
  payment_mode: string;
  cash_bank_account_id?: number;
  description?: string;
  receipt_url?: string;
}) => {
  const count = await prisma.accExpense.count();
  const expenseNumber = `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  return await prisma.$transaction(async (tx) => {
    const expense = await tx.accExpense.create({
      data: {
        expense_number: expenseNumber,
        category: data.category,
        account_id: data.account_id,
        amount: data.amount,
        date: new Date(data.date),
        payee: data.payee,
        payment_mode: data.payment_mode,
        cash_bank_account_id: data.cash_bank_account_id || null,
        description: data.description || null,
        receipt_url: data.receipt_url || null,
        status: "APPROVED",
      },
    });

    // If paid via cash/bank account, deduct balance
    if (data.cash_bank_account_id) {
      await tx.accCashBankAccount.update({
        where: { id: data.cash_bank_account_id },
        data: {
          current_balance: { decrement: data.amount },
        },
      });
    }

    return expense;
  });
};
