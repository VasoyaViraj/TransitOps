import { z } from "zod";

export const createTripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  cargoWeightKg: z.number().positive("Cargo weight must be positive"),
  distanceKm: z.number().positive("Distance must be positive"),
  vehicleId: z.string().uuid("Invalid vehicle ID"),
  driverId: z.string().uuid("Invalid driver ID"),
});

export const completeTripSchema = z.object({
  finalOdometerKm: z.number().positive("Final odometer must be positive"),
  fuelUsedLiters: z.number().positive("Fuel used must be positive"),
  fuelCost: z.number().min(0, "Fuel cost cannot be negative"),
  tollCost: z.number().min(0, "Toll cost cannot be negative").optional().default(0),
  otherExpenses: z.number().min(0, "Other expenses cannot be negative").optional().default(0),
  revenue: z.number().min(0, "Revenue cannot be negative"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
