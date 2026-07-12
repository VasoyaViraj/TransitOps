import { z } from "zod";

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required").max(20),
  model: z.string().min(1, "Model is required").max(255),
  type: z.string().max(50).optional().default("VAN"),
  capacityKg: z.number().positive("Capacity must be positive"),
  odometerKm: z.number().min(0, "Odometer cannot be negative").optional().default(0),
  acquisitionCost: z.number().positive("Acquisition cost must be positive"),
  purchaseDate: z.string().optional(),
});

export const updateVehicleSchema = z.object({
  registrationNumber: z.string().min(1).max(20).optional(),
  model: z.string().min(1).max(255).optional(),
  type: z.string().max(50).optional(),
  capacityKg: z.number().positive().optional(),
  odometerKm: z.number().min(0).optional(),
  acquisitionCost: z.number().positive().optional(),
  purchaseDate: z.string().optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"]).optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
