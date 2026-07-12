import "dotenv/config";
import { Pool } from "pg";

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const types = [
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN CREATE TYPE task_priority AS ENUM('LOW','MEDIUM','HIGH','CRITICAL'); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN CREATE TYPE task_status AS ENUM('BACKLOG','TODO','IN_PROGRESS','WAITING_APPROVAL','BLOCKED','COMPLETED'); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN CREATE TYPE task_type AS ENUM('TRIP','MAINTENANCE','INSPECTION','FUEL','EXPENSE','DRIVER','VEHICLE','INCIDENT','COMPLIANCE','DOCUMENT_RENEWAL','GENERAL_TASK'); END IF; END $$;`,
    ];
    for (const t of types) {
      await pool.query(t);
    }
    console.log("Types created");

    const tables = [
      `CREATE TABLE IF NOT EXISTS task_labels (id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, color text DEFAULT '#6366f1' NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, title text NOT NULL, description text, status task_status DEFAULT 'BACKLOG' NOT NULL, priority task_priority DEFAULT 'MEDIUM' NOT NULL, task_type task_type DEFAULT 'GENERAL_TASK' NOT NULL, assigned_user_id uuid, created_by_id uuid NOT NULL, due_date timestamp, estimated_hours integer, vehicle_id uuid, driver_id uuid, trip_id uuid, maintenance_id uuid, archived boolean DEFAULT false NOT NULL, completed_at timestamp, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS task_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, task_id uuid NOT NULL, author_id uuid NOT NULL, content text NOT NULL, edited boolean DEFAULT false NOT NULL, parent_id uuid, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS task_checklists (id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, task_id uuid NOT NULL, content text NOT NULL, completed boolean DEFAULT false NOT NULL, position integer DEFAULT 0 NOT NULL, created_at timestamp DEFAULT now() NOT NULL, updated_at timestamp DEFAULT now() NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS task_attachments (id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, task_id uuid NOT NULL, uploaded_by_id uuid NOT NULL, file_name text NOT NULL, file_type text NOT NULL, file_size integer NOT NULL, file_url text NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS task_to_labels (id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, task_id uuid NOT NULL, label_id uuid NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS task_watchers (id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, task_id uuid NOT NULL, user_id uuid NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS task_history (id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, task_id uuid NOT NULL, user_id uuid NOT NULL, action text NOT NULL, field text, old_value text, new_value text, created_at timestamp DEFAULT now() NOT NULL)`,
    ];
    for (const table of tables) {
      await pool.query(table);
    }
    console.log("Tables created");

    const constraints = [
      `ALTER TABLE task_attachments ADD CONSTRAINT IF NOT EXISTS task_attachments_task_id_fk FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE cascade`,
      `ALTER TABLE task_attachments ADD CONSTRAINT IF NOT EXISTS task_attachments_uploaded_by_id_fk FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE cascade`,
      `ALTER TABLE task_checklists ADD CONSTRAINT IF NOT EXISTS task_checklists_task_id_fk FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE cascade`,
      `ALTER TABLE task_comments ADD CONSTRAINT IF NOT EXISTS task_comments_task_id_fk FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE cascade`,
      `ALTER TABLE task_comments ADD CONSTRAINT IF NOT EXISTS task_comments_author_id_fk FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE cascade`,
      `ALTER TABLE task_comments ADD CONSTRAINT IF NOT EXISTS task_comments_parent_id_fk FOREIGN KEY (parent_id) REFERENCES task_comments(id) ON DELETE cascade`,
      `ALTER TABLE task_history ADD CONSTRAINT IF NOT EXISTS task_history_task_id_fk FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE cascade`,
      `ALTER TABLE task_history ADD CONSTRAINT IF NOT EXISTS task_history_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade`,
      `ALTER TABLE task_to_labels ADD CONSTRAINT IF NOT EXISTS task_to_labels_task_id_fk FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE cascade`,
      `ALTER TABLE task_to_labels ADD CONSTRAINT IF NOT EXISTS task_to_labels_label_id_fk FOREIGN KEY (label_id) REFERENCES task_labels(id) ON DELETE cascade`,
      `ALTER TABLE task_watchers ADD CONSTRAINT IF NOT EXISTS task_watchers_task_id_fk FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE cascade`,
      `ALTER TABLE task_watchers ADD CONSTRAINT IF NOT EXISTS task_watchers_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade`,
      `ALTER TABLE tasks ADD CONSTRAINT IF NOT EXISTS tasks_assigned_user_id_fk FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE set null`,
      `ALTER TABLE tasks ADD CONSTRAINT IF NOT EXISTS tasks_created_by_id_fk FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE cascade`,
      `ALTER TABLE tasks ADD CONSTRAINT IF NOT EXISTS tasks_vehicle_id_fk FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE set null`,
      `ALTER TABLE tasks ADD CONSTRAINT IF NOT EXISTS tasks_driver_id_fk FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE set null`,
      `ALTER TABLE tasks ADD CONSTRAINT IF NOT EXISTS tasks_trip_id_fk FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE set null`,
      `ALTER TABLE tasks ADD CONSTRAINT IF NOT EXISTS tasks_maintenance_id_fk FOREIGN KEY (maintenance_id) REFERENCES maintenance_logs(id) ON DELETE set null`,
    ];
    for (const c of constraints) {
      await pool.query(c).catch(() => {});
    }
    console.log("Constraints added");
  } catch (e) {
    console.error("Error:", e);
  }

  await pool.end();
}

run();
