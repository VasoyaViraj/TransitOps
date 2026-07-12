import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { trips, vehicles, drivers, fuelLogs, expenses } from "../db/schema/index.js";
import type { CreateTripInput, CompleteTripInput } from "../validators/trip.validator.js";
import type { TripStatus } from "../types/index.js";

export async function getAllTrips(status?: TripStatus) {
  const conditions = status ? eq(trips.status, status) : undefined;

  const results = await db
    .select({
      id: trips.id,
      source: trips.source,
      destination: trips.destination,
      cargoWeightKg: trips.cargoWeightKg,
      distanceKm: trips.distanceKm,
      status: trips.status,
      vehicleId: trips.vehicleId,
      driverId: trips.driverId,
      finalOdometerKm: trips.finalOdometerKm,
      fuelUsedLiters: trips.fuelUsedLiters,
      fuelCost: trips.fuelCost,
      tollCost: trips.tollCost,
      otherExpenses: trips.otherExpenses,
      revenue: trips.revenue,
      dispatchedAt: trips.dispatchedAt,
      completedAt: trips.completedAt,
      createdAt: trips.createdAt,
      updatedAt: trips.updatedAt,
      vehicleRegistration: vehicles.registrationNumber,
      vehicleModel: vehicles.model,
      driverName: drivers.name,
      driverLicense: drivers.licenseNumber,
    })
    .from(trips)
    .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .innerJoin(drivers, eq(trips.driverId, drivers.id))
    .where(conditions);

  return results;
}

export async function getTripById(id: string) {
  const [trip] = await db
    .select({
      id: trips.id,
      source: trips.source,
      destination: trips.destination,
      cargoWeightKg: trips.cargoWeightKg,
      distanceKm: trips.distanceKm,
      status: trips.status,
      vehicleId: trips.vehicleId,
      driverId: trips.driverId,
      finalOdometerKm: trips.finalOdometerKm,
      fuelUsedLiters: trips.fuelUsedLiters,
      fuelCost: trips.fuelCost,
      tollCost: trips.tollCost,
      otherExpenses: trips.otherExpenses,
      revenue: trips.revenue,
      dispatchedAt: trips.dispatchedAt,
      completedAt: trips.completedAt,
      createdAt: trips.createdAt,
      updatedAt: trips.updatedAt,
      vehicleRegistration: vehicles.registrationNumber,
      vehicleModel: vehicles.model,
      vehicleCapacityKg: vehicles.capacityKg,
      driverName: drivers.name,
      driverLicense: drivers.licenseNumber,
    })
    .from(trips)
    .innerJoin(vehicles, eq(trips.vehicleId, vehicles.id))
    .innerJoin(drivers, eq(trips.driverId, drivers.id))
    .where(eq(trips.id, id))
    .limit(1);

  if (!trip) {
    throw Object.assign(new Error("Trip not found"), { statusCode: 404 });
  }

  const tripFuelLogs = await db
    .select()
    .from(fuelLogs)
    .where(eq(fuelLogs.tripId, id));

  const tripExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.tripId, id));

  return { ...trip, fuelLogs: tripFuelLogs, expenses: tripExpenses };
}

export async function createTrip(data: CreateTripInput) {
  const [trip] = await db
    .insert(trips)
    .values({
      source: data.source,
      destination: data.destination,
      cargoWeightKg: data.cargoWeightKg,
      distanceKm: data.distanceKm,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
    })
    .returning();

  return trip;
}

export async function updateTrip(id: string, data: Partial<CreateTripInput>) {
  await getTripById(id);

  const [trip] = await db
    .update(trips)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(trips.id, id))
    .returning();

  return trip;
}

