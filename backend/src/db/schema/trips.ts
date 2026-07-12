import { pgTable, uuid, text, real, timestamp } from "drizzle-orm/pg-core";
import { tripStatusEnum } from "./enums";
import { vehicles } from "./vehicles";
import { drivers } from "./drivers";

export const trips = pgTable("trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  cargoWeightKg: real("cargo_weight_kg").notNull(),
  distanceKm: real("distance_km").notNull(),
  status: tripStatusEnum("status").notNull().default("DRAFT"),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  driverId: uuid("driver_id")
    .notNull()
    .references(() => drivers.id),
  finalOdometerKm: real("final_odometer_km"),
  fuelUsedLiters: real("fuel_used_liters"),
  fuelCost: real("fuel_cost"),
  tollCost: real("toll_cost"),
  otherExpenses: real("other_expenses"),
  revenue: real("revenue"),
  dispatchedAt: timestamp("dispatched_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
