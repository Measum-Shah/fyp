/**
 * Apply EOBI/EPF Register schema alters (eobi_amount / epf_amount columns,
 * drop amount / month / year). Does not print DATABASE_URL.
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
    path.join(__dirname, "..", "..", "eobi-epf-register-schema-alter.sql"),
    "utf8"
  );
  await c.query(sql);
  const cols = await c.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'eobi_epf_register'
    ORDER BY column_name
  `);
  console.log("columns_ok", cols.rows.length);
  cols.rows.forEach((r) => console.log(`eobi_epf_register.${r.column_name}`));
  await c.end();
})().catch((e) => {
  console.error("ERR", e.message);
  process.exit(1);
});