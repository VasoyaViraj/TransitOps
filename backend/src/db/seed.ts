import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "./schema/index.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool, { schema });

async function seed() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password123", 12);

  // Check if users already exist
  const [existingUser] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .limit(1);

  if (existingUser) {
    console.log("Database already seeded, skipping...");
    await pool.end();
    return;
  }

  // Insert users
  await db.insert(schema.users).values([
    { email: "fleet@transitops.com", password, name: "Fleet Manager", role: "FLEET_MANAGER" },
    { email: "dispatch@transitops.com", password, name: "Dispatcher", role: "DISPATCHER" },
    { email: "safety@transitops.com", password, name: "Safety Officer", role: "SAFETY_OFFICER" },
    { email: "analyst@transitops.com", password, name: "Financial Analyst", role: "FINANCIAL_ANALYST" },
  ]);
  console.log("Users seeded");

  // Insert vehicles
  const createdVehicles = await db
    .insert(schema.vehicles)
    .values([
      { registrationNumber: "GJ01AB1234", model: "Tata Ace", capacityKg: 500, odometerKm: 12000, acquisitionCost: 800000 },
      { registrationNumber: "GJ02CD5678", model: "Mahindra Bolero Pickup", capacityKg: 750, odometerKm: 8500, acquisitionCost: 1200000 },
      { registrationNumber: "GJ03EF9012", model: "Eicher Pro 2049", capacityKg: 1500, odometerKm: 22000, acquisitionCost: 2500000 },
      { registrationNumber: "MH04GH3456", model: "Tata 407", capacityKg: 2500, odometerKm: 35000, acquisitionCost: 4000000 },
      { registrationNumber: "DL05IJ7890", model: "Ashok Leyland Dost", capacityKg: 600, odometerKm: 5000, acquisitionCost: 950000 },
    ])
    .returning();
  console.log(`${createdVehicles.length} vehicles seeded`);

  // Insert drivers
  const createdDrivers = await db
    .insert(schema.drivers)
    .values([
      { name: "Rajesh Kumar", licenseNumber: "GJ-2020-001", licenseCategory: "Heavy Motor Vehicle", licenseExpiry: new Date("2028-12-31"), contactNumber: "+91-9876543210", safetyScore: 95 },
      { name: "Suresh Patel", licenseNumber: "GJ-2021-002", licenseCategory: "Medium Motor Vehicle", licenseExpiry: new Date("2027-06-15"), contactNumber: "+91-9876543211", safetyScore: 88 },
      { name: "Amit Singh", licenseNumber: "MH-2019-003", licenseCategory: "Heavy Motor Vehicle", licenseExpiry: new Date("2025-01-01"), contactNumber: "+91-9876543212", safetyScore: 72 },
      { name: "Vikram Sharma", licenseNumber: "DL-2022-004", licenseCategory: "Light Motor Vehicle", licenseExpiry: new Date("2029-03-20"), contactNumber: "+91-9876543213", safetyScore: 91 },
      { name: "Mohammed Ali", licenseNumber: "GJ-2023-005", licenseCategory: "Heavy Motor Vehicle", licenseExpiry: new Date("2030-08-10"), contactNumber: "+91-9876543214", safetyScore: 100 },
    ])
    .returning();
  console.log(`${createdDrivers.length} drivers seeded`);

  // Insert dispatched trip (vehicle[0] + driver[0] are ON_TRIP)
  const [trip1] = await db
    .insert(schema.trips)
    .values({
      source: "Ahmedabad",
      destination: "Mumbai",
      cargoWeightKg: 400,
      distanceKm: 530,
      vehicleId: createdVehicles[0].id,
      driverId: createdDrivers[0].id,
      status: "DISPATCHED",
      dispatchedAt: new Date(),
    })
    .returning();

  await db
    .update(schema.vehicles)
    .set({ status: "ON_TRIP" })
    .where(eq(schema.vehicles.id, createdVehicles[0].id));

  await db
    .update(schema.drivers)
    .set({ status: "ON_TRIP" })
    .where(eq(schema.drivers.id, createdDrivers[0].id));

  // Insert completed trip (vehicle[1] + driver[1])
  const [trip2] = await db
    .insert(schema.trips)
    .values({
      source: "Surat",
      destination: "Rajkot",
      cargoWeightKg: 600,
      distanceKm: 420,
      vehicleId: createdVehicles[1].id,
      driverId: createdDrivers[1].id,
      status: "COMPLETED",
      dispatchedAt: new Date(Date.now() - 86400000 * 2),
      completedAt: new Date(Date.now() - 86400000),
      finalOdometerKm: 8920,
      fuelUsedLiters: 85,
      fuelCost: 7650,
      tollCost: 650,
      otherExpenses: 200,
      revenue: 15000,
    })
    .returning();

  await db.insert(schema.fuelLogs).values({
    tripId: trip2.id,
    vehicleId: createdVehicles[1].id,
    liters: 85,
    cost: 7650,
  });

  await db.insert(schema.expenses).values([
    { tripId: trip2.id, type: "TOLL", amount: 650 },
    { tripId: trip2.id, type: "OTHER", amount: 200 },
  ]);

  await db
    .update(schema.vehicles)
    .set({ odometerKm: 8920 })
    .where(eq(schema.vehicles.id, createdVehicles[1].id));

  console.log("Trips seeded");

  // Insert maintenance record (vehicle[2] is IN_SHOP)
  await db.insert(schema.maintenanceLogs).values({
    vehicleId: createdVehicles[2].id,
    description: "Regular oil change and filter replacement",
    cost: 3500,
    date: new Date(),
    status: "SCHEDULED",
  });

  await db
    .update(schema.vehicles)
    .set({ status: "IN_SHOP" })
    .where(eq(schema.vehicles.id, createdVehicles[2].id));

  console.log("Maintenance seeded");
  console.log("Seed complete!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
