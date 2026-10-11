-- =============================================================================
-- Student Enrollment — PostgreSQL test seed
-- Depends on: module1_seed_data.sql (lookups / fee setup). Safe if already run:
--             lookup inserts use the same IDs with ON CONFLICT DO NOTHING.
--
-- Schema self-sufficiency: this seed embeds the same ADD COLUMN IF NOT EXISTS
-- statements as student-enrollment-schema-alter.sql (students disability* and
-- parent_details *_is_staff / *_staff_ref). It is safe to run this seed before
-- or after that alter file; both orders are idempotent for those additions.
-- The separate schema-alter file remains available for schema-only runs.
--
-- Student Enrollment list only shows admission_status IN ('Walk-in','Registered').
-- Module 2 students stay 'Admitted' and are left unchanged.
--
-- Active academic context:
--   Branch -> active_sessions (by branch_id) -> active_session_sections
-- After running this seed:
--   Branch 1 (ISB): Active Sessions 1, 2, 4
--   Branch 2 (LHR): Active Session 3
--   Branch 3 (RWP): Active Session 5
-- Students 101–104 are linked to Active Session #1 (ISB Matric Science).
-- =============================================================================

BEGIN;

-- Prerequisite: Academic branch lookups filter departments by institution_type.
-- Idempotent — safe if the column already exists on another machine's DB.
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS institution_type VARCHAR(50) DEFAULT 'university';

-- Same statements as student-enrollment-schema-alter.sql (idempotent IF NOT EXISTS).
-- Students: disability / special needs (aligned with staff.disability convention)
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS disability SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS disability_description VARCHAR(255);

-- ParentDetails: per-parent/guardian staff flags
-- (students.staff_ref alone cannot safely represent Father/Mother/Guardian separately)
ALTER TABLE parent_details
  ADD COLUMN IF NOT EXISTS father_is_staff SMALLINT DEFAULT 0;

ALTER TABLE parent_details
  ADD COLUMN IF NOT EXISTS father_staff_ref VARCHAR(191);

ALTER TABLE parent_details
  ADD COLUMN IF NOT EXISTS mother_is_staff SMALLINT DEFAULT 0;

ALTER TABLE parent_details
  ADD COLUMN IF NOT EXISTS mother_staff_ref VARCHAR(191);

ALTER TABLE parent_details
  ADD COLUMN IF NOT EXISTS guardian_is_staff SMALLINT DEFAULT 0;

ALTER TABLE parent_details
  ADD COLUMN IF NOT EXISTS guardian_staff_ref VARCHAR(191);

-- ─── Supporting lookups (same IDs as module1_seed_data.sql) ──────────────────
INSERT INTO erp_companies (id, name, status, created_at, updated_at)
VALUES (1, 'TechRive', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, title, start_year, end_year, no_of_years, active_status, status, created_by, created_at, updated_at)
VALUES
  (1, 'Academic Session 2024-2025', '2024-01-01', '2025-12-31', '1', 0, 'Active', 1, NOW(), NOW()),
  (2, 'Academic Session 2025-2026', '2025-01-01', '2026-12-31', '1', 1, 'Active', 1, NOW(), NOW()),
  (3, 'Academic Session 2026-2027', '2026-01-01', '2027-12-31', '1', 0, 'Active', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('sessions', 'id'), GREATEST((SELECT MAX(id) FROM sessions), 1));

