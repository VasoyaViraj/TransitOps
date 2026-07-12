import { relations } from "drizzle-orm";
import { users } from "./schema/users";
import { vehicles } from "./schema/vehicles";
import { drivers } from "./schema/drivers";
import { trips } from "./schema/trips";
import { maintenanceLogs } from "./schema/maintenance-logs";
import { fuelLogs } from "./schema/fuel-logs";
import { expenses } from "./schema/expenses";

export const vehicleRelations = relations(vehicles, ({ many }) => ({
  trips: many(trips),
  maintenanceLogs: many(maintenanceLogs),
  fuelLogs: many(fuelLogs),
}));

export const driverRelations = relations(drivers, ({ many }) => ({
  trips: many(trips),
}));

export const tripRelations = relations(trips, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [trips.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [trips.driverId],
    references: [drivers.id],
  }),
  fuelLogs: many(fuelLogs),
  expenses: many(expenses),
}));

export const maintenanceLogRelations = relations(maintenanceLogs, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [maintenanceLogs.vehicleId],
    references: [vehicles.id],
  }),
}));

export const fuelLogRelations = relations(fuelLogs, ({ one }) => ({
  trip: one(trips, {
    fields: [fuelLogs.tripId],
    references: [trips.id],
  }),
  vehicle: one(vehicles, {
    fields: [fuelLogs.vehicleId],
    references: [vehicles.id],
  }),
}));

export const expenseRelations = relations(expenses, ({ one }) => ({
  trip: one(trips, {
    fields: [expenses.tripId],
    references: [trips.id],
  }),
}));
