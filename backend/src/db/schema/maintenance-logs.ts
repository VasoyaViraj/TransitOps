import { pgTable, uuid, text, real, timestamp } from "drizzle-orm/pg-core";
import { maintenanceStatusEnum } from "./enums";
import { vehicles } from "./vehicles";

export const maintenanceLogs = pgTable("maintenance_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  description: text("description").notNull(),
  cost: real("cost").notNull(),
  date: timestamp("date", { mode: "date" }).notNull(),
  status: maintenanceStatusEnum("status").notNull().default("SCHEDULED"),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
