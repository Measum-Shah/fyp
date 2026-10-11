import { prisma } from "../../../config/db";

// ── Vendors ────────────────────────────────────────────────────────────────
export const getVendors = async () => {
  return await prisma.accVendor.findMany({
    orderBy: { created_at: "desc" },
  });
};

export const createVendor = async (data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  payment_terms?: string;
  credit_limit?: number;
}) => {
  const count = await prisma.accVendor.count();
  const vendorCode = `VEND-${String(count + 1).padStart(4, "0")}`;

  return await prisma.accVendor.create({
    data: {
      vendor_code: vendorCode,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      tax_number: data.tax_number || null,
      payment_terms: data.payment_terms || "Net 30",
      credit_limit: data.credit_limit || 0,
    },
  });
};

// ── Vendor Bills ───────────────────────────────────────────────────────────
export const getVendorBills = async () => {
  return await prisma.accVendorBill.findMany({
    include: {
      vendor: true,
      lines: {
        include: {
          account: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
};

export const createVendorBill = async (data: {
  vendor_id: number;
  bill_date: string;
  due_date: string;
  supplier_bill_no?: string;
  po_reference?: string;
  grn_reference?: string;
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

  const count = await prisma.accVendorBill.count();
  const billNumber = `BILL-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  return await prisma.accVendorBill.create({
    data: {
      bill_number: billNumber,
      supplier_bill_no: data.supplier_bill_no || null,
      vendor_id: data.vendor_id,
      bill_date: new Date(data.bill_date),
      due_date: new Date(data.due_date),
      po_reference: data.po_reference || null,
      grn_reference: data.grn_reference || null,
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
      vendor: true,
      lines: true,
    },
  });
};

// ── Vendor Payments ────────────────────────────────────────────────────────
export const getVendorPayments = async () => {
  return await prisma.accVendorPayment.findMany({
    include: { vendor: true },
    orderBy: { created_at: "desc" },
  });
};

export const createVendorPayment = async (data: {
  vendor_id: number;
  payment_date: string;
  amount: number;
  payment_mode: string;
  cash_bank_account_id: number;
  reference_no?: string;
  bill_id?: number;
  notes?: string;
}) => {
  const count = await prisma.accVendorPayment.count();
  const paymentNumber = `VPAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.accVendorPayment.create({
      data: {
        payment_number: paymentNumber,
        vendor_id: data.vendor_id,
        payment_date: new Date(data.payment_date),
        amount: data.amount,
        payment_mode: data.payment_mode,
        cash_bank_account_id: data.cash_bank_account_id,
        reference_no: data.reference_no || null,
        status: "POSTED",
        notes: data.notes || null,
      },
      include: { vendor: true },
    });

    // If settling a specific bill
    if (data.bill_id) {
      const bill = await tx.accVendorBill.findUnique({ where: { id: data.bill_id } });
      if (bill) {
        const newPaid = Number(bill.paid_amount) + data.amount;
        const total = Number(bill.total_amount);
        const newStatus = newPaid >= total ? "PAID" : "PARTIAL";

        await tx.accVendorBill.update({
          where: { id: data.bill_id },
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
        current_balance: { decrement: data.amount },
      },
    });

    return payment;
  });
};
