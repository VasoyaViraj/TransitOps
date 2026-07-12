import { pgTable, uuid, real, timestamp } from "drizzle-orm/pg-core";
import { trips } from "./trips";
import { vehicles } from "./vehicles";

export const fuelLogs = pgTable("fuel_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id),
  vehicleId: uuid("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  liters: real("liters").notNull(),
  cost: real("cost").notNull(),
  date: timestamp("date", { mode: "date" }).defaultNow().notNull(),
});
