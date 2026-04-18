require("dotenv/config");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const TAGS = [
  "Web App", "Mobile App", "AI / ML", "Dev Tool", "SaaS",
  "Open Source", "API", "CLI", "Design", "Analytics",
  "Productivity", "E-commerce", "Education", "Game", "Finance",
];

async function main() {
  for (const name of TAGS) {
    const id = require("crypto").randomUUID();
    await pool.query(
      "INSERT INTO tag (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
      [id, name]
    );
  }
  console.log("Tags seeded:", TAGS.length);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
