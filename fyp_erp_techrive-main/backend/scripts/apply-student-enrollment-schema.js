/**
 * Apply Student Enrollment schema alters only (non-destructive).
 * Does not print DATABASE_URL.
 */
require("dotenv").config();
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "..", "student-enrollment-schema-alter.sql"),
    "utf8"
  );
  await c.query(sql);
  const cols = await c.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE (table_name = 'students' AND column_name IN ('disability', 'disability_description'))
       OR (table_name = 'parent_details' AND column_name IN (
            'father_is_staff','father_staff_ref',
            'mother_is_staff','mother_staff_ref',
            'guardian_is_staff','guardian_staff_ref'
          ))
    ORDER BY table_name, column_name
  `);
  console.log("columns_ok", cols.rows.length);
  cols.rows.forEach((r) => console.log(`${r.table_name}.${r.column_name}`));
  await c.end();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});
