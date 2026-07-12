import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { drivers } from "../db/schema/index.js";
import type { CreateDriverInput, UpdateDriverInput } from "../validators/driver.validator.js";
import type { DriverStatus } from "../types/index.js";

export async function getAllDrivers(status?: DriverStatus) {
  const conditions = status ? eq(drivers.status, status) : undefined;
  return db.select().from(drivers).where(conditions);
}

export async function getDriverById(id: string) {
  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.id, id))
    .limit(1);

  if (!driver) {
    throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
  }

  return driver;
}

export async function createDriver(data: CreateDriverInput) {
  try {
    const [driver] = await db
      .insert(drivers)
      .values({
        name: data.name,
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory,
        licenseExpiry: new Date(data.licenseExpiry),
        contactNumber: data.contactNumber,
        safetyScore: data.safetyScore ?? 100,
      })
      .returning();

    return driver;
  } catch (error: any) {
    if (error.code === "23505" || error.cause?.code === "23505" || error.message?.includes("duplicate key")) {
      throw Object.assign(new Error("Driver license number already exists"), { statusCode: 409 });
    }
    throw error;
  }
}

export async function updateDriver(id: string, data: UpdateDriverInput) {
  await getDriverById(id);

  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.licenseExpiry) {
    updateData.licenseExpiry = new Date(data.licenseExpiry);
  }

  const [driver] = await db
    .update(drivers)
    .set(updateData)
    .where(eq(drivers.id, id))
    .returning();

  return driver;
}

export async function suspendDriver(id: string) {
  await getDriverById(id);

  const [driver] = await db
    .update(drivers)
    .set({ status: "SUSPENDED", updatedAt: new Date() })
    .where(eq(drivers.id, id))
    .returning();

  return driver;
}
