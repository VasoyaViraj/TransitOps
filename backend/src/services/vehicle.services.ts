import { eq, and, SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { vehicles } from "../db/schema/index.js";
import type { CreateVehicleInput, UpdateVehicleInput } from "../validators/vehicle.validator.js";
import type { VehicleStatus } from "../types/index.js";

export async function getAllVehicles(status?: VehicleStatus) {
  const conditions = status ? eq(vehicles.status, status) : undefined;
  return db.select().from(vehicles).where(conditions);
}

export async function getVehicleById(id: string) {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, id))
    .limit(1);

  if (!vehicle) {
    throw Object.assign(new Error("Vehicle not found"), { statusCode: 404 });
  }

  return vehicle;
}

export async function createVehicle(data: CreateVehicleInput) {
  const [vehicle] = await db
    .insert(vehicles)
    .values({
      registrationNumber: data.registrationNumber,
      model: data.model,
      capacityKg: data.capacityKg,
      odometerKm: data.odometerKm || 0,
      acquisitionCost: data.acquisitionCost,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
    })
    .returning();

  return vehicle;
}

export async function updateVehicle(id: string, data: UpdateVehicleInput) {
  await getVehicleById(id);

  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.purchaseDate) {
    updateData.purchaseDate = new Date(data.purchaseDate);
  }

  const [vehicle] = await db
    .update(vehicles)
    .set(updateData)
    .where(eq(vehicles.id, id))
    .returning();

  return vehicle;
}

export async function retireVehicle(id: string) {
  await getVehicleById(id);

  const [vehicle] = await db
    .update(vehicles)
    .set({ status: "RETIRED", updatedAt: new Date() })
    .where(eq(vehicles.id, id))
    .returning();

  return vehicle;
}
