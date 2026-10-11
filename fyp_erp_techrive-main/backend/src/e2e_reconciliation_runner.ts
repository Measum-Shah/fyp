import { prisma } from "./config/db";
import { getReconciliationReport } from "./modules/accountsModule/services/reports.service";
import { processPayment } from "./modules/feeManagementModule/services/paymentProcessing.service";
import { runPayrollBatch } from "./modules/hrandPayrollModule/services/payrollRun.service";
import { FineService } from "./modules/AcademicModule/services/fine.service";

async function runE2EReconciliationTest() {
  console.log("==================================================================");
  console.log("LIVE END-TO-END RECONCILIATION TEST (REAL DATA & LIVE TRANSACTIONS)");
  console.log("==================================================================\n");

  const getReconciliationJSON = async () => {
    const report = await getReconciliationReport();
    return JSON.parse(JSON.stringify(report));
  };

  // ------------------------------------------------------------------
  // FLOW 1: Fee Payment
  // ------------------------------------------------------------------
  console.log("------------------------------------------------------------------");
  console.log("FLOW 1: Fee Payment Transaction");
  console.log("------------------------------------------------------------------");

  const beforeFee = await getReconciliationJSON();
  console.log("[BEFORE Fee Payment Reconciliation JSON]:");
  console.log(JSON.stringify(beforeFee, null, 2));

  // Ensure fee head and student exist
  let feeHead = await prisma.feeHeads.findFirst();
  if (!feeHead) {
    feeHead = await prisma.feeHeads.create({
      data: { title: "Tuition Fee", code: `TF-${Date.now()}` },
    });
  }

  let student = await prisma.students.findFirst();
  if (!student) {
    student = await prisma.students.create({
      data: {
        first_name: "E2E",
        last_name: "Student",
        branch_id: 1,
        created_at: new Date(),
      },
    });
  }

  // Create fresh unpaid fee statement & line for test run
  const basic = await prisma.feeMasterBasics.create({
    data: {
      student_id: student.id,
      branch_id: student.branch_id || 1,
      fee_structure_code: 101,
      bill_no: `E2E-BILL-${Date.now()}`,
      fee_due_date_end: new Date(),
      class_id: 1,
      intake_id: 1,
      board_id: 1,
      created_by: 1,
    },
  });

  await prisma.feeMasters.create({
    data: {
      fee_master_basic_id_fk: basic.id,
      students_id: student.id,
      fee_head: (feeHead as any)?.title || "Tuition Fee",
      fee_structure_code: 101,
      branch_id: basic.branch_id || 1,
      program_id: 1,
      class_id: 1,
      created_by: 1,
      fee_amount: 10000,
      fee_paid_amount: 0,
    },
  });

  const feePaymentAmount = 2500;
  const feeResult = await processPayment(
    {
      student_id: student.id,
      fee_master_basic_id: basic.id,
      amount: feePaymentAmount,
      payment_mode: "Cash",
      paid_date: new Date().toISOString().slice(0, 10),
      note: "Live E2E Reconciliation Test Fee Payment",
    },
    1
  );

  const feeCollectionId = feeResult.payment.collection_id;
  console.log(`\n✔ Created Fee Collection Record ID: ${feeCollectionId} (Paid: Rs. ${feePaymentAmount})`);

  const afterFee = await getReconciliationJSON();
  console.log("\n[AFTER Fee Payment Reconciliation JSON]:");
  console.log(JSON.stringify(afterFee, null, 2));

  console.log("\n[DIFF - Fee Management Deltas]:");
  const feeDeltas = {
    sourceModuleTotalDelta: afterFee.feeManagement.sourceModuleTotal - beforeFee.feeManagement.sourceModuleTotal,
    glPostedTotalDelta: afterFee.feeManagement.glPostedTotal - beforeFee.feeManagement.glPostedTotal,
    totalSourceCountDelta: afterFee.feeManagement.totalSourceCount - beforeFee.feeManagement.totalSourceCount,
    glPostedCountDelta: afterFee.feeManagement.glPostedCount - beforeFee.feeManagement.glPostedCount,
    unpostedCountDelta: afterFee.feeManagement.unpostedCount - beforeFee.feeManagement.unpostedCount,
  };
  console.log(JSON.stringify(feeDeltas, null, 2));

  // Query Voucher (AccJournal) table directly for FEE
  const feeJournal = await prisma.accJournal.findFirst({
    where: {
      source_module: "FEE",
      source_reference_id: String(feeCollectionId),
    },
    include: { lines: true },
  });

  if (!feeJournal) {
    console.error(`❌ STOP: Hook not firing for FEE! No AccJournal row found for source_reference_id = ${feeCollectionId}`);
    process.exit(1);
  }

  console.log("\n[QUERY AccJournal Row for FEE]:");
  console.log(JSON.stringify(feeJournal, null, 2));
  const feeDrCrEqual = Number(feeJournal.total_debit) === Number(feeJournal.total_credit);
  console.log(`✔ Dr = Cr Verification: Total Debit (${feeJournal.total_debit}) === Total Credit (${feeJournal.total_credit}) -> ${feeDrCrEqual}`);
  if (!feeDrCrEqual) {
    console.error("❌ STOP: Fee journal debit does not equal credit!");
    process.exit(1);
  }

  // ------------------------------------------------------------------
  // FLOW 2: Payroll Run
  // ------------------------------------------------------------------
  console.log("\n------------------------------------------------------------------");
  console.log("FLOW 2: Payroll Run Execution");
  console.log("------------------------------------------------------------------");

  const beforePayroll = await getReconciliationJSON();
  console.log("[BEFORE Payroll Run Reconciliation JSON]:");
  console.log(JSON.stringify(beforePayroll, null, 2));

  // Ensure active staff exists with all required fields
  let staff = await prisma.staff.findFirst({ where: { deleted_at: null } });
  if (!staff) {
    staff = await prisma.staff.create({
      data: {
        branch_id: 1,
        user_id: 1,
        staff_type: "Teaching",
        email: `e2e.staff.${Date.now()}@techrive.edu.pk`,
        password: "Password123!",
        cnic: "35202-1234567-1",
        epf_description: "N/A",
        epf_opening_amount: 0,
        eobi_opening_amount: 0,
        first_name: "E2E",
        last_name: "TestStaff",
        status: "Active",
        basic_salary: 50000,
        created_at: new Date(),
      },
    });
  }

  // Find an unused month for this branch
  let targetMonth = "";
  for (let m = 1; m <= 12; m++) {
    const candidateMonth = `2026-${String(m).padStart(2, "0")}`;
    const existingRun = await prisma.payrollEmployees.findFirst({
      where: { branch_id: staff.branch_id || 1, month_year: candidateMonth },
    });
    if (!existingRun) {
      targetMonth = candidateMonth;
      break;
    }
  }

  if (!targetMonth) {
    const randomMonth = Math.floor(Math.random() * 12) + 1;
    targetMonth = `2027-${String(randomMonth).padStart(2, "0")}`;
  }

  const payrollBatchResult = await runPayrollBatch(
    {
      branch_id: staff.branch_id || 1,
      month_year: targetMonth,
      staff_ids: [staff.id],
    },
    1
  );

  const batchRefId = `${staff.branch_id || 1}-${targetMonth}`;
  console.log(`\n✔ Executed Payroll Batch '${batchRefId}' (Generated: ${payrollBatchResult.generated.length}, Skipped: ${payrollBatchResult.skipped.length})`);

  if (payrollBatchResult.generated.length === 0) {
    console.error(`❌ STOP: Payroll batch generated 0 sheets! All skipped.`);
    process.exit(1);
  }

  const afterPayroll = await getReconciliationJSON();
  console.log("\n[AFTER Payroll Run Reconciliation JSON]:");
  console.log(JSON.stringify(afterPayroll, null, 2));

  console.log("\n[DIFF - HR & Payroll Deltas]:");
  const payrollDeltas = {
    sourceModuleTotalDelta: afterPayroll.hrPayroll.sourceModuleTotal - beforePayroll.hrPayroll.sourceModuleTotal,
    glPostedTotalDelta: afterPayroll.hrPayroll.glPostedTotal - beforePayroll.hrPayroll.glPostedTotal,
    totalSourceCountDelta: afterPayroll.hrPayroll.totalSourceCount - beforePayroll.hrPayroll.totalSourceCount,
    glPostedCountDelta: afterPayroll.hrPayroll.glPostedCount - beforePayroll.hrPayroll.glPostedCount,
    unpostedCountDelta: afterPayroll.hrPayroll.unpostedCount - beforePayroll.hrPayroll.unpostedCount,
  };
  console.log(JSON.stringify(payrollDeltas, null, 2));

  // Query Voucher table directly for HR_PAYROLL
  const payrollJournal = await prisma.accJournal.findFirst({
    where: {
      source_module: "HR_PAYROLL",
      source_reference_id: batchRefId,
    },
    include: { lines: true },
  });

  if (!payrollJournal) {
    console.error(`❌ STOP: Hook not firing for HR_PAYROLL! No AccJournal row found for source_reference_id = ${batchRefId}`);
    process.exit(1);
  }

  console.log("\n[QUERY AccJournal Row for HR_PAYROLL]:");
  console.log(JSON.stringify(payrollJournal, null, 2));
  const payrollDrCrEqual = Number(payrollJournal.total_debit) === Number(payrollJournal.total_credit);
  console.log(`✔ Dr = Cr Verification: Total Debit (${payrollJournal.total_debit}) === Total Credit (${payrollJournal.total_credit}) -> ${payrollDrCrEqual}`);
  if (!payrollDrCrEqual) {
    console.error("❌ STOP: Payroll journal debit does not equal credit!");
    process.exit(1);
  }

  // ------------------------------------------------------------------
  // FLOW 3: Academic Fine Payment
  // ------------------------------------------------------------------
  console.log("\n------------------------------------------------------------------");
  console.log("FLOW 3: Academic Fine Payment");
  console.log("------------------------------------------------------------------");

  const beforeFine = await getReconciliationJSON();
  console.log("[BEFORE Fine Payment Reconciliation JSON]:");
  console.log(JSON.stringify(beforeFine, null, 2));

  const fineService = new FineService();
  let fineCat = await prisma.fineCategory.findFirst();
  if (!fineCat) {
    fineCat = await fineService.createCategory({ name: `Fine Cat ${Date.now()}`, description: "Disciplinary" });
  }

  const fineAmount = 1500;
  const fine = await fineService.createFine({
    studentId: student.id,
    categoryId: fineCat.id,
    amount: fineAmount,
    reason: "E2E Live Test Fine",
    violationDate: new Date(),
    dueDate: new Date(),
    issuedById: BigInt(1),
  });

  const finePaymentResult = await fineService.recordPayment(fine.id, {
    amount: fineAmount,
    paymentMethod: "CASH",
    recordedById: BigInt(1),
  });
  const finePayment = finePaymentResult.payment;

  console.log(`\n✔ Created Fine Payment Record ID: ${finePayment.id} (Fine Ref: ${fine.referenceNumber}, Amount: Rs. ${fineAmount})`);

  const afterFine = await getReconciliationJSON();
  console.log("\n[AFTER Fine Payment Reconciliation JSON]:");
  console.log(JSON.stringify(afterFine, null, 2));

  console.log("\n[DIFF - Academic Module Deltas]:");
  const fineDeltas = {
    sourceModuleTotalDelta: afterFine.academic.sourceModuleTotal - beforeFine.academic.sourceModuleTotal,
    glPostedTotalDelta: afterFine.academic.glPostedTotal - beforeFine.academic.glPostedTotal,
    totalSourceCountDelta: afterFine.academic.totalSourceCount - beforeFine.academic.totalSourceCount,
    glPostedCountDelta: afterFine.academic.glPostedCount - beforeFine.academic.glPostedCount,
    unpostedCountDelta: afterFine.academic.unpostedCount - beforeFine.academic.unpostedCount,
  };
  console.log(JSON.stringify(fineDeltas, null, 2));

  // Query Voucher table directly for ACADEMIC
  const fineJournal = await prisma.accJournal.findFirst({
    where: {
      source_module: "ACADEMIC",
      source_reference_id: String(finePayment.id),
    },
    include: { lines: true },
  });

  if (!fineJournal) {
    console.error(`❌ STOP: Hook not firing for ACADEMIC! No AccJournal row found for source_reference_id = ${finePayment.id}`);
    process.exit(1);
  }

  console.log("\n[QUERY AccJournal Row for ACADEMIC]:");
  console.log(JSON.stringify(fineJournal, null, 2));
  const fineDrCrEqual = Number(fineJournal.total_debit) === Number(fineJournal.total_credit);
  console.log(`✔ Dr = Cr Verification: Total Debit (${fineJournal.total_debit}) === Total Credit (${fineJournal.total_credit}) -> ${fineDrCrEqual}`);
  if (!fineDrCrEqual) {
    console.error("❌ STOP: Academic fine journal debit does not equal credit!");
    process.exit(1);
  }

  console.log("\n==================================================================");
  console.log("✔ ALL THREE RECONCILIATION FLOWS COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
}

runE2EReconciliationTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ E2E Reconciliation Test Failed:", err);
    process.exit(1);
  });
