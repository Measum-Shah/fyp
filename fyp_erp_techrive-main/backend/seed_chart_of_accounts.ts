import "dotenv/config";
import { prisma } from "./src/config/db";

async function main() {
  console.log("============================================================");
  console.log("  SEEDING COMPLETE CHART OF ACCOUNTS & FINANCIAL FLOW");
  console.log("============================================================\n");

  // 1. Clean existing accounting transaction data safely
  console.log("Cleaning existing accounting data...");
  await prisma.accJournalLine.deleteMany({});
  await prisma.accJournal.deleteMany({});
  await prisma.accVendorBillLine.deleteMany({});
  await prisma.accVendorBill.deleteMany({});
  await prisma.accVendorPayment.deleteMany({});
  await prisma.accVendor.deleteMany({});
  await prisma.accCustomerInvoiceLine.deleteMany({});
  await prisma.accCustomerInvoice.deleteMany({});
  await prisma.accCustomerPayment.deleteMany({});
  await prisma.accCreditDebitNote.deleteMany({});
  await prisma.accExpense.deleteMany({});
  await prisma.accFixedAsset.deleteMany({});
  await prisma.accBankReconciliation.deleteMany({});
  await prisma.accCashBankAccount.deleteMany({});
  await prisma.accPeriodClosing.deleteMany({});
  await prisma.accAuditTrail.deleteMany({});
  await prisma.accVoucherTemplate.deleteMany({});
  await prisma.accAccount.deleteMany({});
  console.log(" Cleaned existing accounting tables.\n");

  // 2. Seed 5-Level Chart of Accounts Hierarchy
  console.log("Seeding 5-Level Chart of Accounts...");

  // Level 1: Root Types
  const l1Accounts = [
    { code: "1", name: "Assets", type: "ASSET", level: 1, account_category: "GROUP", parent_id: null, normal_balance: "DEBIT" },
    { code: "2", name: "Liabilities", type: "LIABILITY", level: 1, account_category: "GROUP", parent_id: null, normal_balance: "CREDIT" },
    { code: "3", name: "Equity", type: "EQUITY", level: 1, account_category: "GROUP", parent_id: null, normal_balance: "CREDIT" },
    { code: "4", name: "Revenue", type: "REVENUE", level: 1, account_category: "GROUP", parent_id: null, normal_balance: "CREDIT" },
    { code: "5", name: "Expenses", type: "EXPENSE", level: 1, account_category: "GROUP", parent_id: null, normal_balance: "DEBIT" },
  ];

  const map: Record<string, number> = {};
  for (const acc of l1Accounts) {
    const created = await prisma.accAccount.create({ data: acc });
    map[acc.code] = created.id;
  }

  // Level 2: Groups
  const l2Accounts = [
    { code: "101", name: "Current Assets", type: "ASSET", level: 2, account_category: "GROUP", parent_id: map["1"], normal_balance: "DEBIT" },
    { code: "102", name: "Fixed Assets", type: "ASSET", level: 2, account_category: "GROUP", parent_id: map["1"], normal_balance: "DEBIT" },
    { code: "201", name: "Current Liabilities", type: "LIABILITY", level: 2, account_category: "GROUP", parent_id: map["2"], normal_balance: "CREDIT" },
    { code: "202", name: "Long-term Liabilities", type: "LIABILITY", level: 2, account_category: "GROUP", parent_id: map["2"], normal_balance: "CREDIT" },
    { code: "301", name: "Share Capital", type: "EQUITY", level: 2, account_category: "GROUP", parent_id: map["3"], normal_balance: "CREDIT" },
    { code: "302", name: "Retained Earnings", type: "EQUITY", level: 2, account_category: "GROUP", parent_id: map["3"], normal_balance: "CREDIT" },
    { code: "401", name: "Operating Revenue", type: "REVENUE", level: 2, account_category: "GROUP", parent_id: map["4"], normal_balance: "CREDIT" },
    { code: "402", name: "Other Revenue", type: "REVENUE", level: 2, account_category: "GROUP", parent_id: map["4"], normal_balance: "CREDIT" },
    { code: "501", name: "Cost of Goods Sold", type: "EXPENSE", level: 2, account_category: "GROUP", parent_id: map["5"], normal_balance: "DEBIT" },
    { code: "502", name: "Operating Expenses", type: "EXPENSE", level: 2, account_category: "GROUP", parent_id: map["5"], normal_balance: "DEBIT" },
  ];
  for (const acc of l2Accounts) {
    const created = await prisma.accAccount.create({ data: acc });
    map[acc.code] = created.id;
  }

  // Level 3: Sub-groups
  const l3Accounts = [
    { code: "10101", name: "Cash & Cash Equivalents", type: "ASSET", level: 3, account_category: "GROUP", parent_id: map["101"], normal_balance: "DEBIT" },
    { code: "10102", name: "Trade & Student Receivables", type: "ASSET", level: 3, account_category: "GROUP", parent_id: map["101"], normal_balance: "DEBIT" },
    { code: "10103", name: "Inventories & Supplies", type: "ASSET", level: 3, account_category: "GROUP", parent_id: map["101"], normal_balance: "DEBIT" },
    { code: "10201", name: "Property, Plant & Equipment", type: "ASSET", level: 3, account_category: "GROUP", parent_id: map["102"], normal_balance: "DEBIT" },
    { code: "20101", name: "Trade & Vendor Payables", type: "LIABILITY", level: 3, account_category: "GROUP", parent_id: map["201"], normal_balance: "CREDIT" },
    { code: "20102", name: "Tax & Statutory Payables", type: "LIABILITY", level: 3, account_category: "GROUP", parent_id: map["201"], normal_balance: "CREDIT" },
    { code: "30101", name: "Paid-up Share Capital", type: "EQUITY", level: 3, account_category: "GROUP", parent_id: map["301"], normal_balance: "CREDIT" },
    { code: "40101", name: "Academic & Tuition Fees", type: "REVENUE", level: 3, account_category: "GROUP", parent_id: map["401"], normal_balance: "CREDIT" },
    { code: "40102", name: "Training & Educational Services", type: "REVENUE", level: 3, account_category: "GROUP", parent_id: map["401"], normal_balance: "CREDIT" },
    { code: "50101", name: "Academic Direct Delivery Cost", type: "EXPENSE", level: 3, account_category: "GROUP", parent_id: map["501"], normal_balance: "DEBIT" },
    { code: "50201", name: "Staff & Faculty Payroll", type: "EXPENSE", level: 3, account_category: "GROUP", parent_id: map["502"], normal_balance: "DEBIT" },
    { code: "50202", name: "Administrative & Facilities Cost", type: "EXPENSE", level: 3, account_category: "GROUP", parent_id: map["502"], normal_balance: "DEBIT" },
  ];
  for (const acc of l3Accounts) {
    const created = await prisma.accAccount.create({ data: acc });
    map[acc.code] = created.id;
  }

  // Level 4: Detail Groups
  const l4Accounts = [
    { code: "1010101", name: "Cash in Hand", type: "ASSET", level: 4, account_category: "GROUP", parent_id: map["10101"], normal_balance: "DEBIT" },
    { code: "1010102", name: "Commercial Bank Accounts", type: "ASSET", level: 4, account_category: "GROUP", parent_id: map["10101"], normal_balance: "DEBIT" },
    { code: "1010201", name: "Accounts Receivable - Students", type: "ASSET", level: 4, account_category: "GROUP", parent_id: map["10102"], normal_balance: "DEBIT" },
    { code: "1010301", name: "Stationery & Course Materials", type: "ASSET", level: 4, account_category: "GROUP", parent_id: map["10103"], normal_balance: "DEBIT" },
    { code: "1020101", name: "Computer & IT Equipment", type: "ASSET", level: 4, account_category: "GROUP", parent_id: map["10201"], normal_balance: "DEBIT" },
    { code: "1020102", name: "Campus Furniture & Fixtures", type: "ASSET", level: 4, account_category: "GROUP", parent_id: map["10201"], normal_balance: "DEBIT" },
    { code: "2010101", name: "Accounts Payable - Suppliers", type: "LIABILITY", level: 4, account_category: "GROUP", parent_id: map["20101"], normal_balance: "CREDIT" },
    { code: "2010201", name: "Withholding Tax Payable", type: "LIABILITY", level: 4, account_category: "GROUP", parent_id: map["20102"], normal_balance: "CREDIT" },
    { code: "3010101", name: "Initial Founders Equity", type: "EQUITY", level: 4, account_category: "GROUP", parent_id: map["30101"], normal_balance: "CREDIT" },
    { code: "4010101", name: "Degree & Tuition Revenue", type: "REVENUE", level: 4, account_category: "GROUP", parent_id: map["40101"], normal_balance: "CREDIT" },
    { code: "4010201", name: "Certifications & Workshops", type: "REVENUE", level: 4, account_category: "GROUP", parent_id: map["40102"], normal_balance: "CREDIT" },
    { code: "5010101", name: "Lab & Exam Consumables", type: "EXPENSE", level: 4, account_category: "GROUP", parent_id: map["50101"], normal_balance: "DEBIT" },
    { code: "5020101", name: "Faculty Salaries & Allowances", type: "EXPENSE", level: 4, account_category: "GROUP", parent_id: map["50201"], normal_balance: "DEBIT" },
    { code: "5020201", name: "Utilities & Campus Rent", type: "EXPENSE", level: 4, account_category: "GROUP", parent_id: map["50202"], normal_balance: "DEBIT" },
  ];
  for (const acc of l4Accounts) {
    const created = await prisma.accAccount.create({ data: acc });
    map[acc.code] = created.id;
  }

  // Level 5: Detailed Ledgers
  const l5Accounts = [
    { code: "101010101", name: "Petty Cash - Main Office", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: map["1010101"], normal_balance: "DEBIT", opening_balance: 50000, current_balance: 50000 },
    { code: "101010102", name: "Cash in Transit", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: map["1010101"], normal_balance: "DEBIT", opening_balance: 0, current_balance: 0 },
    { code: "101010201", name: "Meezan Bank - Main Operations", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: map["1010102"], normal_balance: "DEBIT", opening_balance: 2500000, current_balance: 2500000 },
    { code: "101010202", name: "Habib Bank Ltd - Fee Collection", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: map["1010102"], normal_balance: "DEBIT", opening_balance: 1800000, current_balance: 1800000 },
    { code: "101010203", name: "Bank Alfalah - Payroll Account", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: map["1010102"], normal_balance: "DEBIT", opening_balance: 1200000, current_balance: 1200000 },
    { code: "101020101", name: "Student Tuition Fee Receivable", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: map["1010201"], normal_balance: "DEBIT", opening_balance: 650000, current_balance: 650000 },
    { code: "101030101", name: "Office & Lab Stationery Store", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: map["1010301"], normal_balance: "DEBIT", opening_balance: 150000, current_balance: 150000 },
    { code: "102010101", name: "Lab Computers & Servers", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: map["1020101"], normal_balance: "DEBIT", opening_balance: 1500000, current_balance: 1500000 },
    { code: "102010201", name: "Office Desks & Chairs", type: "ASSET", level: 5, account_category: "LEDGER", parent_id: map["1020102"], normal_balance: "DEBIT", opening_balance: 800000, current_balance: 800000 },
    { code: "201010101", name: "Accounts Payable - Vendors", type: "LIABILITY", level: 5, account_category: "LEDGER", parent_id: map["2010101"], normal_balance: "CREDIT", opening_balance: 350000, current_balance: 350000 },
    { code: "201020101", name: "FBR Withholding Tax Payable", type: "LIABILITY", level: 5, account_category: "LEDGER", parent_id: map["2010201"], normal_balance: "CREDIT", opening_balance: 95000, current_balance: 95000 },
    { code: "301010101", name: "Authorized Share Capital", type: "EQUITY", level: 5, account_category: "LEDGER", parent_id: map["3010101"], normal_balance: "CREDIT", opening_balance: 8205000, current_balance: 8205000 },
    { code: "401010101", name: "Undergraduate Tuition Fee Revenue", type: "REVENUE", level: 5, account_category: "LEDGER", parent_id: map["4010101"], normal_balance: "CREDIT", opening_balance: 0, current_balance: 0 },
    { code: "401010102", name: "Postgraduate Tuition Fee Revenue", type: "REVENUE", level: 5, account_category: "LEDGER", parent_id: map["4010101"], normal_balance: "CREDIT", opening_balance: 0, current_balance: 0 },
    { code: "401020101", name: "Professional Training & Certifications", type: "REVENUE", level: 5, account_category: "LEDGER", parent_id: map["4010201"], normal_balance: "CREDIT", opening_balance: 0, current_balance: 0 },
    { code: "501010101", name: "Lab Experiments & Printing Material", type: "EXPENSE", level: 5, account_category: "LEDGER", parent_id: map["5010101"], normal_balance: "DEBIT", opening_balance: 0, current_balance: 0 },
    { code: "502010101", name: "Faculty Basic Salaries", type: "EXPENSE", level: 5, account_category: "LEDGER", parent_id: map["5020101"], normal_balance: "DEBIT", opening_balance: 0, current_balance: 0 },
    { code: "502010102", name: "Staff Medical & House Rent Allowance", type: "EXPENSE", level: 5, account_category: "LEDGER", parent_id: map["5020101"], normal_balance: "DEBIT", opening_balance: 0, current_balance: 0 },
    { code: "502020101", name: "Campus Building Rent", type: "EXPENSE", level: 5, account_category: "LEDGER", parent_id: map["5020201"], normal_balance: "DEBIT", opening_balance: 0, current_balance: 0 },
    { code: "502020102", name: "Electricity & Generator Fuel", type: "EXPENSE", level: 5, account_category: "LEDGER", parent_id: map["5020201"], normal_balance: "DEBIT", opening_balance: 0, current_balance: 0 },
    { code: "502020103", name: "Internet & Telecommunication", type: "EXPENSE", level: 5, account_category: "LEDGER", parent_id: map["5020201"], normal_balance: "DEBIT", opening_balance: 0, current_balance: 0 },
  ];
  for (const acc of l5Accounts) {
    const created = await prisma.accAccount.create({ data: acc });
    map[acc.code] = created.id;
  }

  // Integration Short-Code Ledgers (Used by payroll, fee, and loan posting hooks)
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
    const created = await prisma.accAccount.create({ data: acc });
    map[acc.code] = created.id;
  }
  console.log(` Created 5-level Chart of Accounts (${Object.keys(map).length} accounts).\n`);

  // 3. Cash & Bank Accounts
  console.log("Seeding Cash & Bank Accounts...");
  const cb1 = await prisma.accCashBankAccount.create({
    data: {
      name: "Main Cash Float",
      account_type: "CASH",
      currency: "PKR",
      current_balance: 50000,
      gl_account_id: map["101010101"],
    },
  });
  const cb2 = await prisma.accCashBankAccount.create({
    data: {
      name: "Meezan Bank Operating Account",
      account_type: "BANK",
      account_number: "01020304050607",
      bank_name: "Meezan Bank Ltd",
      iban: "PK36MEZN0001020304050607",
      currency: "PKR",
      current_balance: 2500000,
      gl_account_id: map["101010201"],
    },
  });
  const cb3 = await prisma.accCashBankAccount.create({
    data: {
      name: "HBL Fee Collection Account",
      account_type: "BANK",
      account_number: "99887766554433",
      bank_name: "Habib Bank Limited",
      iban: "PK36HABB0099887766554433",
      currency: "PKR",
      current_balance: 1800000,
      gl_account_id: map["101010202"],
    },
  });
  const cb4 = await prisma.accCashBankAccount.create({
    data: {
      name: "Bank Alfalah Payroll Account",
      account_type: "BANK",
      account_number: "55443322110099",
      bank_name: "Bank Alfalah",
      iban: "PK36ALFH0055443322110099",
      currency: "PKR",
      current_balance: 1200000,
      gl_account_id: map["101010203"],
    },
  });
  console.log(" Created 4 Cash & Bank accounts.\n");

  // 4. Vendors & Accounts Payable
  console.log("Seeding Vendors & Vendor Bills...");
  const v1 = await prisma.accVendor.create({
    data: {
      vendor_code: "VEND-0001",
      name: "Apex Stationery & Lab Supplies",
      email: "billing@apexsupplies.pk",
      phone: "051-2223344",
      address: "Blue Area, Islamabad",
      tax_number: "NTN-3344551-2",
      payment_terms: "Net 30",
      credit_limit: 500000,
    },
  });

  const v2 = await prisma.accVendor.create({
    data: {
      vendor_code: "VEND-0002",
      name: "Islamabad Electric Supply Co (IESCO)",
      email: "commercial@iesco.com.pk",
      phone: "051-9252937",
      address: "Sector G-7, Islamabad",
      tax_number: "NTN-0786111-9",
      payment_terms: "Due on Receipt",
      credit_limit: 1000000,
    },
  });

  const v3 = await prisma.accVendor.create({
    data: {
      vendor_code: "VEND-0003",
      name: "Nayatel Fiber Broadband Ltd",
      email: "corporate@nayatel.com",
      phone: "051-111-11-44-44",
      address: "GD Arcade, F-7 Markaz, Islamabad",
      tax_number: "NTN-2198765-4",
      payment_terms: "Net 15",
      credit_limit: 300000,
    },
  });

  // Vendor Bill 1 (Stationery)
  const bill1 = await prisma.accVendorBill.create({
    data: {
      bill_number: "BILL-2026-0001",
      supplier_bill_no: "INV-APX-8821",
      vendor_id: v1.id,
      bill_date: new Date("2026-01-10"),
      due_date: new Date("2026-02-10"),
      subtotal: 75000,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 75000,
      paid_amount: 75000,
      status: "PAID",
      notes: "Mid-term exam answer books and stationery",
      lines: {
        create: [
          {
            item_description: "Examination Answer Booklets (5000 units)",
            account_id: map["501010101"],
            quantity: 5000,
            unit_price: 15,
            total_price: 75000,
          },
        ],
      },
    },
  });

  // Vendor Payment 1
  await prisma.accVendorPayment.create({
    data: {
      payment_number: "VP-2026-0001",
      vendor_id: v1.id,
      payment_date: new Date("2026-01-20"),
      amount: 75000,
      payment_mode: "BANK",
      cash_bank_account_id: cb2.id,
      reference_no: "CHQ-899120",
      notes: "Settled Bill BILL-2026-0001 via Meezan Bank",
    },
  });

  // Vendor Bill 2 (Electricity - Pending)
  await prisma.accVendorBill.create({
    data: {
      bill_number: "BILL-2026-0002",
      supplier_bill_no: "IESCO-JAN-2026",
      vendor_id: v2.id,
      bill_date: new Date("2026-01-28"),
      due_date: new Date("2026-02-15"),
      subtotal: 185000,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 185000,
      paid_amount: 0,
      status: "PENDING",
      notes: "Campus electricity tariff bill for January 2026",
      lines: {
        create: [
          {
            item_description: "Commercial Electricity Consumption (6500 units)",
            account_id: map["502020102"],
            quantity: 1,
            unit_price: 185000,
            total_price: 185000,
          },
        ],
      },
    },
  });
  console.log(" Created 3 Vendors, 2 Bills, 1 Payment.\n");

  // 5. Customers & Accounts Receivable
  console.log("Seeding Customer Invoices & Receipts...");
  const inv1 = await prisma.accCustomerInvoice.create({
    data: {
      invoice_number: "INV-2026-0001",
      customer_name: "Techrive Corporate Training Cohort",
      customer_email: "training@techrive.pk",
      customer_phone: "0300-8889900",
      customer_address: "Software Technology Park, Islamabad",
      invoice_date: new Date("2026-01-05"),
      due_date: new Date("2026-01-25"),
      subtotal: 350000,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 350000,
      paid_amount: 350000,
      status: "PAID",
      notes: "Full-stack Enterprise Cloud Bootcamp (Batch 1)",
      lines: {
        create: [
          {
            item_description: "Executive Corporate Workshop (25 Participants)",
            account_id: map["401020101"],
            quantity: 25,
            unit_price: 14000,
            total_price: 350000,
          },
        ],
      },
    },
  });

  await prisma.accCustomerPayment.create({
    data: {
      receipt_number: "CR-2026-0001",
      customer_name: "Techrive Corporate Training Cohort",
      payment_date: new Date("2026-01-15"),
      amount: 350000,
      payment_mode: "BANK",
      cash_bank_account_id: cb3.id,
      reference_no: "FT-HBL-9912",
      notes: "Payment received in HBL Fee Collection Account",
    },
  });

  const inv2 = await prisma.accCustomerInvoice.create({
    data: {
      invoice_number: "INV-2026-0002",
      customer_name: "Undergraduate Batch 2026 Tuition Installment",
      customer_email: "admissions@techrive.edu.pk",
      customer_phone: "051-111-222-333",
      customer_address: "Islamabad Campus",
      invoice_date: new Date("2026-01-15"),
      due_date: new Date("2026-02-15"),
      subtotal: 650000,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: 650000,
      paid_amount: 250000,
      status: "PARTIAL",
      notes: "Spring 2026 Semester Tuition Billing",
      lines: {
        create: [
          {
            item_description: "BS Computer Science Semester Tuition Fee",
            account_id: map["401010101"],
            quantity: 10,
            unit_price: 65000,
            total_price: 650000,
          },
        ],
      },
    },
  });

  await prisma.accCustomerPayment.create({
    data: {
      receipt_number: "CR-2026-0002",
      customer_name: "Undergraduate Batch 2026 Tuition Installment",
      payment_date: new Date("2026-01-25"),
      amount: 250000,
      payment_mode: "BANK",
      cash_bank_account_id: cb3.id,
      reference_no: "FT-HBL-9988",
      notes: "Partial tuition installment received",
    },
  });
  console.log(" Created 2 Invoices, 2 Customer Receipts.\n");

  // 6. Double-Entry Vouchers (Balanced Debits = Credits)
  console.log("Posting Double-Entry Vouchers...");

  // Voucher 1: Capital Contribution (GJV)
  const v1Header = await prisma.accJournal.create({
    data: {
      journal_number: "GJV-2026-0001",
      voucher_type: "GJV",
      date: new Date("2026-01-01"),
      reference: "BOARD-RES-2026-01",
      description: "Initial paid-up capital allocation across banking facilities",
      narration: "Being capital contribution deposited into Meezan Bank & HBL",
      journal_type: "GENERAL",
      total_debit: 5500000,
      total_credit: 5500000,
      status: "POSTED",
      source_module: "VOUCHER",
      lines: {
        create: [
          { account_id: map["101010201"], debit: 3500000, credit: 0, description: "Capital deposit in Meezan Bank" },
          { account_id: map["101010202"], debit: 2000000, credit: 0, description: "Capital deposit in HBL" },
          { account_id: map["301010101"], debit: 0, credit: 5500000, description: "Authorized Share Capital" },
        ],
      },
    },
  });

  // Voucher 2: Cash Withdrawal for Petty Cash Float (CPV)
  const v2Header = await prisma.accJournal.create({
    data: {
      journal_number: "CPV-2026-0001",
      voucher_type: "CPV",
      date: new Date("2026-01-02"),
      reference: "CHQ-00129",
      description: "Established petty cash imprest float for daily campus operations",
      narration: "Cash drawn from Meezan Bank for Petty Cash float",
      journal_type: "CASH_PAYMENT",
      total_debit: 50000,
      total_credit: 50000,
      status: "POSTED",
      source_module: "VOUCHER",
      lines: {
        create: [
          { account_id: map["101010101"], debit: 50000, credit: 0, description: "Petty Cash box funding" },
          { account_id: map["101010201"], debit: 0, credit: 50000, description: "Withdrawal from Meezan Bank" },
        ],
      },
    },
  });

  // Voucher 3: Campus Building Rent Payment (BPV)
  const v3Header = await prisma.accJournal.create({
    data: {
      journal_number: "BPV-2026-0001",
      voucher_type: "BPV",
      date: new Date("2026-01-05"),
      reference: "RENT-AGR-F8",
      description: "January 2026 campus building lease installment",
      narration: "Paid via bank transfer from Meezan Bank account",
      journal_type: "BANK_PAYMENT",
      total_debit: 250000,
      total_credit: 250000,
      status: "POSTED",
      source_module: "VOUCHER",
      lines: {
        create: [
          { account_id: map["502020101"], debit: 250000, credit: 0, description: "January 2026 Campus Rent" },
          { account_id: map["101010201"], debit: 0, credit: 250000, description: "Paid from Meezan Bank" },
        ],
      },
    },
  });

  // Voucher 4: Tuition Fee Collection Realization (BRV)
  const v4Header = await prisma.accJournal.create({
    data: {
      journal_number: "BRV-2026-0001",
      voucher_type: "BRV",
      date: new Date("2026-01-18"),
      reference: "HBL-COL-BATCH-01",
      description: "Direct student fee deposit batch received in HBL account",
      narration: "Tuition collection for Spring 2026 semester",
      journal_type: "BANK_RECEIPT",
      total_debit: 650000,
      total_credit: 650000,
      status: "POSTED",
      source_module: "VOUCHER",
      lines: {
        create: [
          { account_id: map["101010202"], debit: 650000, credit: 0, description: "Deposited in HBL Fee Account" },
          { account_id: map["401010101"], debit: 0, credit: 650000, description: "Undergraduate Tuition Revenue" },
        ],
      },
    },
  });

  // Voucher 5: Monthly Faculty & Staff Payroll (GJV)
  const v5Header = await prisma.accJournal.create({
    data: {
      journal_number: "GJV-2026-0002",
      voucher_type: "GJV",
      date: new Date("2026-01-31"),
      reference: "PAYROLL-JAN-2026",
      description: "Monthly salary disbursement with FBR tax deductions",
      narration: "Salaries transferred via Bank Alfalah Payroll Account",
      journal_type: "GENERAL",
      total_debit: 480000,
      total_credit: 480000,
      status: "POSTED",
      source_module: "VOUCHER",
      lines: {
        create: [
          { account_id: map["502010101"], debit: 380000, credit: 0, description: "Basic faculty salaries" },
          { account_id: map["502010102"], debit: 100000, credit: 0, description: "Staff medical and house rent allowances" },
          { account_id: map["201020101"], debit: 0, credit: 38000, description: "Salary tax withholding payable to FBR" },
          { account_id: map["101010203"], debit: 0, credit: 442000, description: "Net salaries disbursed via Bank Alfalah" },
        ],
      },
    },
  });

  // Voucher 6: Internet & Telecommunications Bill (BPV)
  const v6Header = await prisma.accJournal.create({
    data: {
      journal_number: "BPV-2026-0002",
      voucher_type: "BPV",
      date: new Date("2026-01-22"),
      reference: "NYT-098112",
      description: "Dedicated campus 100Mbps dedicated fiber internet bill",
      narration: "Paid online from Meezan Bank",
      journal_type: "BANK_PAYMENT",
      total_debit: 45000,
      total_credit: 45000,
      status: "POSTED",
      source_module: "VOUCHER",
      lines: {
        create: [
          { account_id: map["502020103"], debit: 45000, credit: 0, description: "Nayatel Fiber Broadband charge" },
          { account_id: map["101010201"], debit: 0, credit: 45000, description: "Paid from Meezan Bank" },
        ],
      },
    },
  });
  console.log(" Posted 6 balanced double-entry vouchers (Total Dr/Cr: PKR 6,975,000).\n");

  // Update current balances on accounts based on posted lines
  console.log("Recalculating account running balances...");
  const accounts = await prisma.accAccount.findMany();
  for (const acc of accounts) {
    const lines = await prisma.accJournalLine.findMany({
      where: {
        account_id: acc.id,
        journal: { status: "POSTED" },
      },
    });
    let totalDr = 0;
    let totalCr = 0;
    for (const l of lines) {
      totalDr += Number(l.debit);
      totalCr += Number(l.credit);
    }
    const ob = Number(acc.opening_balance || 0);
    let newBal = 0;
    if (acc.normal_balance === "DEBIT") {
      newBal = ob + totalDr - totalCr;
    } else {
      newBal = ob + totalCr - totalDr;
    }
    await prisma.accAccount.update({
      where: { id: acc.id },
      data: { current_balance: newBal },
    });
  }
  console.log(" Running balances updated on all chart of accounts.\n");

  // 7. Fixed Assets
  console.log("Seeding Fixed Assets...");
  await prisma.accFixedAsset.create({
    data: {
      asset_code: "FA-IT-001",
      name: "High-Performance Computer Lab (30 Core i7 Workstations)",
      category: "IT Equipment",
      purchase_date: new Date("2025-08-01"),
      purchase_cost: 1500000,
      useful_life_years: 5,
      depreciation_method: "STRAIGHT_LINE",
      accumulated_depreciation: 150000,
      net_book_value: 1350000,
      status: "ACTIVE",
    },
  });

  await prisma.accFixedAsset.create({
    data: {
      asset_code: "FA-FUR-001",
      name: "Auditorium & Classrooms Ergonomic Furniture",
      category: "Furniture & Fixtures",
      purchase_date: new Date("2025-07-15"),
      purchase_cost: 800000,
      useful_life_years: 10,
      depreciation_method: "STRAIGHT_LINE",
      accumulated_depreciation: 40000,
      net_book_value: 760000,
      status: "ACTIVE",
    },
  });
  console.log(" Created 2 Fixed Assets with depreciation schedules.\n");

  // 8. Direct Expenses
  console.log("Seeding Operational Expenses...");
  await prisma.accExpense.create({
    data: {
      expense_number: "EXP-2026-0001",
      category: "Utilities & Fuel",
      account_id: map["502020102"],
      amount: 28000,
      date: new Date("2026-01-12"),
      payee: "Shell Gas & Petroleum Station",
      payment_mode: "CASH",
      cash_bank_account_id: cb1.id,
      description: "Diesel fuel purchase for backup generator during load-shedding",
      status: "APPROVED",
    },
  });

  await prisma.accExpense.create({
    data: {
      expense_number: "EXP-2026-0002",
      category: "Administrative Refreshments",
      account_id: map["501010101"],
      amount: 14500,
      date: new Date("2026-01-24"),
      payee: "Metro Cash & Carry",
      payment_mode: "CASH",
      cash_bank_account_id: cb1.id,
      description: "Faculty room tea, coffee, and guest refreshments",
      status: "APPROVED",
    },
  });
  console.log(" Created 2 direct expenses.\n");

  // 9. Voucher Templates (Re-usable standard journal patterns)
  console.log("Seeding Voucher Templates...");
  await prisma.accVoucherTemplate.create({
    data: {
      name: "Monthly Campus Building Rent",
      voucher_type: "BPV",
      narration: "Campus lease installment paid to landlord via bank transfer",
      created_by: "System Administrator",
      lines: [
        { account_id: map["502020101"], debit: 250000, credit: 0, description: "Monthly rent expense" },
        { account_id: map["101010201"], debit: 0, credit: 250000, description: "Paid from operating bank" },
      ],
    },
  });

  await prisma.accVoucherTemplate.create({
    data: {
      name: "Standard Monthly Payroll Disbursement",
      voucher_type: "GJV",
      narration: "Faculty and staff net salary disbursement after tax withholdings",
      created_by: "System Administrator",
      lines: [
        { account_id: map["502010101"], debit: 380000, credit: 0, description: "Basic faculty salaries" },
        { account_id: map["502010102"], debit: 100000, credit: 0, description: "Allowances" },
        { account_id: map["201020101"], debit: 0, credit: 38000, description: "Tax deduction" },
        { account_id: map["101010203"], debit: 0, credit: 442000, description: "Bank Alfalah disbursement" },
      ],
    },
  });
  console.log(" Created 2 voucher templates.\n");

  // 10. Financial Period Closing Status
  console.log("Seeding Financial Period Closings...");
  await prisma.accPeriodClosing.create({
    data: {
      fiscal_year: 2025,
      period_month: 12,
      period_name: "December 2025",
      status: "CLOSED",
      closed_by: 1,
      closed_at: new Date("2026-01-05"),
    },
  });
  await prisma.accPeriodClosing.create({
    data: {
      fiscal_year: 2026,
      period_month: 1,
      period_name: "January 2026",
      status: "OPEN",
    },
  });
  console.log(" Initialized financial period closings.\n");

  // 11. Audit Trail Logs
  console.log("Seeding Audit Trail...");
  await prisma.accAuditTrail.create({
    data: {
      user_name: "System Administrator",
      action: "INIT_COA",
      entity_type: "AccAccount",
      entity_id: "ALL",
      details: "5-Level Chart of Accounts hierarchy initialized with opening balances",
    },
  });
  await prisma.accAuditTrail.create({
    data: {
      user_name: "System Administrator",
      action: "POST_VOUCHERS",
      entity_type: "AccJournal",
      entity_id: "BATCH-01",
      details: "Posted double-entry vouchers GJV-2026-0001 through GJV-2026-0002",
    },
  });
  console.log(" Audit trail entries recorded.\n");

  console.log("============================================================");
  console.log("  CHART OF ACCOUNTS & FINANCIAL FLOW SEED COMPLETED!");
  console.log("============================================================");
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
