import { z } from "zod";

export const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid("Invalid vehicle ID"),
  description: z.string().min(1, "Description is required"),
  cost: z.number().positive("Cost must be positive"),
  date: z.string().min(1, "Date is required"),
});

export const updateMaintenanceSchema = z.object({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED"]).optional(),
  completedAt: z.string().optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
