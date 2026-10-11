-- =============================================================================
-- Module 6 (Alerts & Notifications) — PostgreSQL test seed
-- Depends on: module1_seed_data.sql, module2_student_fee_seed.sql
--
-- Notification settings + log live in existing payment_settings.config JSON
-- where identity = 'FEE_NOTIF' (varchar 15). SMS provider status is read from
-- existing sms_settings. Recipients also use parent_details (existing table).
-- No new tables.
-- =============================================================================

BEGIN;

-- ─── SMS provider row (existing sms_settings — sandbox only) ─────────────────
INSERT INTO sms_settings (created_at, updated_at, identity, logo, link, config, status)
SELECT NOW(), NOW(), 'SMS_SANDBOX', 'sms', 'https://sandbox.sms-provider.test',
$sms${
  "mode": "sandbox",
  "api_key": "test_sms_api_key_techrive",
  "sender_id": "TECHRIVE"
}$sms$, 1
WHERE NOT EXISTS (
  SELECT 1 FROM sms_settings WHERE identity = 'SMS_SANDBOX'
);

-- ─── Parent contacts for Module 2 students (notification recipients) ─────────
-- father_first_name / father_last_name are varchar(15)
INSERT INTO parent_details (
  id, students_id, father_first_name, father_last_name, father_email, father_mobile_1,
  mother_first_name, mother_last_name, mother_email, mother_mobile_1,
  filer_info, status, created_at, updated_at
)
VALUES
  (101, 1, 'Imran', 'Khan', 'parent.ayesha@techrive.edu.pk', '03001111001',
   'Nadia', 'Khan', 'mother.ayesha@techrive.edu.pk', '03001111002',
   0, 1, NOW(), NOW()),
  (102, 4, 'Tariq', 'Ahmed', 'parent.bilal@techrive.edu.pk', '03004444001',
   NULL, NULL, NULL, NULL,
   0, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('parent_details', 'id'), GREATEST((SELECT MAX(id) FROM parent_details), 1));

-- ─── Notification settings + sample log (existing payment_settings) ──────────
INSERT INTO payment_settings (created_at, updated_at, identity, logo, link, config, status)
SELECT NOW(), NOW(), 'FEE_NOTIF', 'fee', '-',
$notif${
  "settings": {
    "enabled": true,
    "due_reminder": {
      "enabled": true,
      "days_before": [7, 3, 1],
      "channels": { "email": true, "sms": true }
    },
    "payment_confirmation": {
      "enabled": true,
      "channels": { "email": true, "sms": false }
    },
    "overdue": {
      "enabled": true,
      "channels": { "email": true, "sms": true },
      "include_late_fee": true
    }
  },
  "log": [
    {
      "id": 1,
      "idempotency_key": "seed-due-1-ayesha-email",
      "type": "DUE_REMINDER",
      "channel": "email",
      "status": "SENT",
      "recipient": "ayesha.khan@student.techrive.edu.pk",
      "recipient_name": "Ayesha Khan",
      "student_id": 1,
      "fee_master_basic_id": 2,
      "payment_collection_id": null,
      "subject": "Fee due reminder",
      "failure_reason": null,
      "sent_at": "2026-08-10T08:00:00.000Z",
      "created_at": "2026-08-10T08:00:00.000Z"
    },
    {
      "id": 2,
      "idempotency_key": "seed-overdue-4-bilal-email",
      "type": "OVERDUE",
      "channel": "email",
      "status": "SENT",
      "recipient": "bilal.ahmed@student.techrive.edu.pk",
      "recipient_name": "Bilal Ahmed",
      "student_id": 4,
      "fee_master_basic_id": 5,
      "payment_collection_id": null,
      "subject": "Overdue fee notice",
      "failure_reason": null,
      "sent_at": "2026-08-12T08:00:00.000Z",
      "created_at": "2026-08-12T08:00:00.000Z"
    },
    {
      "id": 3,
      "idempotency_key": "seed-pay-1-ayesha-email",
      "type": "PAYMENT_CONFIRM",
      "channel": "email",
      "status": "SKIPPED",
      "recipient": "ayesha.khan@student.techrive.edu.pk",
      "recipient_name": "Ayesha Khan",
      "student_id": 1,
      "fee_master_basic_id": 2,
      "payment_collection_id": null,
      "subject": "Payment confirmation",
      "failure_reason": "Preview only",
      "sent_at": null,
      "created_at": "2026-08-14T09:00:00.000Z"
    }
  ],
  "next_log_id": 4
}$notif$, 1
WHERE NOT EXISTS (
  SELECT 1 FROM payment_settings WHERE identity = 'FEE_NOTIF'
);

UPDATE payment_settings
SET config = $notif${
  "settings": {
    "enabled": true,
    "due_reminder": {
      "enabled": true,
      "days_before": [7, 3, 1],
      "channels": { "email": true, "sms": true }
    },
    "payment_confirmation": {
      "enabled": true,
      "channels": { "email": true, "sms": false }
    },
    "overdue": {
      "enabled": true,
      "channels": { "email": true, "sms": true },
      "include_late_fee": true
    }
  },
  "log": [
    {
      "id": 1,
      "idempotency_key": "seed-due-1-ayesha-email",
      "type": "DUE_REMINDER",
      "channel": "email",
      "status": "SENT",
      "recipient": "ayesha.khan@student.techrive.edu.pk",
      "recipient_name": "Ayesha Khan",
      "student_id": 1,
      "fee_master_basic_id": 2,
      "payment_collection_id": null,
      "subject": "Fee due reminder",
      "failure_reason": null,
      "sent_at": "2026-08-10T08:00:00.000Z",
      "created_at": "2026-08-10T08:00:00.000Z"
    },
    {
      "id": 2,
      "idempotency_key": "seed-overdue-4-bilal-email",
      "type": "OVERDUE",
      "channel": "email",
      "status": "SENT",
      "recipient": "bilal.ahmed@student.techrive.edu.pk",
      "recipient_name": "Bilal Ahmed",
      "student_id": 4,
      "fee_master_basic_id": 5,
      "payment_collection_id": null,
      "subject": "Overdue fee notice",
      "failure_reason": null,
      "sent_at": "2026-08-12T08:00:00.000Z",
      "created_at": "2026-08-12T08:00:00.000Z"
    },
    {
      "id": 3,
      "idempotency_key": "seed-pay-1-ayesha-email",
      "type": "PAYMENT_CONFIRM",
      "channel": "email",
      "status": "SKIPPED",
      "recipient": "ayesha.khan@student.techrive.edu.pk",
      "recipient_name": "Ayesha Khan",
      "student_id": 1,
      "fee_master_basic_id": 2,
      "payment_collection_id": null,
      "subject": "Payment confirmation",
      "failure_reason": "Preview only",
      "sent_at": null,
      "created_at": "2026-08-14T09:00:00.000Z"
    }
  ],
  "next_log_id": 4
}$notif$,
    updated_at = NOW(),
    status = 1
WHERE identity = 'FEE_NOTIF';

COMMIT;

SELECT identity, status FROM payment_settings WHERE identity = 'FEE_NOTIF'
UNION ALL
SELECT identity, status FROM sms_settings WHERE identity = 'SMS_SANDBOX';

SELECT 'parent_details' AS table_name, COUNT(*)::int AS rows
FROM parent_details WHERE id IN (101, 102);
