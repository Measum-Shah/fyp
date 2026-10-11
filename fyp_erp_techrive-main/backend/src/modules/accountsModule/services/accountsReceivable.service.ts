import { prisma } from "../../../config/db";

// ── Customer Invoices ──────────────────────────────────────────────────────
export const getCustomerInvoices = async () => {
  return await prisma.accCustomerInvoice.findMany({
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

export const createCustomerInvoice = async (data: {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  invoice_date: string;
  due_date: string;
  so_reference?: string;
  delivery_ref?: string;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
  lines: Array<{
    item_description: string;
    account_id: number;
    quantity: number;
    unit_price: number;
    tax_amount?: number;
  }>;
}) => {
  let subtotal = 0;
  const lineData = data.lines.map((l) => {
    const qty = l.quantity || 1;
    const price = l.unit_price || 0;
    const lineTax = l.tax_amount || 0;
    const lineTotal = qty * price + lineTax;
    subtotal += qty * price;
    return {
      item_description: l.item_description,
      account_id: l.account_id,
      quantity: qty,
      unit_price: price,
      tax_amount: lineTax,
      total_price: lineTotal,
    };
  });

  const taxAmount = data.tax_amount || 0;
  const discountAmount = data.discount_amount || 0;
  const totalAmount = subtotal + taxAmount - discountAmount;

  const count = await prisma.accCustomerInvoice.count();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  return await prisma.accCustomerInvoice.create({
    data: {
      invoice_number: invoiceNumber,
      customer_name: data.customer_name,
      customer_email: data.customer_email || null,
      customer_phone: data.customer_phone || null,
      customer_address: data.customer_address || null,
      invoice_date: new Date(data.invoice_date),
      due_date: new Date(data.due_date),
      so_reference: data.so_reference || null,
      delivery_ref: data.delivery_ref || null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      paid_amount: 0,
      status: "POSTED",
      notes: data.notes || null,
      lines: {
        create: lineData,
      },
    },
    include: {
      lines: true,
    },
  });
};

// ── Customer Payments ──────────────────────────────────────────────────────
export const getCustomerPayments = async () => {
  return await prisma.accCustomerPayment.findMany({
    orderBy: { created_at: "desc" },
  });
};

export const createCustomerPayment = async (data: {
  customer_name: string;
  payment_date: string;
  amount: number;
  payment_mode: string;
  cash_bank_account_id: number;
  reference_no?: string;
  invoice_id?: number;
  notes?: string;
}) => {
  const count = await prisma.accCustomerPayment.count();
  const receiptNumber = `RCPT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.accCustomerPayment.create({
      data: {
        receipt_number: receiptNumber,
        customer_name: data.customer_name,
        payment_date: new Date(data.payment_date),
        amount: data.amount,
        payment_mode: data.payment_mode,
        cash_bank_account_id: data.cash_bank_account_id,
        reference_no: data.reference_no || null,
        unallocated_amount: data.invoice_id ? 0 : data.amount,
        status: "POSTED",
        notes: data.notes || null,
      },
    });

    // If settling a specific invoice
    if (data.invoice_id) {
      const inv = await tx.accCustomerInvoice.findUnique({ where: { id: data.invoice_id } });
      if (inv) {
        const newPaid = Number(inv.paid_amount) + data.amount;
        const total = Number(inv.total_amount);
        const newStatus = newPaid >= total ? "PAID" : "PARTIALLY_PAID";

        await tx.accCustomerInvoice.update({
          where: { id: data.invoice_id },
          data: {
            paid_amount: newPaid,
            status: newStatus,
          },
        });
      }
    }

    // Update Cash/Bank account balance
    await tx.accCashBankAccount.update({
      where: { id: data.cash_bank_account_id },
      data: {
        current_balance: { increment: data.amount },
      },
    });

    return payment;
  });
};