export async function dispatchTrip(tripId: string) {
  return db.transaction(async (tx) => {
    const [trip] = await tx
      .select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);

    if (!trip) {
      throw Object.assign(new Error("Trip not found"), { statusCode: 404 });
    }

    if (trip.status !== "DRAFT") {
      throw Object.assign(new Error("Trip must be in DRAFT status to dispatch"), { statusCode: 400 });
    }

    const [vehicle] = await tx
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, trip.vehicleId))
      .limit(1);

    if (!vehicle || vehicle.status !== "AVAILABLE") {
      throw Object.assign(new Error("Vehicle is not available"), { statusCode: 400 });
    }

    const [driver] = await tx
      .select()
      .from(drivers)
      .where(eq(drivers.id, trip.driverId))
      .limit(1);

    if (!driver || driver.status !== "AVAILABLE") {
      throw Object.assign(new Error("Driver is not available"), { statusCode: 400 });
    }

    if (new Date() > new Date(driver.licenseExpiry)) {
      throw Object.assign(new Error("Driver's license has expired"), { statusCode: 400 });
    }

    if (trip.cargoWeightKg > vehicle.capacityKg) {
      throw Object.assign(
        new Error(`Cargo weight (${trip.cargoWeightKg}kg) exceeds vehicle capacity (${vehicle.capacityKg}kg)`),
        { statusCode: 400 }
      );
    }

    await tx
      .update(trips)
      .set({ status: "DISPATCHED", dispatchedAt: new Date(), updatedAt: new Date() })
      .where(eq(trips.id, tripId));

    await tx
      .update(vehicles)
      .set({ status: "ON_TRIP", updatedAt: new Date() })
      .where(eq(vehicles.id, trip.vehicleId));

    await tx
      .update(drivers)
      .set({ status: "ON_TRIP", updatedAt: new Date() })
      .where(eq(drivers.id, trip.driverId));

    return getTripById(tripId);
  });
}

export async function completeTrip(tripId: string, data: CompleteTripInput) {
  return db.transaction(async (tx) => {
    const [trip] = await tx
      .select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1);

    if (!trip) {
      throw Object.assign(new Error("Trip not found"), { statusCode: 404 });
    }

    if (trip.status !== "DISPATCHED") {
      throw Object.assign(new Error("Trip must be DISPATCHED to complete"), { statusCode: 400 });
    }

    const [vehicle] = await tx
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, trip.vehicleId))
      .limit(1);

    if (!vehicle) {
      throw Object.assign(new Error("Vehicle not found"), { statusCode: 404 });
    }

    if (data.finalOdometerKm <= vehicle.odometerKm) {
      throw Object.assign(
        new Error(`Final odometer (${data.finalOdometerKm}km) must be greater than current (${vehicle.odometerKm}km)`),
        { statusCode: 400 }
      );
    }

    await tx
      .update(trips)
      .set({
        status: "COMPLETED",
        finalOdometerKm: data.finalOdometerKm,
        fuelUsedLiters: data.fuelUsedLiters,
        fuelCost: data.fuelCost,
        tollCost: data.tollCost,
        otherExpenses: data.otherExpenses,
        revenue: data.revenue,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(trips.id, tripId));

    await tx
      .update(vehicles)
      .set({ status: "AVAILABLE", odometerKm: data.finalOdometerKm, updatedAt: new Date() })
      .where(eq(vehicles.id, trip.vehicleId));

    await tx
      .update(drivers)
      .set({ status: "AVAILABLE", updatedAt: new Date() })
      .where(eq(drivers.id, trip.driverId));

    await tx.insert(fuelLogs).values({
      tripId,
      vehicleId: trip.vehicleId,
      liters: data.fuelUsedLiters,
      cost: data.fuelCost,
    });

    if (data.tollCost && data.tollCost > 0) {
      await tx.insert(expenses).values({
        tripId,
        type: "TOLL",
        amount: data.tollCost,
      });
    }

    if (data.otherExpenses && data.otherExpenses > 0) {
      await tx.insert(expenses).values({
        tripId,
        type: "OTHER",
        amount: data.otherExpenses,
      });
    }

    return getTripById(tripId);
  });
}
