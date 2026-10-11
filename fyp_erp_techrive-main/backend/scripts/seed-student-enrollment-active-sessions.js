/**
 * Upsert minimum Student Enrollment active-session test data.
 * Non-destructive: ON CONFLICT DO NOTHING / targeted updates only.
 */
require("dotenv").config();
const { Client } = require("pg");

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  await c.query("BEGIN");

  await c.query(`
    INSERT INTO active_sessions (
      id, title, session_id, board_id, branch_id, program_id, class_id, intake_id,
      status, created_at, updated_at
    )
    VALUES
      (1, 'ISB Matric Science — Session 2025-26', 2, 1, 1, 1, 1, 1, 'Active', NOW(), NOW()),
      (2, 'ISB FSc Pre-Engineering — Session 2025-26', 2, 1, 1, 2, 3, 1, 'Active', NOW(), NOW()),
      (3, 'LHR FSc Pre-Medical — Session 2025-26', 2, 2, 2, 3, 3, 1, 'Active', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  await c.query(`
    INSERT INTO active_session_sections (id, active_session_id, section_id, created_at, updated_at)
    VALUES
      (1, 1, 1, NOW(), NOW()),
      (2, 1, 2, NOW(), NOW()),
      (3, 2, 1, NOW(), NOW()),
      (4, 2, 3, NOW(), NOW()),
      (5, 3, 1, NOW(), NOW()),
      (6, 3, 2, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  // Align existing SE seed students (101-104) to ActiveSessions.id if present
  await c.query(`
    UPDATE students SET
      active_session_id = 1,
      active_session_section_id = CASE WHEN id IN (102, 104) THEN 2 ELSE 1 END,
      session_id = 2,
      registered_session = 2,
      updated_at = NOW()
    WHERE id BETWEEN 101 AND 104
  `);

  await c.query(`
    INSERT INTO active_session_students (
      id, active_session_section_id, student_id, academics_group_id, tuition_fee, status,
      created_at, updated_at
    )
    VALUES
      (101, 1, 101, 1, 0, 1, NOW(), NOW()),
      (102, 2, 102, 1, 0, 1, NOW(), NOW()),
      (103, 1, 103, 1, 0, 1, NOW(), NOW()),
      (104, 2, 104, 1, 0, 1, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `);

  await c.query("COMMIT");

  const counts = await c.query(`
    SELECT 'active_sessions' AS t, COUNT(*)::int AS n FROM active_sessions WHERE id BETWEEN 1 AND 3
    UNION ALL SELECT 'active_session_sections', COUNT(*)::int FROM active_session_sections WHERE id BETWEEN 1 AND 6
    UNION ALL SELECT 'active_session_students', COUNT(*)::int FROM active_session_students WHERE id BETWEEN 101 AND 104
  `);
  console.log(counts.rows);
  await c.end();
})().catch(async (e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
