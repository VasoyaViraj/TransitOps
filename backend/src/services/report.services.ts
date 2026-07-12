import { eq, sql, count } from "drizzle-orm";
import { db } from "../db/index.js";
import { vehicles, drivers, trips, fuelLogs, expenses, maintenanceLogs } from "../db/schema/index.js";

export async function getDashboardStats() {
  const [vehicleStats] = await db
    .select({
      total: count(),
    })
    .from(vehicles);

  const [activeVehicles] = await db
    .select({ count: count() })
    .from(vehicles)
    .where(eq(vehicles.status, "ON_TRIP"));

  const [availableVehicles] = await db
    .select({ count: count() })
    .from(vehicles)
    .where(eq(vehicles.status, "AVAILABLE"));

  const [vehiclesInShop] = await db
    .select({ count: count() })
    .from(vehicles)
    .where(eq(vehicles.status, "IN_SHOP"));

  const [retiredVehicles] = await db
    .select({ count: count() })
    .from(vehicles)
    .where(eq(vehicles.status, "RETIRED"));

  const [tripsRunning] = await db
    .select({ count: count() })
    .from(trips)
    .where(eq(trips.status, "DISPATCHED"));

  const [driversOnDuty] = await db
    .select({ count: count() })
    .from(drivers)
    .where(eq(drivers.status, "ON_TRIP"));

  const [totalDrivers] = await db
    .select({ count: count() })
    .from(drivers);

  const totalVehicles = vehicleStats?.count || 0;
  const fleetUtilization = totalVehicles > 0
    ? Math.round(((activeVehicles?.count || 0) / totalVehicles) * 100)
    : 0;

  return {
    activeVehicles: activeVehicles?.count || 0,
    availableVehicles: availableVehicles?.count || 0,
    vehiclesInShop: vehiclesInShop?.count || 0,
    retiredVehicles: retiredVehicles?.count || 0,
    totalVehicles,
    tripsRunning: tripsRunning?.count || 0,
    driversOnDuty: driversOnDuty?.count || 0,
    totalDrivers: totalDrivers?.count || 0,
    fleetUtilization,
  };
}

export async function getFuelEfficiency(vehicleId?: string) {
  const results = await db
    .select({
      tripId: trips.id,
      vehicleId: trips.vehicleId,
      registrationNumber: vehicles.registrationNumber,
      model: vehicles.model,
      distanceKm: trips.distanceKm,
      fuelUsedLiters: trips.fuelUsedLiters,
      fuelEfficiency: sql<number>`CASE WHEN ${trips.fuelUsedLiters} > 0 THEN ${trips.distanceKm} / ${trips.fuelUsedLiters} ELSE 0 END`.as("fuel_efficiency"),
    })
    .from(trips)
    .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .where(
      vehicleId
        ? eq(trips.vehicleId, vehicleId)
        : eq(trips.status, "COMPLETED")
    );

  return results;
}

export async function getFleetUtilization() {
  const allVehicles = await db.select().from(vehicles);
  const total = allVehicles.length;

  const statusCounts = await db
    .select({
      status: vehicles.status,
      count: count(),
    })
    .from(vehicles)
    .groupBy(vehicles.status);

  const onTrip = statusCounts.find((s) => s.status === "ON_TRIP")?.count || 0;
  const utilization = total > 0 ? Math.round((onTrip / total) * 100) : 0;

  return {
    total,
    utilization,
    breakdown: statusCounts,
  };
}

export async function getOperationalCost(vehicleId?: string) {
  const completedTrips = await db
    .select({
      vehicleId: trips.vehicleId,
      registrationNumber: vehicles.registrationNumber,
      model: vehicles.model,
      fuelCost: trips.fuelCost,
      tollCost: trips.tollCost,
      otherExpenses: trips.otherExpenses,
      totalTripCost: sql<number>`COALESCE(${trips.fuelCost}, 0) + COALESCE(${trips.tollCost}, 0) + COALESCE(${trips.otherExpenses}, 0)`.as("total_trip_cost"),
    })
    .from(trips)
    .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .where(
      vehicleId
        ? eq(trips.vehicleId, vehicleId)
        : eq(trips.status, "COMPLETED")
    );

  return completedTrips;
}

export async function getROI(vehicleId?: string) {
  const vehicleList = await db
    .select()
    .from(vehicles)
    .where(vehicleId ? eq(vehicles.id, vehicleId) : undefined);

  const results = await Promise.all(
    vehicleList.map(async (v) => {
      const [tripStats] = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(${trips.revenue}), 0)`.as("total_revenue"),
          totalFuelCost: sql<number>`COALESCE(SUM(${trips.fuelCost}), 0)`.as("total_fuel_cost"),
          totalTollCost: sql<number>`COALESCE(SUM(${trips.tollCost}), 0)`.as("total_toll_cost"),
          totalOtherExpenses: sql<number>`COALESCE(SUM(${trips.otherExpenses}), 0)`.as("total_other_expenses"),
          tripCount: count(),
        })
        .from(trips)
        .where(eq(trips.vehicleId, v.id));

      const [maintenanceCost] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${maintenanceLogs.cost}), 0)`.as("total_maintenance_cost"),
        })
        .from(maintenanceLogs)
        .where(eq(maintenanceLogs.vehicleId, v.id));

      const totalRevenue = tripStats?.totalRevenue || 0;
      const totalOperationalCost =
        (tripStats?.totalFuelCost || 0) +
        (tripStats?.totalTollCost || 0) +
        (tripStats?.totalOtherExpenses || 0) +
        (maintenanceCost?.total || 0);
      const roi = v.acquisitionCost > 0
        ? Math.round(((totalRevenue - totalOperationalCost) / v.acquisitionCost) * 100)
        : 0;

      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        model: v.model,
        acquisitionCost: v.acquisitionCost,
        totalRevenue,
        totalOperationalCost,
        maintenanceCost: maintenanceCost?.total || 0,
        tripCount: tripStats?.tripCount || 0,
        roi,
      };
    })
  );

  return results;
}