INSERT INTO erp_branches (
  id, company_id, name, branch_code, phone, cell, address, status,
  provisional_details, tel_no, email, website, main_logo, second_logo,
  short_name, created_by, created_at, updated_at
)
VALUES
  (1, 1, 'TechRive Main Campus - Islamabad', 'BR-ISB-01', '051-111-222-333', '0300-1112233',
   'F-8 Markaz, Islamabad', 1, 'Main campus operations', '051-111-222-333',
   'islamabad@techrive.edu.pk', 'https://techrive.edu.pk', 0, 0, 'ISB', 1, NOW(), NOW()),
  (2, 1, 'TechRive City Campus - Lahore', 'BR-LHR-01', '042-111-444-555', '0300-4445566',
   'Gulberg III, Lahore', 1, 'City campus operations', '042-111-444-555',
   'lahore@techrive.edu.pk', 'https://techrive.edu.pk', 0, 0, 'LHR', 1, NOW(), NOW()),
  (3, 1, 'TechRive North Campus - Rawalpindi', 'BR-RWP-01', '051-111-666-777', '0300-6667788',
   'Saddar, Rawalpindi', 1, 'North campus operations', '051-111-666-777',
   'rawalpindi@techrive.edu.pk', 'https://techrive.edu.pk', 0, 0, 'RWP', 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  branch_code = EXCLUDED.branch_code,
  status = 1,
  deleted_at = NULL,
  updated_at = NOW();
SELECT setval(pg_get_serial_sequence('erp_branches', 'id'), GREATEST((SELECT MAX(id) FROM erp_branches), 1));

INSERT INTO boards (id, name, status, created_by, created_at, updated_at, session_id, branch_id, board)
VALUES
  (1, 'Federal Board of Intermediate & Secondary Education', 'Active', 1, NOW(), NOW(), 2, 1, 'FBISE'),
  (2, 'Board of Intermediate & Secondary Education Lahore', 'Active', 1, NOW(), NOW(), 2, 2, 'BISE Lahore'),
  (3, 'Cambridge International Assessment', 'Active', 1, NOW(), NOW(), 2, 1, 'Cambridge'),
  (4, 'Board of Intermediate & Secondary Education Punjab', 'Active', 1, NOW(), NOW(), 2, 1, 'BISE Punjab'),
  (5, 'Board of Intermediate & Secondary Education Karachi / Sindh', 'Active', 1, NOW(), NOW(), 2, 2, 'BISE Sindh'),
  (6, 'International Baccalaureate (IB)', 'Active', 1, NOW(), NOW(), 2, 1, 'IB')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = 'Active',
  board = EXCLUDED.board,
  deleted_at = NULL,
  updated_at = NOW();
SELECT setval(pg_get_serial_sequence('boards', 'id'), GREATEST((SELECT MAX(id) FROM boards), 1));

INSERT INTO classes (id, name, class_code, description, status, created_by, created_at, updated_at)
VALUES
  (1, 'Grade 9', 'CLS-09', 'Secondary Grade 9', 'Active', 1, NOW(), NOW()),
  (2, 'Grade 10', 'CLS-10', 'Secondary Grade 10', 'Active', 1, NOW(), NOW()),
  (3, 'Grade 11 / First Year', 'CLS-11', 'Intermediate Part I', 'Active', 1, NOW(), NOW()),
  (4, 'Grade 12 / Second Year', 'CLS-12', 'Intermediate Part II', 'Active', 1, NOW(), NOW()),
  (5, 'O Level Year 1', 'CLS-OL1', 'Cambridge O Level Year 1', 'Active', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('classes', 'id'), GREATEST((SELECT MAX(id) FROM classes), 1));

INSERT INTO programs (
  id, tier_id, name, branch_id, session_id, board_id, code, program,
  description, years, status, basic_fee, created_by, created_at, updated_at
)
VALUES
  (1, 1, 'Matric Science', 1, 2, 1, 'PRG-MAT-SCI', 'Matric Science',
   'Secondary school science track', 2, 1, '45000', 1, NOW(), NOW()),
  (2, 1, 'Intermediate Pre-Engineering', 1, 2, 1, 'PRG-FSC-ENG', 'FSc Pre-Engineering',
   'Higher secondary pre-engineering', 2, 1, '65000', 1, NOW(), NOW()),
  (3, 1, 'Intermediate Pre-Medical', 2, 2, 2, 'PRG-FSC-MED', 'FSc Pre-Medical',
   'Higher secondary pre-medical', 2, 1, '65000', 1, NOW(), NOW()),
  (4, 2, 'Cambridge O Level', 1, 2, 3, 'PRG-OL', 'O Level',
   'Cambridge O Level programme', 2, 1, '120000', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('programs', 'id'), GREATEST((SELECT MAX(id) FROM programs), 1));

INSERT INTO intake (id, name, description, created_at, updated_at)
VALUES
  (1, 'Fall 2025', 'Autumn / Fall intake 2025', NOW(), NOW()),
  (2, 'Spring 2026', 'Spring intake 2026', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('intake', 'id'), GREATEST((SELECT MAX(id) FROM intake), 1));

-- Sections are required by Student Enrollment lookups and were not in Module 1
INSERT INTO sections (id, name, description, status, created_by, created_at, updated_at)
VALUES
  (1, 'Section A', 'Morning section A', 'Active', 1, NOW(), NOW()),
  (2, 'Section B', 'Morning section B', 'Active', 1, NOW(), NOW()),
  (3, 'Section C', 'Afternoon section C', 'Active', 1, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = 'Active',
  deleted_at = NULL,
  updated_at = NOW();
SELECT setval(pg_get_serial_sequence('sections', 'id'), GREATEST((SELECT MAX(id) FROM sections), 1));

-- Active session offerings used by Student Enrollment lookups / create flow
-- ON CONFLICT DO UPDATE ensures rows stay Active and linked correctly if re-seeded
INSERT INTO active_sessions (
  id, title, session_id, board_id, branch_id, program_id, class_id, intake_id,
  status, created_at, updated_at
)
VALUES
  (1, 'ISB Matric Science — Session 2025-26', 2, 1, 1, 1, 1, 1, 'Active', NOW(), NOW()),
  (2, 'ISB FSc Pre-Engineering — Session 2025-26', 2, 1, 1, 2, 3, 1, 'Active', NOW(), NOW()),
  (3, 'LHR FSc Pre-Medical — Session 2025-26', 2, 2, 2, 3, 3, 1, 'Active', NOW(), NOW()),
  (4, 'ISB Cambridge O Level — Session 2025-26', 2, 3, 1, 4, 5, 1, 'Active', NOW(), NOW()),
  (5, 'RWP Matric Science — Session 2025-26', 2, 1, 3, 1, 1, 1, 'Active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  session_id = EXCLUDED.session_id,
  board_id = EXCLUDED.board_id,
  branch_id = EXCLUDED.branch_id,
  program_id = EXCLUDED.program_id,
  class_id = EXCLUDED.class_id,
  intake_id = EXCLUDED.intake_id,
  status = 'Active',
  deleted_at = NULL,
  updated_at = NOW();
SELECT setval(pg_get_serial_sequence('active_sessions', 'id'), GREATEST((SELECT MAX(id) FROM active_sessions), 1));

INSERT INTO active_session_sections (
  id, active_session_id, section_id, created_at, updated_at
)
VALUES
  (1, 1, 1, NOW(), NOW()),
  (2, 1, 2, NOW(), NOW()),
  (3, 2, 1, NOW(), NOW()),
  (4, 2, 3, NOW(), NOW()),
  (5, 3, 1, NOW(), NOW()),
  (6, 3, 2, NOW(), NOW()),
  (7, 4, 1, NOW(), NOW()),
  (8, 4, 2, NOW(), NOW()),
  (9, 5, 1, NOW(), NOW()),
  (10, 5, 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  active_session_id = EXCLUDED.active_session_id,
  section_id = EXCLUDED.section_id,
  updated_at = NOW();
SELECT setval(pg_get_serial_sequence('active_session_sections', 'id'), GREATEST((SELECT MAX(id) FROM active_session_sections), 1));

INSERT INTO fee_terms (
  id, branch_id, session_id, program_id, term_number, term_title, term_date,
  status, created_by, board_id, class_id, group_id,
  starting_date, ending_date, intake_id, created_at, updated_at
)
VALUES
  (1, 1, 2, 1, 1, 'Monthly',       '2025-09-01', '1', 1, 1, 1, 0, '2025-09-01', '2026-06-30', 1, NOW(), NOW()),
  (2, 1, 2, 1, 1, 'Quarterly',     '2025-09-01', '1', 1, 1, 1, 0, '2025-09-01', '2026-06-30', 1, NOW(), NOW()),
  (3, 1, 2, 2, 1, 'Semester-wise', '2025-09-01', '1', 1, 1, 3, 0, '2025-09-01', '2026-01-31', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('fee_terms', 'id'), GREATEST((SELECT MAX(id) FROM fee_terms), 1));

INSERT INTO installment_plans (
  id, session_id, branch_id, program_id, class_id, fee_term_id,
  installment_no, installment_date, name, total_days, description, status,
  created_by, group_id, intake_id, board_id, created_at, updated_at
)
VALUES
  (1, 2, 1, 1, 1, 1, 1, '2025-09-05', 'September Installment', '30', 'First monthly installment', '1', 1, 0, 1, 1, NOW(), NOW()),
  (2, 2, 1, 1, 1, 1, 2, '2025-10-05', 'October Installment',   '30', 'Second monthly installment', '1', 1, 0, 1, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('installment_plans', 'id'), GREATEST((SELECT MAX(id) FROM installment_plans), 1));

CREATE TABLE IF NOT EXISTS fee_section_print_ids (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  status VARCHAR(191) DEFAULT '1',
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  last_updated_by INTEGER
);

INSERT INTO fee_section_print_ids (id, title, status, created_at, updated_at)
VALUES
  (1, 'Academic Fees', '1', NOW(), NOW()),
  (2, 'Facility Fees', '1', NOW(), NOW()),
  (3, 'Examination Fees', '1', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('fee_section_print_ids', 'id'), GREATEST((SELECT MAX(id) FROM fee_section_print_ids), 1));

INSERT INTO fee_sections (
  id, branch_id, session_id, title, slug, type, status,
  created_by, fee_section_print_id, created_at, updated_at
)
VALUES
  (1, 1, 2, 'Academic Fees', 'academic-fees', 1, '1', 1, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO fee_heads (
  id, branch_id, board_id, session_id, program_id, fee_section_id,
  fee_head_desc, dividable, fee_head_title, slug, status,
  created_by, rec_group_id, erp_branch_id, class_id, intake_id,
  created_at, updated_at
)
VALUES
  (1, 1, 1, 2, 1, 1, 'Regular monthly tuition charges', 1, 'Tuition', 'tuition', 1, 1, '0', 1, 0, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO fee_structures (
  id, created_at, updated_at, branch_id, session_id, program_id, term_id,
  fee_structure_code, fee_head_id, fee_amount, status, last_updated_by,
  class_id, board_id, intake_id, annual_minimum, monthly_minimum, description
)
VALUES
  (1, NOW(), NOW(), 1, 2, 1, 1, '1001', 1, 15000.00, 1, 1, 1, 1, 1, 12000, 12000, 'Grade 9 Matric Science — Islamabad')
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('fee_structures', 'id'), GREATEST((SELECT MAX(id) FROM fee_structures), 1));

-- ─── Enrollment students ─────────────────────────────────────────────────────
INSERT INTO students (
  id, reg_no, walkin_reg_no, first_name, last_name, email, mobile_1, gender,
  branch_id, board_id, program_id, class_id, section_id, intake_id, session_id,
  registered_session, active_session_id, active_session_section_id,
  academic_group_id, status, sos_status,
  admission_status, academic_status, reg_date, disability, created_by, created_at, updated_at
)
VALUES
  (101, 'WI-2026-0001', 'WI-2026-0001', 'Sara', 'Malik',
   'sara.malik@student.techrive.edu.pk', '03001235101', 'Female',
   1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 'Active', 'Active',
   'Walk-in', 'Pending', '2026-08-01', 0, 1, NOW(), NOW()),
  (102, 'WI-2026-0002', 'WI-2026-0002', 'Usman', 'Tariq',
   'usman.tariq@student.techrive.edu.pk', '03001235102', 'Male',
   1, 1, 1, 1, 2, 1, 2, 2, 1, 2, 1, 'Active', 'Active',
   'Walk-in', 'Pending', '2026-08-02', 0, 1, NOW(), NOW()),
  (103, 'WI-2026-0003', 'WI-2026-0003', 'Zainab', 'Noor',
   'zainab.noor@student.techrive.edu.pk', '03001235103', 'Female',
   1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 'Active', 'Active',
   'Walk-in', 'Pending', '2026-08-03', 0, 1, NOW(), NOW()),
  (104, 'WI-2026-0004', 'WI-2026-0004', 'Hamza', 'Qureshi',
   'hamza.qureshi@student.techrive.edu.pk', '03001235104', 'Male',
   1, 1, 1, 1, 2, 1, 2, 2, 1, 2, 1, 'Active', 'Active',
   'Registered', 'Registered', '2026-07-15', 0, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('students', 'id'), GREATEST((SELECT MAX(id) FROM students), 1));

INSERT INTO active_session_students (
  id, active_session_section_id, student_id, academics_group_id, tuition_fee, status,
  created_at, updated_at
)
VALUES
  (101, 1, 101, 1, 0, 1, NOW(), NOW()),
  (102, 2, 102, 1, 0, 1, NOW(), NOW()),
  (103, 1, 103, 1, 0, 1, NOW(), NOW()),
  (104, 2, 104, 1, 0, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('active_session_students', 'id'), GREATEST((SELECT MAX(id) FROM active_session_students), 1));

-- ─── Fee assignment for unpaid Walk-in (102) ─────────────────────────────────
INSERT INTO student_fee_settings (id, student_id, program_id, installment_id, basic_fee, discount, status, created_at, updated_at)
VALUES
  (102, 102, 1, 1, '27000', '0', '1', NOW(), NOW()),
  (103, 103, 1, 1, '27000', '0', '1', NOW(), NOW()),
  (104, 104, 1, 1, '27000', '0', '1', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('student_fee_settings', 'id'), GREATEST((SELECT MAX(id) FROM student_fee_settings), 1));

INSERT INTO fee_master_basics (
  id, branch_id, session_id, student_id, program_id, installment_id, fee_structure_code, fee_type,
  bill_no, basic_fee, total_fee, discount_fee, total_after_discount, discount_type,
  special_discount_comment, voucher_date, fee_due_date_start, fee_due_date_end, status,
  created_by, class_id, intake_id, board_id, created_at, updated_at
)
VALUES
  (101, 1, 2, 102, 1, 1, 1001, 3, 'BILL-ENR-USMAN', '27000', '27000', '0', '27000', 1,
   NULL, '2026-08-02', '2026-08-02', '2026-09-30', '1', 1, 1, 1, 1, NOW(), NOW()),
  (102, 1, 2, 103, 1, 1, 1001, 3, 'BILL-ENR-ZAINAB', '27000', '27000', '0', '27000', 1,
   NULL, '2026-08-03', '2026-08-03', '2026-08-31', '1', 1, 1, 1, 1, NOW(), NOW()),
  (103, 1, 2, 104, 1, 1, 1001, 3, 'BILL-ENR-HAMZA', '27000', '27000', '0', '27000', 1,
   NULL, '2026-07-15', '2026-07-15', '2026-07-31', '1', 1, 1, 1, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('fee_master_basics', 'id'), GREATEST((SELECT MAX(id) FROM fee_master_basics), 1));

INSERT INTO fee_masters (
  id, branch_id, session_id, program_id, students_id, fee_head, fee_structure_code, fee_head_term,
  fee_amount, fee_discount_percentage, fee_discount_comment, scholarship, scholarship_no_of_a,
  discount_type, status, created_by, class_id, fee_master_basic_id, fee_master_basic_id_fk,
  fee_paid_amount, board_id, intake_id, created_at, updated_at
)
VALUES
  -- Usman unpaid
  (101, 1, 2, 1, 102, 'Tuition', 1001, 1, 15000, 0, NULL, 0, 0, 1, 1, 1, 1, '101', 101, 0, 1, 1, NOW(), NOW()),
  (102, 1, 2, 1, 102, 'Lab', 1001, 1, 2500, 0, NULL, 0, 0, 1, 1, 1, 1, '101', 101, 0, 1, 1, NOW(), NOW()),
  (103, 1, 2, 1, 102, 'Library', 1001, 1, 1500, 0, NULL, 0, 0, 1, 1, 1, 1, '101', 101, 0, 1, 1, NOW(), NOW()),
  (104, 1, 2, 1, 102, 'Exam', 1001, 1, 3000, 0, NULL, 0, 0, 1, 1, 1, 1, '101', 101, 0, 1, 1, NOW(), NOW()),
  (105, 1, 2, 1, 102, 'Annual', 1001, 1, 5000, 0, NULL, 0, 0, 1, 1, 1, 1, '101', 101, 0, 1, 1, NOW(), NOW()),
  -- Zainab fully paid (Walk-in ready for fee verification)
  (106, 1, 2, 1, 103, 'Tuition', 1001, 1, 15000, 0, NULL, 0, 0, 1, 1, 1, 1, '102', 102, 15000, 1, 1, NOW(), NOW()),
  (107, 1, 2, 1, 103, 'Lab', 1001, 1, 2500, 0, NULL, 0, 0, 1, 1, 1, 1, '102', 102, 2500, 1, 1, NOW(), NOW()),
  (108, 1, 2, 1, 103, 'Library', 1001, 1, 1500, 0, NULL, 0, 0, 1, 1, 1, 1, '102', 102, 1500, 1, 1, NOW(), NOW()),
  (109, 1, 2, 1, 103, 'Exam', 1001, 1, 3000, 0, NULL, 0, 0, 1, 1, 1, 1, '102', 102, 3000, 1, 1, NOW(), NOW()),
  (110, 1, 2, 1, 103, 'Annual', 1001, 1, 5000, 0, NULL, 0, 0, 1, 1, 1, 1, '102', 102, 5000, 1, 1, NOW(), NOW()),
  -- Hamza fully paid (already Registered)
  (111, 1, 2, 1, 104, 'Tuition', 1001, 1, 15000, 0, NULL, 0, 0, 1, 1, 1, 1, '103', 103, 15000, 1, 1, NOW(), NOW()),
  (112, 1, 2, 1, 104, 'Lab', 1001, 1, 2500, 0, NULL, 0, 0, 1, 1, 1, 1, '103', 103, 2500, 1, 1, NOW(), NOW()),
  (113, 1, 2, 1, 104, 'Library', 1001, 1, 1500, 0, NULL, 0, 0, 1, 1, 1, 1, '103', 103, 1500, 1, 1, NOW(), NOW()),
  (114, 1, 2, 1, 104, 'Exam', 1001, 1, 3000, 0, NULL, 0, 0, 1, 1, 1, 1, '103', 103, 3000, 1, 1, NOW(), NOW()),
  (115, 1, 2, 1, 104, 'Annual', 1001, 1, 5000, 0, NULL, 0, 0, 1, 1, 1, 1, '103', 103, 5000, 1, 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('fee_masters', 'id'), GREATEST((SELECT MAX(id) FROM fee_masters), 1));

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
  (201, 1, 2, 103, 106, 1001, 'BILL-ENR-ZAINAB', '1', '2026-08-31', '2026-08-10',
   27000, '2026-08-10', 0, 1, 0, 0, 27000, 'Cash',
   'Enrollment seed full payment', 2, 0, 1, 1, NOW(), NOW(),
   'PAY-ENR-201', '2026-08-31', 0, 1, 1, 1, 1, 0,
   'Enrollment seed', 1, 'No', 'Full Payment', 0, 1),
  (202, 1, 2, 104, 111, 1001, 'BILL-ENR-HAMZA', '1', '2026-07-31', '2026-07-20',
   27000, '2026-07-20', 0, 1, 0, 0, 27000, 'Bank Transfer',
   'Enrollment seed registered payment', 2, 0, 1, 1, NOW(), NOW(),
   'PAY-ENR-202', '2026-07-31', 0, 1, 1, 1, 1, 0,
   'Enrollment seed', 1, 'No', 'Full Payment', 0, 1)
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('fee_collections', 'id'), GREATEST((SELECT MAX(id) FROM fee_collections), 1));

INSERT INTO fee_collection_detail (
  id, fc_id, branch_id, board_id, program_id, student_id, class_id, intake_id,
  session_id, bill_id, fee_head_id, fee_term_id, amount, remarks, created_at, arreas
)
VALUES
  (201, 201, 1, 1, 1, 103, 1, 1, 2, 102, 1, 1, 27000, 'Cash · PAY-ENR-201', NOW(), 0),
  (202, 202, 1, 1, 1, 104, 1, 1, 2, 103, 1, 1, 27000, 'Bank Transfer · PAY-ENR-202', NOW(), 0)
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('fee_collection_detail', 'id'), GREATEST((SELECT MAX(id) FROM fee_collection_detail), 1));

COMMIT;

SELECT 'students_walkin_registered' AS check_name, id, first_name, admission_status, walkin_reg_no
FROM students
WHERE id BETWEEN 101 AND 104
ORDER BY id;

SELECT 'sections' AS table_name, COUNT(*)::int AS total_rows FROM sections
UNION ALL SELECT 'active_sessions', COUNT(*)::int FROM active_sessions WHERE id BETWEEN 1 AND 5
UNION ALL SELECT 'active_session_sections', COUNT(*)::int FROM active_session_sections WHERE id BETWEEN 1 AND 10
UNION ALL SELECT 'active_session_students_enr', COUNT(*)::int FROM active_session_students WHERE id BETWEEN 101 AND 104
UNION ALL SELECT 'boards', COUNT(*)::int FROM boards WHERE id BETWEEN 1 AND 6
UNION ALL SELECT 'students_101_104', COUNT(*)::int FROM students WHERE id BETWEEN 101 AND 104
UNION ALL SELECT 'fee_master_basics_enr', COUNT(*)::int FROM fee_master_basics WHERE id BETWEEN 101 AND 103
UNION ALL SELECT 'fee_collections_enr', COUNT(*)::int FROM fee_collections WHERE id IN (201, 202);
