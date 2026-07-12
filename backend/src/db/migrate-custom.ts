import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

async function runCustomMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connecting to database...");

  // Create sessions table
  console.log("Creating sessions table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "sessions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "refresh_token" text NOT NULL,
      "expires_at" timestamp NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "revoked" boolean DEFAULT false NOT NULL
    );
  `);

  // Create role_permissions table
  console.log("Creating role_permissions table...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "role_permissions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "role" "user_role" NOT NULL UNIQUE,
      "fleet" varchar(10) DEFAULT 'NONE' NOT NULL,
      "drivers" varchar(10) DEFAULT 'NONE' NOT NULL,
      "trips" varchar(10) DEFAULT 'NONE' NOT NULL,
      "fuel_expenses" varchar(10) DEFAULT 'NONE' NOT NULL,
      "analytics" varchar(10) DEFAULT 'NONE' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  console.log("Migration complete!");
  await pool.end();
}

runCustomMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
