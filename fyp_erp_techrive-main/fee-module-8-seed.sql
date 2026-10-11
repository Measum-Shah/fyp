-- =============================================================================
-- Module 8 (Security & Access Control) — PostgreSQL test seed
-- Depends on: module1_seed_data.sql, module2_student_fee_seed.sql
-- Optional: fee-module-6-seed.sql (parent_details id 101 for parent login)
--
-- Access control uses existing erp_users.user_type (no new roles tables).
-- Audit trail uses existing erp_activity_logs with module = 'Fee Management'.
-- Parent self-service matches parent_details.father_email to erp_users.email.
-- Student self-service matches students.email to erp_users.email.
--
-- Test login password for seeded users: FeeTest@123
-- (bcrypt hash + string_password plaintext fallback used by auth.controller)
-- No new tables. Does not insert into staff / RBAC permission tables.
-- =============================================================================

BEGIN;

-- ─── Test users for Fee roles (existing erp_users) ───────────────────────────
INSERT INTO erp_users (
  id, branch_id, name, email, password, string_password, user_type,
  active, status, created_at, updated_at
)
SELECT 201, 1, 'Fee Accountant', 'fee.accountant@techrive.edu.pk',
       '$2b$12$CTetaJu7ut1HBYyviNwM1.bOjFOcahqlKa3rn6wwCNCdG7dCjFVBq',
       'FeeTest@123', 'accountant', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM erp_users WHERE id = 201 OR email = 'fee.accountant@techrive.edu.pk');

INSERT INTO erp_users (
  id, branch_id, name, email, password, string_password, user_type,
  active, status, created_at, updated_at
)
SELECT 202, 1, 'Fee Teacher', 'fee.teacher@techrive.edu.pk',
       '$2b$12$CTetaJu7ut1HBYyviNwM1.bOjFOcahqlKa3rn6wwCNCdG7dCjFVBq',
       'FeeTest@123', 'teacher', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM erp_users WHERE id = 202 OR email = 'fee.teacher@techrive.edu.pk');

INSERT INTO erp_users (
  id, branch_id, name, email, password, string_password, user_type,
  active, status, created_at, updated_at
)
SELECT 203, 1, 'Parent of Ayesha', 'parent.ayesha@techrive.edu.pk',
       '$2b$12$CTetaJu7ut1HBYyviNwM1.bOjFOcahqlKa3rn6wwCNCdG7dCjFVBq',
       'FeeTest@123', 'parent', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM erp_users WHERE id = 203 OR email = 'parent.ayesha@techrive.edu.pk');

INSERT INTO erp_users (
  id, branch_id, name, email, password, string_password, user_type,
  active, status, created_at, updated_at
)
SELECT 204, 1, 'Ayesha Khan', 'ayesha.khan@student.techrive.edu.pk',
       '$2b$12$CTetaJu7ut1HBYyviNwM1.bOjFOcahqlKa3rn6wwCNCdG7dCjFVBq',
       'FeeTest@123', 'student', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM erp_users WHERE id = 204 OR email = 'ayesha.khan@student.techrive.edu.pk');

SELECT setval(pg_get_serial_sequence('erp_users', 'id'), GREATEST((SELECT MAX(id) FROM erp_users), 1));

-- Parent row for self-service if Module 6 was not applied yet
INSERT INTO parent_details (
  id, students_id, father_first_name, father_last_name, father_email, father_mobile_1,
  filer_info, status, created_at, updated_at
)
VALUES
  (101, 1, 'Imran', 'Khan', 'parent.ayesha@techrive.edu.pk', '03001111001',
   0, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ─── Audit trail samples (existing erp_activity_logs) ────────────────────────
INSERT INTO erp_activity_logs (
  user_id, user_name, role_id, branch_id, module, action, record_type, record_id,
  description, request_method, endpoint, created_at
)
SELECT 201, 'Fee Accountant', NULL, 1, 'Fee Management', 'PAYMENT', 'fee_collections', '101',
       'Seed: recorded cash payment against statement 2', 'POST', '/api/fee/payments',
       NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (
  SELECT 1 FROM erp_activity_logs
  WHERE module = 'Fee Management' AND record_id = '101' AND action = 'PAYMENT'
);

INSERT INTO erp_activity_logs (
  user_id, user_name, role_id, branch_id, module, action, record_type, record_id,
  description, request_method, endpoint, created_at
)
SELECT 201, 'Fee Accountant', NULL, 1, 'Fee Management', 'LATE_FEE', 'late_fee_rule', '1',
       'Seed: late fee rule configured for Islamabad campus', 'POST', '/api/fee/late-fees/rules',
       NOW() - INTERVAL '4 days'
WHERE NOT EXISTS (
  SELECT 1 FROM erp_activity_logs
  WHERE module = 'Fee Management' AND record_id = '1' AND action = 'LATE_FEE'
);

INSERT INTO erp_activity_logs (
  user_id, user_name, role_id, branch_id, module, action, record_type, record_id,
  description, request_method, endpoint, created_at
)
SELECT 201, 'Fee Accountant', NULL, 1, 'Fee Management', 'NOTIFICATION', 'fee_notification', '1',
       'Seed: due reminder sent to Ayesha Khan', 'POST', '/api/fee/notifications/run-due-reminders',
       NOW() - INTERVAL '3 days'
WHERE NOT EXISTS (
  SELECT 1 FROM erp_activity_logs
  WHERE module = 'Fee Management' AND action = 'NOTIFICATION' AND record_id = '1'
);

INSERT INTO erp_activity_logs (
  user_id, user_name, role_id, branch_id, module, action, record_type, record_id,
  description, request_method, endpoint, created_at
)
SELECT 203, 'Parent of Ayesha', NULL, 1, 'Fee Management', 'VIEW', 'student_fee', '1',
       'Seed: parent viewed own fee dashboard', 'GET', '/api/fee/me/dashboard',
       NOW() - INTERVAL '1 day'
WHERE NOT EXISTS (
  SELECT 1 FROM erp_activity_logs
  WHERE module = 'Fee Management' AND endpoint = '/api/fee/me/dashboard'
);

INSERT INTO erp_activity_logs (
  user_id, user_name, role_id, branch_id, module, action, record_type, record_id,
  description, request_method, endpoint, created_at
)
SELECT 202, 'Fee Teacher', NULL, 1, 'Fee Management', 'UNAUTHORIZED_ACCESS', 'security', NULL,
       'Seed: teacher blocked from payment processing', 'ACCESS', '/api/fee/payments',
       NOW() - INTERVAL '2 days'
WHERE NOT EXISTS (
  SELECT 1 FROM erp_activity_logs
  WHERE module = 'Fee Management' AND action = 'UNAUTHORIZED_ACCESS'
);

COMMIT;

SELECT 'erp_users' AS table_name, COUNT(*)::int AS seed_rows
FROM erp_users WHERE id IN (201, 202, 203, 204)
UNION ALL
SELECT 'erp_activity_logs', COUNT(*)::int
FROM erp_activity_logs WHERE module = 'Fee Management'
UNION ALL
SELECT 'parent_details', COUNT(*)::int
FROM parent_details WHERE id = 101;
