import { pgTable, uuid, varchar, real, timestamp } from "drizzle-orm/pg-core";
import { vehicleStatusEnum } from "./enums";

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationNumber: varchar("registration_number", { length: 20 }).notNull().unique(),
  model: varchar("model", { length: 255 }).notNull(),
  capacityKg: real("capacity_kg").notNull(),
  odometerKm: real("odometer_km").notNull().default(0),
  acquisitionCost: real("acquisition_cost").notNull(),
  status: vehicleStatusEnum("status").notNull().default("AVAILABLE"),
  purchaseDate: timestamp("purchase_date", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
