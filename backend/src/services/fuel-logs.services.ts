import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { fuelLogs, vehicles, trips } from "../db/schema/index.js";

export async function getAllFuelLogs(vehicleId?: string) {
  const query = db
    .select({
      id: fuelLogs.id,
      tripId: fuelLogs.tripId,
      vehicleId: fuelLogs.vehicleId,
      liters: fuelLogs.liters,
      cost: fuelLogs.cost,
      date: fuelLogs.date,
      vehicleRegistration: vehicles.registrationNumber,
      vehicleModel: vehicles.model,
    })
    .from(fuelLogs)
    .innerJoin(vehicles, eq(fuelLogs.vehicleId, vehicles.id))
    .orderBy(desc(fuelLogs.date));

  if (vehicleId) {
    return query.where(eq(fuelLogs.vehicleId, vehicleId));
  }
  return query;
}

export async function createFuelLog(data: {
  vehicleId: string;
  tripId?: string;
  liters: number;
  cost: number;
  date?: string;
}) {
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, data.vehicleId))
    .limit(1);

  if (!vehicle) {
    throw Object.assign(new Error("Vehicle not found"), { statusCode: 404 });
  }

  const [log] = await db
    .insert(fuelLogs)
    .values({
      vehicleId: data.vehicleId,
      tripId: data.tripId!,
      liters: data.liters,
      cost: data.cost,
      date: data.date ? new Date(data.date) : new Date(),
    })
    .returning();

  return log;
}

export async function getFuelSummary() {
  const logs = await getAllFuelLogs();
  const totalLiters = logs.reduce((acc, l) => acc + (l.liters || 0), 0);
  const totalCost = logs.reduce((acc, l) => acc + (l.cost || 0), 0);
  return { totalLiters, totalCost, count: logs.length };
}
