/**
 * Code-level Late Fee calculation scenarios (no DB mutations).
 */
import {
  computeLateFee,
  getLateFeeStartDate,
  parseFeeStatementBasicId,
  type LateFeeRule,
} from "../src/modules/feeManagementModule/services/lateFeeManagement.service";

const baseRule = (partial: Partial<LateFeeRule> & Pick<LateFeeRule, "calculation_type">): LateFeeRule => ({
  id: 1,
  name: "Test rule",
  calculation_type: partial.calculation_type,
  fixed_amount: partial.fixed_amount ?? null,
  percentage: partial.percentage ?? null,
  per_day_amount: partial.per_day_amount ?? null,
  max_cap: partial.max_cap ?? null,
  grace_period_days: partial.grace_period_days ?? 5,
  status: "Active",
  branch_id: null,
  program_id: null,
  class_id: null,
});

const d = (iso: string) => {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, day!, 12, 0, 0, 0);
};

let passed = 0;
let failed = 0;

const assert = (name: string, cond: boolean, detail?: string) => {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

// A. No due date
{
  const r = computeLateFee({
    dueAmount: 1000,
    paidAmount: 0,
    dueDateEnd: null,
    rule: baseRule({ calculation_type: "FIXED", fixed_amount: 100 }),
    asOf: d("2026-08-21"),
  });
  assert("A no due date", r.late_fee_amount === 0 && r.reason === "No due date");
}

// B. Due today
{
  const r = computeLateFee({
    dueAmount: 1000,
    paidAmount: 0,
    dueDateEnd: d("2026-08-21"),
    rule: baseRule({ calculation_type: "FIXED", fixed_amount: 100, grace_period_days: 5 }),
    asOf: d("2026-08-21"),
  });
  assert(
    "B due today",
    r.late_fee_amount === 0 && r.reason === "Due today",
    JSON.stringify({ fee: r.late_fee_amount, reason: r.reason })
  );
}

// C. Within grace
{
  const r = computeLateFee({
    dueAmount: 1000,
    paidAmount: 0,
    dueDateEnd: d("2026-08-10"),
    rule: baseRule({ calculation_type: "FIXED", fixed_amount: 100, grace_period_days: 5 }),
    asOf: d("2026-08-14"),
  });
  assert(
    "C within grace",
    r.late_fee_amount === 0 && r.reason === "Within grace period" && r.payment_status === "In Grace",
    JSON.stringify({ fee: r.late_fee_amount, reason: r.reason, status: r.payment_status })
  );
}

// D + E. Grace expired FIXED
{
  const r = computeLateFee({
    dueAmount: 1000,
    paidAmount: 0,
    dueDateEnd: d("2026-08-10"),
    rule: baseRule({ calculation_type: "FIXED", fixed_amount: 150, grace_period_days: 5 }),
    asOf: d("2026-08-16"),
  });
  assert(
    "D/E grace expired FIXED",
    r.late_fee_amount === 150 && r.days_overdue === 1,
    JSON.stringify(r)
  );
}

// F. PERCENT against outstanding
{
  const r = computeLateFee({
    dueAmount: 1000,
    paidAmount: 200,
    dueDateEnd: d("2026-08-01"),
    rule: baseRule({
      calculation_type: "PERCENT",
      percentage: 10,
      grace_period_days: 0,
    }),
    asOf: d("2026-08-03"),
  });
  assert(
    "F PERCENT on outstanding 800",
    r.late_fee_amount === 80 && r.outstanding_balance === 800,
    JSON.stringify({ fee: r.late_fee_amount, out: r.outstanding_balance })
  );
}

// G. PER_DAY
{
  // due 10 Aug, grace 0 → late starts 11 Aug; asOf 13 Aug → days = 3
  const lateStart = getLateFeeStartDate(d("2026-08-10"), 0);
  const r = computeLateFee({
    dueAmount: 1000,
    paidAmount: 0,
    dueDateEnd: d("2026-08-10"),
    rule: baseRule({
      calculation_type: "PER_DAY",
      per_day_amount: 25,
      grace_period_days: 0,
    }),
    asOf: d("2026-08-13"),
  });
  assert(
    "G PER_DAY",
    r.late_fee_amount === 25 * r.days_overdue && r.days_overdue >= 1,
    JSON.stringify({
      fee: r.late_fee_amount,
      days: r.days_overdue,
      lateStart: lateStart.toDateString(),
    })
  );
}

// H. Fully paid
{
  const r = computeLateFee({
    dueAmount: 1000,
    paidAmount: 1000,
    dueDateEnd: d("2026-01-01"),
    rule: baseRule({ calculation_type: "FIXED", fixed_amount: 100, grace_period_days: 0 }),
    asOf: d("2026-08-21"),
  });
  assert("H fully paid", r.late_fee_amount === 0 && r.reason === "Fully paid");
}

// I. Partial — PERCENT uses remaining outstanding
{
  const r = computeLateFee({
    dueAmount: 2000,
    paidAmount: 500,
    dueDateEnd: d("2026-07-01"),
    rule: baseRule({
      calculation_type: "PERCENT",
      percentage: 5,
      grace_period_days: 0,
    }),
    asOf: d("2026-08-01"),
  });
  assert(
    "I partial outstanding base",
    r.outstanding_balance === 1500 && r.late_fee_amount === 75,
    JSON.stringify({ out: r.outstanding_balance, fee: r.late_fee_amount })
  );
}

// J/K. Statement ID parsing
{
  try {
    assert("K STMT parse", parseFeeStatementBasicId("STMT-12") === 12);
    assert("K numeric parse", parseFeeStatementBasicId("12") === 12);
    let threw = false;
    try {
      parseFeeStatementBasicId("not-an-id");
    } catch {
      threw = true;
    }
    assert("J invalid ID throws", threw);
  } catch (e) {
    assert("parse helper", false, String(e));
  }
}

console.log(`\nResult: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
