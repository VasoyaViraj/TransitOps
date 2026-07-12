import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "WAITING_APPROVAL", "BLOCKED", "COMPLETED"]).optional().default("BACKLOG"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().default("MEDIUM"),
  taskType: z.enum(["TRIP", "MAINTENANCE", "INSPECTION", "FUEL", "EXPENSE", "DRIVER", "VEHICLE", "INCIDENT", "COMPLIANCE", "DOCUMENT_RENEWAL", "GENERAL_TASK"]).optional().default("GENERAL_TASK"),
  assignedUserId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().int().min(0).optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  driverId: z.string().uuid().optional().nullable(),
  tripId: z.string().uuid().optional().nullable(),
  maintenanceId: z.string().uuid().optional().nullable(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "WAITING_APPROVAL", "BLOCKED", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  taskType: z.enum(["TRIP", "MAINTENANCE", "INSPECTION", "FUEL", "EXPENSE", "DRIVER", "VEHICLE", "INCIDENT", "COMPLIANCE", "DOCUMENT_RENEWAL", "GENERAL_TASK"]).optional(),
  assignedUserId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().int().min(0).optional().nullable(),
  vehicleId: z.string().uuid().optional().nullable(),
  driverId: z.string().uuid().optional().nullable(),
  tripId: z.string().uuid().optional().nullable(),
  maintenanceId: z.string().uuid().optional().nullable(),
  labelIds: z.array(z.string().uuid()).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "WAITING_APPROVAL", "BLOCKED", "COMPLETED"]),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment is required").max(5000),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const createChecklistSchema = z.object({
  content: z.string().min(1).max(500),
});

export const updateChecklistSchema = z.object({
  content: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});

export const createLabelSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().optional().default("#6366f1"),
});

export const taskQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  taskType: z.string().optional(),
  assignedUserId: z.string().optional(),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  tripId: z.string().optional(),
  search: z.string().optional(),
  overdue: z.string().optional(),
  completed: z.string().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  createdById: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("50"),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateChecklistInput = z.infer<typeof createChecklistSchema>;
export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
