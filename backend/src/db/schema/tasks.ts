import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { taskStatusEnum, taskPriorityEnum, taskTypeEnum } from "./enums";
import { users } from "./users";
import { vehicles } from "./vehicles";
import { drivers } from "./drivers";
import { trips } from "./trips";
import { maintenanceLogs } from "./maintenance-logs";

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("BACKLOG"),
  priority: taskPriorityEnum("priority").notNull().default("MEDIUM"),
  taskType: taskTypeEnum("task_type").notNull().default("GENERAL_TASK"),
  assignedUserId: uuid("assigned_user_id").references(() => users.id, { onDelete: "set null" }),
  createdById: uuid("created_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dueDate: timestamp("due_date", { mode: "date" }),
  estimatedHours: integer("estimated_hours"),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
  driverId: uuid("driver_id").references(() => drivers.id, { onDelete: "set null" }),
  tripId: uuid("trip_id").references(() => trips.id, { onDelete: "set null" }),
  maintenanceId: uuid("maintenance_id").references(() => maintenanceLogs.id, { onDelete: "set null" }),
  archived: boolean("archived").notNull().default(false),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
