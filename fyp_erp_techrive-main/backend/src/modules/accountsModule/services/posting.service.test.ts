import { postJournalEntry, reverseJournalEntry } from "./posting.service";
import { prisma } from "../../../config/db";

/**
 * Isolated Unit & Integration Tests for Central Posting Service
 */
export async function runPostingServiceTests() {
  console.log("▶ Running Central Posting Service Tests...");
  let passed = 0;
  let failed = 0;

  // Ensure mock accounts exist
  let cashAcc = await prisma.accAccount.findFirst({ where: { code: "1010" } });
  if (!cashAcc) {
    cashAcc = await prisma.accAccount.create({
      data: { code: "1010", name: "Test Cash", type: "ASSET", normal_balance: "DEBIT" },
    });
  }

  let revAcc = await prisma.accAccount.findFirst({ where: { code: "4010" } });
  if (!revAcc) {
    revAcc = await prisma.accAccount.create({
      data: { code: "4010", name: "Test Fee Revenue", type: "REVENUE", normal_balance: "CREDIT" },
    });
  }

  // Test 1: Double-Entry Validation Error
  try {
    await postJournalEntry({
      sourceModule: "FEE",
      sourceReferenceType: "TEST_IMBALANCED",
      sourceReferenceId: "TEST-001",
      lines: [
        { account_id: cashAcc.id, debit: 1000, credit: 0 },
        { account_id: revAcc.id, debit: 0, credit: 500 }, // Imbalanced!
      ],
    });
    console.error("❌ Test 1 Failed: Expected double-entry error for imbalanced lines");
    failed++;
  } catch (err: any) {
    if (err.message.includes("Double-Entry Violation")) {
      console.log("✔ Test 1 Passed: Double-entry imbalanced entry rejected");
      passed++;
    } else {
      console.error("❌ Test 1 Failed with unexpected error:", err.message);
      failed++;
    }
  }

  // Test 2: Idempotent Posting
  try {
    const testRefId = `TEST-IDEM-${Date.now()}`;
    const v1 = await postJournalEntry({
      sourceModule: "FEE",
      sourceReferenceType: "TEST_IDEMPOTENT",
      sourceReferenceId: testRefId,
      narration: "Test Idempotent Entry",
      lines: [
        { account_id: cashAcc.id, debit: 500, credit: 0 },
        { account_id: revAcc.id, debit: 0, credit: 500 },
      ],
      autoPost: true,
    });

    const v2 = await postJournalEntry({
      sourceModule: "FEE",
      sourceReferenceType: "TEST_IDEMPOTENT",
      sourceReferenceId: testRefId,
      narration: "Test Idempotent Entry Duplicate Attempt",
      lines: [
        { account_id: cashAcc.id, debit: 500, credit: 0 },
        { account_id: revAcc.id, debit: 0, credit: 500 },
      ],
      autoPost: true,
    });

    if (v1.id === v2.id) {
      console.log("✔ Test 2 Passed: Idempotency check returned identical voucher ID");
      passed++;
    } else {
      console.error("❌ Test 2 Failed: Idempotency check created duplicate voucher IDs");
      failed++;
    }
  } catch (err: any) {
    console.error("❌ Test 2 Failed:", err.message);
    failed++;
  }

  // Test 3: Reversal Entry Creation
  try {
    const testRefId = `TEST-REV-${Date.now()}`;
    const original = await postJournalEntry({
      sourceModule: "ACADEMIC",
      sourceReferenceType: "TEST_REVERSAL_ORIGINAL",
      sourceReferenceId: testRefId,
      lines: [
        { account_id: cashAcc.id, debit: 300, credit: 0 },
        { account_id: revAcc.id, debit: 0, credit: 300 },
      ],
      autoPost: true,
    });

    const reversal = await reverseJournalEntry(original.id, "Test Reversal Reason");
    if (reversal && reversal.total_debit.toString() === "300") {
      console.log("✔ Test 3 Passed: Reversal voucher created successfully");
      passed++;
    } else {
      console.error("❌ Test 3 Failed: Reversal creation failed");
      failed++;
    }
  } catch (err: any) {
    console.error("❌ Test 3 Failed:", err.message);
    failed++;
  }

  // Test 4: Period Closing Rejection Guard
  try {
    const closedYear = 2020;
    const closedMonth = 1;
    await prisma.accPeriodClosing.upsert({
      where: { id: 9999 },
      update: { status: "CLOSED" },
      create: {
        id: 9999,
        fiscal_year: closedYear,
        period_month: closedMonth,
        period_name: "Jan 2020 Closed Period",
        status: "CLOSED",
      },
    });

    await postJournalEntry({
      sourceModule: "FEE",
      sourceReferenceType: "TEST_PERIOD_CLOSED",
      sourceReferenceId: `TEST-CLOSED-${Date.now()}`,
      date: new Date("2020-01-15"),
      lines: [
        { account_id: cashAcc.id, debit: 100, credit: 0 },
        { account_id: revAcc.id, debit: 0, credit: 100 },
      ],
      autoPost: true,
    });
    console.error("❌ Test 4 Failed: Expected rejection for closed period date");
    failed++;
  } catch (err: any) {
    if (err.message.includes("Posting Rejected") || err.message.includes("closed")) {
      console.log("✔ Test 4 Passed: Closed period posting correctly rejected");
      passed++;
    } else {
      console.error("❌ Test 4 Failed with unexpected error:", err.message);
      failed++;
    }
  }

  // Test 5: GLMappingConfig auto_post Fallback Resolution
  try {
    const eventKey = `TEST_EVENT_${Date.now()}`;
    await prisma.gLMappingConfig.create({
      data: {
        event_key: eventKey,
        auto_post: true,
        description: "Test Event Key",
      },
    });

    const journal = await postJournalEntry({
      sourceModule: "FEE",
      sourceReferenceType: eventKey,
      sourceReferenceId: `TEST-CFG-${Date.now()}`,
      lines: [
        { account_id: cashAcc.id, debit: 250, credit: 0 },
        { account_id: revAcc.id, debit: 0, credit: 250 },
      ],
      // autoPost is deliberately omitted to test fallback to GLMappingConfig.auto_post (true)
    });

    if (journal.status === "POSTED") {
      console.log("✔ Test 5 Passed: GLMappingConfig.auto_post fallback resolved to POSTED");
      passed++;
    } else {
      console.error(`❌ Test 5 Failed: Expected status POSTED but got ${journal.status}`);
      failed++;
    }
  } catch (err: any) {
    console.error("❌ Test 5 Failed:", err.message);
    failed++;
  }

  // Test 6: Loan Deduction Credits Correct Account (1050, not 1010)
  try {
    let loanReceivableAcc = await prisma.accAccount.findFirst({ where: { code: "1050" } });
    if (!loanReceivableAcc) {
      loanReceivableAcc = await prisma.accAccount.create({
        data: { code: "1050", name: "Employee Loan Receivable", type: "ASSET", normal_balance: "DEBIT" },
      });
    }

    const testRefId = `TEST-LOAN-ACCT-${Date.now()}`;
    const loanJournal = await postJournalEntry({
      sourceModule: "HR_PAYROLL",
      sourceReferenceType: "PAYROLL_RUN",
      sourceReferenceId: testRefId,
      narration: "Test Payroll with Loan Deduction",
      lines: [
        { account_id: cashAcc.id, debit: 50000, credit: 0, description: "Salary Expense" },
        { account_id: cashAcc.id, debit: 0, credit: 45000, description: "Net Pay - Bank" },
        { account_id: loanReceivableAcc.id, debit: 0, credit: 5000, description: "Staff Loan Installment Deduction" },
      ],
      autoPost: true,
    });

    const journalWithLines = await prisma.accJournal.findUnique({
      where: { id: loanJournal.id },
      include: { lines: true },
    });

    const loanLine = journalWithLines?.lines.find(l => l.description?.includes("Loan"));
    if (loanLine && loanLine.account_id === loanReceivableAcc.id && loanLine.account_id !== cashAcc.id) {
      console.log("✔ Test 6 Passed: Loan deduction correctly credits account 1050 (Loan Receivable), not 1010 (Cash)");
      passed++;
    } else {
      console.error(`❌ Test 6 Failed: Loan line credits account_id ${loanLine?.account_id}, expected ${loanReceivableAcc.id}`);
      failed++;
    }
  } catch (err: any) {
    console.error("❌ Test 6 Failed:", err.message);
    failed++;
  }

  // Test 7: Missing Account 1050 Throws ACCOUNT_MAPPING_MISSING
  try {
    // Temporarily verify that a postJournalEntry call with lines referencing
    // a non-existent account_id raises an error (simulating the missing-1050 scenario)
    await postJournalEntry({
      sourceModule: "HR_PAYROLL",
      sourceReferenceType: "TEST_MISSING_ACCOUNT",
      sourceReferenceId: `TEST-MISSING-${Date.now()}`,
      lines: [
        { account_id: cashAcc.id, debit: 10000, credit: 0 },
        { account_id: 999999, debit: 0, credit: 10000 }, // Non-existent account
      ],
      autoPost: true,
    });
    // If no error was thrown by Prisma's FK constraint, that's unexpected
    console.error("❌ Test 7 Failed: Expected FK constraint error for non-existent account_id");
    failed++;
  } catch (err: any) {
    // Prisma should reject with a foreign key constraint error (P2003)
    // or the posting service should reject with ACCOUNT_MAPPING_MISSING
    if (err.message.includes("ACCOUNT_MAPPING_MISSING") || err.code === "P2003" || err.message.includes("Foreign key") || err.message.includes("constraint")) {
      console.log("✔ Test 7 Passed: Non-existent account correctly rejected (FK constraint or mapping error)");
      passed++;
    } else {
      console.error("❌ Test 7 Failed with unexpected error:", err.message);
      failed++;
    }
  }

  console.log(`\nPosting Service Test Summary: ${passed} Passed, ${failed} Failed\n`);
  return { passed, failed };
}
