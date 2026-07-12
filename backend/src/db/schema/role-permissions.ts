import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: userRoleEnum("role").notNull().unique(),
  fleet: varchar("fleet", { length: 10 }).notNull().default("NONE"), // NONE, VIEW, EDIT
  drivers: varchar("drivers", { length: 10 }).notNull().default("NONE"),
  trips: varchar("trips", { length: 10 }).notNull().default("NONE"),
  maintenance: varchar("maintenance", { length: 10 }).notNull().default("NONE"),
  fuelExpenses: varchar("fuel_expenses", { length: 10 }).notNull().default("NONE"),
  analytics: varchar("analytics", { length: 10 }).notNull().default("NONE"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

