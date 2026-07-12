import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "FLEET_MANAGER",
  "DISPATCHER",
  "SAFETY_OFFICER",
  "FINANCIAL_ANALYST",
]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "AVAILABLE",
  "ON_TRIP",
  "IN_SHOP",
  "RETIRED",
]);

export const driverStatusEnum = pgEnum("driver_status", [
  "AVAILABLE",
  "ON_TRIP",
  "OFF_DUTY",
  "SUSPENDED",
]);

export const tripStatusEnum = pgEnum("trip_status", [
  "DRAFT",
  "DISPATCHED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
]);
