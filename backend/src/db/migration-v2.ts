import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Running migration...");

  // 1. Add ADMIN to user_role enum if not exists
  console.log("Adding ADMIN to user_role enum...");
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'ADMIN'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
      ) THEN
        ALTER TYPE user_role ADD VALUE 'ADMIN';
      END IF;
    END$$;
  `);

  // 2. Add maintenance column to role_permissions if not exists
  console.log("Adding maintenance column to role_permissions...");
  await pool.query(`
    ALTER TABLE role_permissions 
    ADD COLUMN IF NOT EXISTS "maintenance" varchar(10) NOT NULL DEFAULT 'NONE';
  `);

  // 3. Seed admin user
  console.log("Seeding admin user...");
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await pool.query(`
    INSERT INTO users (email, password, name, role)
    VALUES ('admin@transitops.com', $1, 'Admin', 'ADMIN')
    ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', password = $1;
  `, [hashedPassword]);

  // 4. Update role_permissions with correct defaults including maintenance
  console.log("Seeding role permissions...");
  await pool.query(`
    INSERT INTO role_permissions (role, fleet, drivers, trips, maintenance, fuel_expenses, analytics)
    VALUES 
      ('FLEET_MANAGER', 'EDIT', 'NONE', 'NONE', 'EDIT', 'NONE', 'NONE'),
      ('DISPATCHER',    'VIEW', 'VIEW', 'EDIT', 'NONE', 'NONE', 'NONE'),
      ('SAFETY_OFFICER','NONE', 'EDIT', 'NONE', 'VIEW', 'VIEW', 'NONE'),
      ('FINANCIAL_ANALYST','NONE','NONE','NONE','NONE','EDIT', 'EDIT')
    ON CONFLICT (role) DO UPDATE SET
      fleet = EXCLUDED.fleet,
      drivers = EXCLUDED.drivers,
      trips = EXCLUDED.trips,
      maintenance = EXCLUDED.maintenance,
      fuel_expenses = EXCLUDED.fuel_expenses,
      analytics = EXCLUDED.analytics,
      updated_at = now();
  `);

  console.log("Migration complete!");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
