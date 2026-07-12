import { pgTable, uuid, varchar, real, timestamp } from "drizzle-orm/pg-core";
import { driverStatusEnum } from "./enums";

export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  licenseNumber: varchar("license_number", { length: 20 }).notNull().unique(),
  licenseCategory: varchar("license_category", { length: 50 }).notNull(),
  licenseExpiry: timestamp("license_expiry", { mode: "date" }).notNull(),
  contactNumber: varchar("contact_number", { length: 20 }).notNull(),
  safetyScore: real("safety_score").notNull().default(100),
  status: driverStatusEnum("status").notNull().default("AVAILABLE"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
