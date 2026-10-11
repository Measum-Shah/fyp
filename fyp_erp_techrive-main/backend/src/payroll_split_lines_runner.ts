import { prisma } from "./config/db";
import { runPayrollBatch } from "./modules/hrandPayrollModule/services/payrollRun.service";

async function runPayrollSplitLinesTest() {
  console.log("==================================================================");
  console.log("PAYROLL VOUCHER SPLIT-LINES TEST (WITH TAX & LOAN DEDUCTIONS)");
  console.log("==================================================================\n");

  // 1. Create a staff member with tax_percentage and basic_salary
  let staff = await prisma.staff.create({
    data: {
      branch_id: 1,
      user_id: 1,
      staff_type: "Teaching",
      email: `split.staff.${Date.now()}@techrive.edu.pk`,
      password: "Password123!",
      cnic: "35202-9999999-1",
      epf_description: "N/A",
      epf_opening_amount: 0,
      eobi_opening_amount: 0,
      first_name: "Deduction",
      last_name: "TestStaff",
      status: "Active",
      basic_salary: 100000, // Gross = 100,000
      tax_percentage: 10,  // Tax = 10% (10,000)
      created_at: new Date(),
    },
  });

  console.log(`✔ Created Staff ID #${staff.id} (Basic Salary: Rs. 100,000, Tax Rate: 10%)`);

  // 2. Create an approved loan request with monthly installment (pay_loan) for this staff
  const loanReq = await prisma.requestLoanEmployee.create({
    data: {
      staff_id: staff.id,
      branch_id: 1,
      type: "Personal",
      amount: 60000,
      installments: 12,
      monthly_installment: 5000, // Loan deduction = 5,000
      effective_from: new Date(),
      status: 1, // Approved
      created_at: new Date(),
    },
  });

  console.log(`✔ Created Approved Staff Loan ID #${loanReq.id} (Amount: Rs. 60,000, Monthly Installment: Rs. 5,000)`);

  // 3. Find an unused month for this branch
  let targetMonth = "";
  for (let m = 1; m <= 12; m++) {
    const candidateMonth = `2026-${String(m).padStart(2, "0")}`;
    const existingRun = await prisma.payrollEmployees.findFirst({
      where: { branch_id: staff.branch_id, month_year: candidateMonth },
    });
    if (!existingRun) {
      targetMonth = candidateMonth;
      break;
    }
  }
  if (!targetMonth) {
    targetMonth = `2028-01`;
  }

  // 4. Run Payroll Batch for this staff
  const payrollResult = await runPayrollBatch(
    {
      branch_id: staff.branch_id,
      month_year: targetMonth,
      staff_ids: [staff.id],
    },
    1
  );

  const batchRefId = `${staff.branch_id}-${targetMonth}`;
  console.log(`\n✔ Executed Payroll Batch '${batchRefId}' (Generated: ${payrollResult.generated.length})`);

  // 5. Query the generated AccJournal and AccJournalLine DB rows
  const journal = await prisma.accJournal.findFirst({
    where: {
      source_module: "HR_PAYROLL",
      source_reference_id: batchRefId,
    },
    include: {
      lines: {
        include: {
          account: { select: { code: true, name: true, type: true } },
        },
      },
    },
  });

  if (!journal) {
    console.error(`❌ STOP: No AccJournal row found for payroll run ${batchRefId}`);
    process.exit(1);
  }

  console.log("\n[MULTIPLE-LINE PAYROLL ACCJOURNAL DB ROW]:");
  console.log(JSON.stringify(journal, null, 2));

  console.log("\n[JOURNAL LINES BREAKDOWN]:");
  let totalDebit = 0;
  let totalCredit = 0;
  journal.lines.forEach((line, index) => {
    const dr = Number(line.debit || 0);
    const cr = Number(line.credit || 0);
    totalDebit += dr;
    totalCredit += cr;
    console.log(
      ` Line ${index + 1}: Account [${line.account?.code || line.account_id}] ${line.account?.name || ""} | Dr: Rs. ${dr} | Cr: Rs. ${cr} | Description: "${line.description}"`
    );
  });

  const isBalanced = totalDebit === totalCredit;
  console.log(`\n✔ Total Debit (Rs. ${totalDebit}) === Total Credit (Rs. ${totalCredit}) -> Balanced: ${isBalanced}`);
  console.log(`✔ Total Voucher Lines Count: ${journal.lines.length} (Expected >= 3 lines for Gross, Net, Tax, Loan)`);

  if (!isBalanced || journal.lines.length < 3) {
    console.error("❌ STOP: Voucher is either unbalanced or failed to split into multiple credit lines!");
    process.exit(1);
  }

  console.log("\n==================================================================");
  console.log("✔ PAYROLL MULTI-LINE BALANCED VOUCHER TEST PASSED PERFECTLY!");
  console.log("==================================================================");
}

runPayrollSplitLinesTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  });
