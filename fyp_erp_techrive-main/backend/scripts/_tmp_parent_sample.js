const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const text = fs.readFileSync(path.join(__dirname, "..", ".env"), "utf8");
const line = text.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
let url = line.slice("DATABASE_URL=".length).trim();
if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
  url = url.slice(1, -1);
}
const client = new Client({ connectionString: url });
client
  .connect()
  .then(() =>
    client.query(`
      SELECT id,
        father_first_name, char_length(coalesce(father_first_name,'')) AS father_fn_len,
        father_occupation, char_length(coalesce(father_occupation,'')) AS father_occ_len,
        father_mobile_1, char_length(coalesce(father_mobile_1,'')) AS father_mob_len,
        mother_cnic, char_length(coalesce(mother_cnic,'')) AS mother_cnic_len,
        guardian_email, char_length(coalesce(guardian_email,'')) AS guardian_email_len
      FROM parent_details
      WHERE deleted_at IS NULL
      ORDER BY id DESC
      LIMIT 8
    `)
  )
  .then((r) => {
    console.log(JSON.stringify(r.rows, null, 2));
    return client.end();
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
