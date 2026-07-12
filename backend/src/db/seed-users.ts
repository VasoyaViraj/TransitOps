import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Running seed v2...");

  // 1. Add type column to vehicles if not exists
  console.log("Adding type column to vehicles...");
  await pool.query(`
    ALTER TABLE vehicles 
    ADD COLUMN IF NOT EXISTS "type" varchar(50) NOT NULL DEFAULT 'VAN';
  `);

  // 2. Seed demo users for all roles
  console.log("Seeding demo users...");
  const pw = await bcrypt.hash("password123", 12);
  const adminPw = await bcrypt.hash("admin123", 12);

  const users = [
    { email: "admin@transitops.com", password: adminPw, name: "Admin", role: "ADMIN" },
    { email: "fleet@transitops.com", password: pw, name: "Fleet Manager", role: "FLEET_MANAGER" },
    { email: "dispatch@transitops.com", password: pw, name: "Dispatcher", role: "DISPATCHER" },
    { email: "safety@transitops.com", password: pw, name: "Safety Officer", role: "SAFETY_OFFICER" },
    { email: "analyst@transitops.com", password: pw, name: "Financial Analyst", role: "FINANCIAL_ANALYST" },
  ];

  for (const u of users) {
    await pool.query(
      `INSERT INTO users (email, password, name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET role = $4, password = $2, name = $3`,
      [u.email, u.password, u.name, u.role]
    );
  }

  console.log("Seed complete!");
  console.log("Demo users:");
  users.forEach((u) => console.log(`  ${u.role}: ${u.email} / ${u.role === "ADMIN" ? "admin123" : "password123"}`));
  
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
