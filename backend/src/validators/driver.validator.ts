import { z } from "zod";

export const createDriverSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  licenseNumber: z.string().min(1, "License number is required").max(20),
  licenseCategory: z.string().min(1, "License category is required").max(50),
  licenseExpiry: z.string().min(1, "License expiry is required"),
  contactNumber: z.string().min(10, "Contact number must be at least 10 characters").max(20),
  safetyScore: z.number().min(0, "Safety score must be at least 0").max(100, "Safety score cannot exceed 100").optional().default(100),
});

export const updateDriverSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  licenseNumber: z.string().min(1).max(20).optional(),
  licenseCategory: z.string().min(1).max(50).optional(),
  licenseExpiry: z.string().optional(),
  contactNumber: z.string().min(10).max(20).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
