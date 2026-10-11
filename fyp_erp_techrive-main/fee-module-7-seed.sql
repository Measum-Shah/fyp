-- =============================================================================
-- Module 7 (Reporting & Analytics) — PostgreSQL test seed
-- Depends on: module1_seed_data.sql, module2_student_fee_seed.sql,
--             module3_payment_seed.sql
--
-- Reports read existing fee_master_basics / fee_masters / students /
-- discount_types plus fee_collections (+ optional fee_collection_detail).
-- Module 2 already has statements; this file adds collection rows so
-- collection / outstanding / defaulter reports have payment history.
-- No new tables.
-- =============================================================================

BEGIN;

-- ─── fee_collections for Module 2 students (ids 1–4, statements 2–5) ─────────
INSERT INTO fee_collections (
  id, branch_id, session_id, students_id, fee_masters_id, fee_structure_code,
  bill_no, fee_term_id, due_date, paid_date, paid_amount, post_date,
  discount, discount_type, fine, tax_percentage, total_amount, payment_mode,
  note, fee_status, balance, all_paid, created_by, created_at, updated_at,
  voucher_sequence, validity_date, tax_deduction, intake_id, board_id,
  class_id, program_id, other_tax, overall_remarks, active_status,
  cancel_voucher, voucher_type, tax_amount, installment_allow
)
VALUES
  -- Ayesha (partial Cash) — lines 10–11 already show paid amounts
  (101, 1, 2, 1, 10, 1001, 'BILL-1001-AYESHA', '1', '2025-09-30', '2025-09-10',
   10500, '2025-09-10', 2000, 1, 0, 0, 25000, 'Cash',
   'Seed partial cash', 1, 14500, 0, 1, NOW(), NOW(),
   'PAY-SEED-101', '2025-09-30', 0, 1, 1, 1, 1, 0,
   'Module7 seed', 1, 'No', 'Partial Payment', 0, 1),
  -- Hassan (partial Bank Transfer)
  (102, 1, 2, 2, 15, 1002, 'BILL-1002-HASSAN', '6', '2026-01-31', '2025-09-20',
   10000, '2025-09-20', 0, 1, 0, 0, 38500, 'Bank Transfer',
   'Seed partial transfer', 1, 28500, 0, 1, NOW(), NOW(),
   'PAY-SEED-102', '2026-01-31', 0, 1, 1, 3, 2, 0,
   'Module7 seed', 1, 'No', 'Partial Payment', 0, 1),
  -- Fatima (partial Online / Stripe)
  (103, 1, 2, 3, 19, 1003, 'BILL-1003-FATIMA', '7', '2025-10-15', '2025-09-25',
   65000, '2025-09-25', 5000, 2, 0, 0, 113000, 'Stripe',
   'Seed partial online', 1, 48000, 0, 1, NOW(), NOW(),
   'PAY-SEED-103', '2025-10-15', 0, 1, 3, 5, 4, 0,
   'Module7 seed', 1, 'No', 'Partial Payment', 0, 1)
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('fee_collections', 'id'), GREATEST((SELECT MAX(id) FROM fee_collections), 1));

-- ─── Matching collection detail lines (existing fee_collection_detail) ───────
INSERT INTO fee_collection_detail (
  id, fc_id, branch_id, board_id, program_id, student_id, class_id, intake_id,
  session_id, bill_id, fee_head_id, fee_term_id, amount, remarks, created_at, arreas
)
VALUES
  (101, 101, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 10500, 'Cash · PAY-SEED-101', NOW(), 0),
  (102, 102, 1, 1, 2, 2, 3, 1, 2, 3, 1, 6, 10000, 'Bank Transfer · PAY-SEED-102', NOW(), 0),
  (103, 103, 1, 3, 4, 3, 5, 1, 2, 4, 1, 7, 65000, 'Stripe · PAY-SEED-103', NOW(), 0)
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('fee_collection_detail', 'id'), GREATEST((SELECT MAX(id) FROM fee_collection_detail), 1));

COMMIT;

SELECT 'fee_collections' AS table_name, COUNT(*)::int AS seed_rows
FROM fee_collections WHERE id IN (101, 102, 103)
UNION ALL
SELECT 'fee_collection_detail', COUNT(*)::int
FROM fee_collection_detail WHERE id IN (101, 102, 103);
