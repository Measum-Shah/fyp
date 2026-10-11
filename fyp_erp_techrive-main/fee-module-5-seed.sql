-- =============================================================================
-- Module 5 (Late Fee Management) — PostgreSQL test seed
-- Database: existing ERP schema only. INSERT/UPDATE of Fee-owned settings row.
-- Depends on: module1_seed_data.sql, module2_student_fee_seed.sql
-- (overdue statements for students 3–4 already exist in Module 2)
--
-- Late-fee rules are stored in existing payment_settings.config JSON
-- where identity = 'LATE_FEE' (varchar 15). No new tables.
-- Safe to re-run: upserts the LATE_FEE settings row only.
-- =============================================================================

BEGIN;

-- ─── Late fee rules (existing payment_settings) ───────────────────────────────
-- identity 'LATE_FEE' matches LATE_FEE_SETTINGS_IDENTITY in lateFee.constants.ts
INSERT INTO payment_settings (created_at, updated_at, identity, logo, link, config, status)
SELECT NOW(), NOW(), 'LATE_FEE', 'fee', '-',
$latefee${
  "rules": [
    {
      "id": 1,
      "name": "Islamabad campus late fee",
      "branch_id": 1,
      "program_id": null,
      "class_id": null,
      "calculation_type": "FIXED",
      "fixed_amount": 500,
      "percentage": null,
      "per_day_amount": null,
      "max_cap": 5000,
      "grace_period_days": 5,
      "effective_from": "2025-01-01",
      "effective_to": null,
      "status": "Active",
      "created_at": "2025-09-01T00:00:00.000Z",
      "updated_at": "2025-09-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Lahore campus daily late fee",
      "branch_id": 2,
      "program_id": null,
      "class_id": null,
      "calculation_type": "PER_DAY",
      "fixed_amount": null,
      "percentage": null,
      "per_day_amount": 50,
      "max_cap": 3000,
      "grace_period_days": 3,
      "effective_from": "2025-01-01",
      "effective_to": null,
      "status": "Active",
      "created_at": "2025-09-01T00:00:00.000Z",
      "updated_at": "2025-09-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "name": "Matric Science percent late fee",
      "branch_id": 1,
      "program_id": 1,
      "class_id": 1,
      "calculation_type": "PERCENT",
      "fixed_amount": null,
      "percentage": 2,
      "per_day_amount": null,
      "max_cap": 2000,
      "grace_period_days": 7,
      "effective_from": "2025-01-01",
      "effective_to": null,
      "status": "Inactive",
      "created_at": "2025-09-01T00:00:00.000Z",
      "updated_at": "2025-09-01T00:00:00.000Z"
    }
  ],
  "next_rule_id": 4
}$latefee$, 1
WHERE NOT EXISTS (
  SELECT 1 FROM payment_settings WHERE identity = 'LATE_FEE'
);

UPDATE payment_settings
SET config = $latefee${
  "rules": [
    {
      "id": 1,
      "name": "Islamabad campus late fee",
      "branch_id": 1,
      "program_id": null,
      "class_id": null,
      "calculation_type": "FIXED",
      "fixed_amount": 500,
      "percentage": null,
      "per_day_amount": null,
      "max_cap": 5000,
      "grace_period_days": 5,
      "effective_from": "2025-01-01",
      "effective_to": null,
      "status": "Active",
      "created_at": "2025-09-01T00:00:00.000Z",
      "updated_at": "2025-09-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Lahore campus daily late fee",
      "branch_id": 2,
      "program_id": null,
      "class_id": null,
      "calculation_type": "PER_DAY",
      "fixed_amount": null,
      "percentage": null,
      "per_day_amount": 50,
      "max_cap": 3000,
      "grace_period_days": 3,
      "effective_from": "2025-01-01",
      "effective_to": null,
      "status": "Active",
      "created_at": "2025-09-01T00:00:00.000Z",
      "updated_at": "2025-09-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "name": "Matric Science percent late fee",
      "branch_id": 1,
      "program_id": 1,
      "class_id": 1,
      "calculation_type": "PERCENT",
      "fixed_amount": null,
      "percentage": 2,
      "per_day_amount": null,
      "max_cap": 2000,
      "grace_period_days": 7,
      "effective_from": "2025-01-01",
      "effective_to": null,
      "status": "Inactive",
      "created_at": "2025-09-01T00:00:00.000Z",
      "updated_at": "2025-09-01T00:00:00.000Z"
    }
  ],
  "next_rule_id": 4
}$latefee$,
    updated_at = NOW(),
    status = 1
WHERE identity = 'LATE_FEE';

COMMIT;

SELECT identity, status, LEFT(config, 80) AS config_preview
FROM payment_settings
WHERE identity = 'LATE_FEE';
