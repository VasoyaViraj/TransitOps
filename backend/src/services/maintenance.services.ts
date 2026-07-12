import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { maintenanceLogs, vehicles } from "../db/schema/index.js";
import type { CreateMaintenanceInput, UpdateMaintenanceInput } from "../validators/maintenance.validator.js";
import type { MaintenanceStatus } from "../types/index.js";

export async function getAllMaintenance(status?: MaintenanceStatus) {
  const conditions = status ? eq(maintenanceLogs.status, status) : undefined;

  return db
    .select({
      id: maintenanceLogs.id,
      vehicleId: maintenanceLogs.vehicleId,
      description: maintenanceLogs.description,
      cost: maintenanceLogs.cost,
      date: maintenanceLogs.date,
      status: maintenanceLogs.status,
      completedAt: maintenanceLogs.completedAt,
      createdAt: maintenanceLogs.createdAt,
      updatedAt: maintenanceLogs.updatedAt,
      vehicleRegistration: vehicles.registrationNumber,
      vehicleModel: vehicles.model,
    })
    .from(maintenanceLogs)
    .innerJoin(vehicles, eq(maintenanceLogs.vehicleId, vehicles.id))
    .where(conditions);
}

export async function getMaintenanceById(id: string) {
  const [record] = await db
    .select({
      id: maintenanceLogs.id,
      vehicleId: maintenanceLogs.vehicleId,
      description: maintenanceLogs.description,
      cost: maintenanceLogs.cost,
      date: maintenanceLogs.date,
      status: maintenanceLogs.status,
      completedAt: maintenanceLogs.completedAt,
      createdAt: maintenanceLogs.createdAt,
      updatedAt: maintenanceLogs.updatedAt,
      vehicleRegistration: vehicles.registrationNumber,
      vehicleModel: vehicles.model,
    })
    .from(maintenanceLogs)
    .innerJoin(vehicles, eq(maintenanceLogs.vehicleId, vehicles.id))
    .where(eq(maintenanceLogs.id, id))
    .limit(1);

  if (!record) {
    throw Object.assign(new Error("Maintenance record not found"), { statusCode: 404 });
  }

  return record;
}

export async function createMaintenance(data: CreateMaintenanceInput) {
  const recordId = await db.transaction(async (tx) => {
    const [vehicle] = await tx
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, data.vehicleId))
      .limit(1);

    if (!vehicle) {
      throw Object.assign(new Error("Vehicle not found"), { statusCode: 404 });
    }

    if (vehicle.status === "ON_TRIP") {
      throw Object.assign(new Error("Cannot schedule maintenance for a vehicle on trip"), { statusCode: 400 });
    }

    const [record] = await tx
      .insert(maintenanceLogs)
      .values({
        vehicleId: data.vehicleId,
        description: data.description,
        cost: data.cost,
        date: new Date(data.date),
      })
      .returning();

    await tx
      .update(vehicles)
      .set({ status: "IN_SHOP", updatedAt: new Date() })
      .where(eq(vehicles.id, data.vehicleId));

    return record.id;
  });

  return getMaintenanceById(recordId);
}

export async function completeMaintenance(id: string) {
  await db.transaction(async (tx) => {
    const [record] = await tx
      .select()
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.id, id))
      .limit(1);

    if (!record) {
      throw Object.assign(new Error("Maintenance record not found"), { statusCode: 404 });
    }

    if (record.status === "COMPLETED") {
      throw Object.assign(new Error("Maintenance already completed"), { statusCode: 400 });
    }

    await tx
      .update(maintenanceLogs)
      .set({ status: "COMPLETED", completedAt: new Date(), updatedAt: new Date() })
      .where(eq(maintenanceLogs.id, id));

    await tx
      .update(vehicles)
      .set({ status: "AVAILABLE", updatedAt: new Date() })
      .where(eq(vehicles.id, record.vehicleId));

  });

  return getMaintenanceById(id);
}
