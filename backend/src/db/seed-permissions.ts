import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

async function seedPermissions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Seeding role_permissions table...");

  const query = `
    INSERT INTO "role_permissions" ("role", "fleet", "drivers", "trips", "fuel_expenses", "analytics")
    VALUES 
      ('FLEET_MANAGER', 'EDIT', 'NONE', 'NONE', 'NONE', 'NONE'),
      ('DISPATCHER', 'VIEW', 'VIEW', 'EDIT', 'NONE', 'NONE'),
      ('SAFETY_OFFICER', 'NONE', 'EDIT', 'NONE', 'VIEW', 'NONE'),
      ('FINANCIAL_ANALYST', 'NONE', 'NONE', 'NONE', 'EDIT', 'EDIT')
    ON CONFLICT ("role") DO UPDATE SET
      "fleet" = EXCLUDED."fleet",
      "drivers" = EXCLUDED."drivers",
      "trips" = EXCLUDED."trips",
      "fuel_expenses" = EXCLUDED."fuel_expenses",
      "analytics" = EXCLUDED."analytics";
  `;

  await pool.query(query);
  console.log("Role permissions seeded successfully!");
  await pool.end();
}

seedPermissions().catch((err) => {
  console.error("Failed to seed permissions:", err);
  process.exit(1);
});
