import { eq, and, or, like, asc, desc, sql, gte, lte, inArray, isNull, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import {
  tasks,
  users,
  vehicles,
  drivers,
  trips,
  taskComments,
  taskChecklists,
  taskAttachments,
  taskLabels,
  taskToLabels,
  taskWatchers,
  taskHistory,
} from "../db/schema/index.js";

const assignedUserAlias = alias(users, "assigned_user");
const createdByAlias = alias(users, "created_by");
import type {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  CreateCommentInput,
  CreateChecklistInput,
  UpdateChecklistInput,
  CreateLabelInput,
} from "../validators/task.validator.js";
import type { TaskStatus, TaskPriority, TaskType } from "../types/index.js";

interface UpdateCommentInput {
  content: string;
}

interface TaskQueryParams {
  status?: string;
  priority?: string;
  taskType?: string;
  assignedUserId?: string;
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  search?: string;
  overdue?: string;
  completed?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  createdById?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const taskSelectFields = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
  status: tasks.status,
  priority: tasks.priority,
  taskType: tasks.taskType,
  assignedUserId: tasks.assignedUserId,
  createdById: tasks.createdById,
  dueDate: tasks.dueDate,
  estimatedHours: tasks.estimatedHours,
  vehicleId: tasks.vehicleId,
  driverId: tasks.driverId,
  tripId: tasks.tripId,
  maintenanceId: tasks.maintenanceId,
  archived: tasks.archived,
  completedAt: tasks.completedAt,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
};

export async function getAllTasks(params: TaskQueryParams) {
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "50", 10);
  const offset = (page - 1) * limit;
  const sortField = params.sortBy || "createdAt";
  const sortOrder = params.sortOrder || "desc";

  const conditions: any[] = [eq(tasks.archived, false)];

  if (params.status) {
    const statuses = params.status.split(",").filter(Boolean) as TaskStatus[];
    if (statuses.length > 0) {
      conditions.push(inArray(tasks.status, statuses));
    }
  }
  if (params.priority) {
    const priorities = params.priority.split(",").filter(Boolean) as TaskPriority[];
    if (priorities.length > 0) {
      conditions.push(inArray(tasks.priority, priorities));
    }
  }
  if (params.taskType) {
    const types = params.taskType.split(",").filter(Boolean) as TaskType[];
    if (types.length > 0) {
      conditions.push(inArray(tasks.taskType, types));
    }
  }
  if (params.assignedUserId) {
    conditions.push(eq(tasks.assignedUserId, params.assignedUserId));
  }
  if (params.vehicleId) {
    conditions.push(eq(tasks.vehicleId, params.vehicleId));
  }
  if (params.driverId) {
    conditions.push(eq(tasks.driverId, params.driverId));
  }
  if (params.tripId) {
    conditions.push(eq(tasks.tripId, params.tripId));
  }
  if (params.createdById) {
    conditions.push(eq(tasks.createdById, params.createdById));
  }

  if (params.overdue === "true") {
    conditions.push(
      and(
        lte(tasks.dueDate, new Date()),
        ne(tasks.status, "COMPLETED"),
        isNull(tasks.completedAt),
      ),
    );
  }

  if (params.completed === "true") {
    conditions.push(eq(tasks.status, "COMPLETED"));
  }

  if (params.dueDateFrom) {
    conditions.push(gte(tasks.dueDate, new Date(params.dueDateFrom)));
  }
  if (params.dueDateTo) {
    conditions.push(lte(tasks.dueDate, new Date(params.dueDateTo)));
  }

  if (params.search) {
    const searchTerm = `%${params.search}%`;
    conditions.push(
      or(
        like(tasks.title, searchTerm),
        like(tasks.description, searchTerm),
      ),
    );
  }

  const where = and(...conditions);

  const orderByFn = sortOrder === "desc" ? desc : asc;
  const orderByColumn = (tasks as any)[sortField] || tasks.createdAt;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        ...taskSelectFields,
        assignedUser: {
          id: assignedUserAlias.id,
          name: assignedUserAlias.name,
          email: assignedUserAlias.email,
        },
        createdBy: {
          id: createdByAlias.id,
          name: createdByAlias.name,
          email: createdByAlias.email,
        },
        vehicle: {
          id: vehicles.id,
          registrationNumber: vehicles.registrationNumber,
          model: vehicles.model,
        },
        driver: {
          id: drivers.id,
          name: drivers.name,
          licenseNumber: drivers.licenseNumber,
        },
        trip: {
          id: trips.id,
          source: trips.source,
          destination: trips.destination,
          status: trips.status,
        },
        commentCount: sql<number>`(SELECT COUNT(*) FROM ${taskComments} WHERE ${taskComments.taskId} = ${tasks.id})`,
        attachmentCount: sql<number>`(SELECT COUNT(*) FROM ${taskAttachments} WHERE ${taskAttachments.taskId} = ${tasks.id})`,
        checklistCount: sql<number>`(SELECT COUNT(*) FROM ${taskChecklists} WHERE ${taskChecklists.taskId} = ${tasks.id})`,
        checklistCompletedCount: sql<number>`(SELECT COUNT(*) FROM ${taskChecklists} WHERE ${taskChecklists.taskId} = ${tasks.id} AND ${taskChecklists.completed} = true)`,
        watcherCount: sql<number>`(SELECT COUNT(*) FROM ${taskWatchers} WHERE ${taskWatchers.taskId} = ${tasks.id})`,
      })
      .from(tasks)
      .leftJoin(assignedUserAlias, eq(tasks.assignedUserId, assignedUserAlias.id))
      .innerJoin(createdByAlias, eq(tasks.createdById, createdByAlias.id))
      .leftJoin(vehicles, eq(tasks.vehicleId, vehicles.id))
      .leftJoin(drivers, eq(tasks.driverId, drivers.id))
      .leftJoin(trips, eq(tasks.tripId, trips.id))
      .where(where)
      .orderBy(orderByFn(orderByColumn))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tasks)
      .where(where),
  ]);

  const total = Number(totalResult[0]?.count || 0);

  const taskIds: string[] = (data as any[]).map((t: any) => t.id);
  let labelsMap: Record<string, any[]> = {};
  if (taskIds.length > 0) {
    const labels = await db
      .select({
        taskId: taskToLabels.taskId,
        labelId: taskLabels.id,
        labelName: taskLabels.name,
        labelColor: taskLabels.color,
      })
      .from(taskToLabels)
      .innerJoin(taskLabels, eq(taskToLabels.labelId, taskLabels.id))
      .where(inArray(taskToLabels.taskId, taskIds));

    labels.forEach((l) => {
      if (!labelsMap[l.taskId]) labelsMap[l.taskId] = [];
      labelsMap[l.taskId].push({
        id: l.labelId,
        name: l.labelName,
        color: l.labelColor,
      });
    });
  }

  const tasksWithLabels = data.map((t: any) => ({
    ...t,
    labels: labelsMap[t.id] || [],
    assignedUser: t.assignedUser?.id ? t.assignedUser : null,
  }));

  return {
    tasks: tasksWithLabels,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTaskById(id: string) {
  const [task] = await db
    .select({
      ...taskSelectFields,
      assignedUser: {
        id: assignedUserAlias.id,
        name: assignedUserAlias.name,
        email: assignedUserAlias.email,
      },
      createdBy: {
        id: createdByAlias.id,
        name: createdByAlias.name,
        email: createdByAlias.email,
      },
      vehicle: {
        id: vehicles.id,
        registrationNumber: vehicles.registrationNumber,
        model: vehicles.model,
      },
      driver: {
        id: drivers.id,
        name: drivers.name,
        licenseNumber: drivers.licenseNumber,
      },
      trip: {
        id: trips.id,
        source: trips.source,
        destination: trips.destination,
      },
    })
    .from(tasks)
    .leftJoin(assignedUserAlias, eq(tasks.assignedUserId, assignedUserAlias.id))
    .innerJoin(createdByAlias, eq(tasks.createdById, createdByAlias.id))
    .leftJoin(vehicles, eq(tasks.vehicleId, vehicles.id))
    .leftJoin(drivers, eq(tasks.driverId, drivers.id))
    .leftJoin(trips, eq(tasks.tripId, trips.id))
    .where(eq(tasks.id, id))
    .limit(1);

  if (!task) {
    throw Object.assign(new Error("Task not found"), { statusCode: 404 });
  }

  const [labels, comments, checklists, attachments, watchers, history] = await Promise.all([
    db
      .select({
        id: taskLabels.id,
        name: taskLabels.name,
        color: taskLabels.color,
      })
      .from(taskToLabels)
      .innerJoin(taskLabels, eq(taskToLabels.labelId, taskLabels.id))
      .where(eq(taskToLabels.taskId, id)),
    db
      .select({
        id: taskComments.id,
        taskId: taskComments.taskId,
        authorId: taskComments.authorId,
        content: taskComments.content,
        edited: taskComments.edited,
        parentId: taskComments.parentId,
        createdAt: taskComments.createdAt,
        updatedAt: taskComments.updatedAt,
        author: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(taskComments)
      .innerJoin(users, eq(taskComments.authorId, users.id))
      .where(eq(taskComments.taskId, id))
      .orderBy(asc(taskComments.createdAt)),
    db
      .select()
      .from(taskChecklists)
      .where(eq(taskChecklists.taskId, id))
      .orderBy(asc(taskChecklists.position)),
    db
      .select()
      .from(taskAttachments)
      .where(eq(taskAttachments.taskId, id)),
    db
      .select({
        id: taskWatchers.id,
        userId: taskWatchers.userId,
        createdAt: taskWatchers.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(taskWatchers)
      .innerJoin(users, eq(taskWatchers.userId, users.id))
      .where(eq(taskWatchers.taskId, id)),
    db
      .select({
        id: taskHistory.id,
        taskId: taskHistory.taskId,
        userId: taskHistory.userId,
        action: taskHistory.action,
        field: taskHistory.field,
        oldValue: taskHistory.oldValue,
        newValue: taskHistory.newValue,
        createdAt: taskHistory.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(taskHistory)
      .innerJoin(users, eq(taskHistory.userId, users.id))
      .where(eq(taskHistory.taskId, id))
      .orderBy(desc(taskHistory.createdAt)),
  ]);

  return {
    ...(task as any),
    labels,
    comments,
    checklists,
    attachments,
    watchers,
    history,
  };
}

async function addHistory(taskId: string, userId: string, action: string, field?: string, oldValue?: string, newValue?: string) {
  await db.insert(taskHistory).values({
    taskId,
    userId,
    action,
    field,
    oldValue: oldValue ? String(oldValue) : null,
    newValue: newValue ? String(newValue) : null,
  });
}

export async function createTask(data: CreateTaskInput, userId: string) {
  return db.transaction(async (tx) => {
    const [task] = await tx
      .insert(tasks)
      .values({
        title: data.title,
        description: data.description || null,
        status: data.status || "BACKLOG",
        priority: data.priority || "MEDIUM",
        taskType: data.taskType || "GENERAL_TASK",
        assignedUserId: data.assignedUserId || null,
        createdById: userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours || null,
        vehicleId: data.vehicleId || null,
        driverId: data.driverId || null,
        tripId: data.tripId || null,
        maintenanceId: data.maintenanceId || null,
      })
      .returning();

    if (data.labelIds && data.labelIds.length > 0) {
      await tx.insert(taskToLabels).values(
        data.labelIds.map((labelId) => ({ taskId: task.id, labelId })),
      );
    }

    await addHistory(task.id, userId, "created");

    return getTaskById(task.id);
  });
}

export async function updateTask(id: string, data: UpdateTaskInput, userId: string) {
  const existing = await getTaskById(id);
  const updates: Record<string, any> = {};
  const historyEntries: Array<{ field: string; oldVal: string; newVal: string }> = [];

  const fieldsToCheck: Array<keyof UpdateTaskInput> = [
    "title", "description", "status", "priority", "taskType",
    "assignedUserId", "dueDate", "estimatedHours", "vehicleId",
    "driverId", "tripId", "maintenanceId",
  ];

  for (const field of fieldsToCheck) {
    if (data[field] !== undefined && data[field] !== (existing as any)[field]) {
      updates[field] = data[field] === null ? null : field === "dueDate" && typeof data[field] === "string" ? new Date(data[field]) : data[field];
      historyEntries.push({
        field,
        oldVal: String((existing as any)[field] ?? ""),
        newVal: String(data[field] ?? ""),
      });
    }
  }

  if (Object.keys(updates).length === 0 && !data.labelIds) {
    return existing;
  }

  return db.transaction(async (tx) => {
    if (Object.keys(updates).length > 0) {
      await tx
        .update(tasks)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(tasks.id, id));
    }

    for (const entry of historyEntries) {
      await addHistory(id, userId, "updated", entry.field, entry.oldVal, entry.newVal);
    }

    if (data.labelIds !== undefined) {
      await tx.delete(taskToLabels).where(eq(taskToLabels.taskId, id));
      if (data.labelIds.length > 0) {
        await tx.insert(taskToLabels).values(
          data.labelIds.map((labelId) => ({ taskId: id, labelId })),
        );
      }
      await addHistory(id, userId, "updated", "labels");
    }

    return getTaskById(id);
  });
}

export async function updateTaskStatus(id: string, data: UpdateTaskStatusInput, userId: string) {
  const existing = await getTaskById(id);
  const oldStatus = existing.status;

  const updateValues: Record<string, any> = {
    status: data.status,
    updatedAt: new Date(),
  };

  if (data.status === "COMPLETED") {
    updateValues.completedAt = new Date();
  } else {
    updateValues.completedAt = null;
  }

  return db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set(updateValues)
      .where(eq(tasks.id, id));

    await addHistory(id, userId, "status_changed", "status", oldStatus, data.status);

    return getTaskById(id);
  });
}

export async function deleteTask(id: string, userId: string) {
  const existing = await getTaskById(id);
  return db.transaction(async (tx) => {
    await tx
      .update(tasks)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(tasks.id, id));
    await addHistory(id, userId, "archived");
    return { success: true };
  });
}

export async function duplicateTask(id: string, userId: string) {
  const existing = await getTaskById(id);
  const data: CreateTaskInput = {
    title: `${existing.title} (Copy)`,
    description: existing.description,
    status: "BACKLOG",
    priority: existing.priority,
    taskType: existing.taskType,
    assignedUserId: null,
    dueDate: null,
    estimatedHours: existing.estimatedHours,
    vehicleId: existing.vehicleId,
    driverId: existing.driverId,
    tripId: existing.tripId,
    maintenanceId: existing.maintenanceId,
    labelIds: existing.labels.map((l: any) => l.id),
  };
  return createTask(data, userId);
}

export async function createComment(taskId: string, data: CreateCommentInput, userId: string) {
  const result = await db
    .insert(taskComments)
    .values({
      taskId,
      authorId: userId,
      content: data.content,
      parentId: data.parentId || null,
    })
    .returning();
  const comment = (result as any[])[0];

  await addHistory(taskId, userId, "comment_added");

  const [commentWithAuthor] = await db
    .select({
      id: taskComments.id,
      taskId: taskComments.taskId,
      authorId: taskComments.authorId,
      content: taskComments.content,
      edited: taskComments.edited,
      parentId: taskComments.parentId,
      createdAt: taskComments.createdAt,
      updatedAt: taskComments.updatedAt,
      author: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(taskComments)
    .innerJoin(users, eq(taskComments.authorId, users.id))
    .where(eq(taskComments.id, comment.id))
    .limit(1);

  return commentWithAuthor;
}

export async function updateComment(commentId: string, data: UpdateCommentInput, userId: string) {
  const existingResult = await db
    .select()
    .from(taskComments)
    .where(eq(taskComments.id, commentId))
    .limit(1);
  const existing = (existingResult as any[])[0];

  if (!existing) {
    throw Object.assign(new Error("Comment not found"), { statusCode: 404 });
  }
  if (existing.authorId !== userId) {
    throw Object.assign(new Error("Not authorized to edit this comment"), { statusCode: 403 });
  }

  const result = await db
    .update(taskComments)
    .set({ content: data.content, edited: true, updatedAt: new Date() })
    .where(eq(taskComments.id, commentId))
    .returning();

  return (result as any[])[0];
}

export async function deleteComment(commentId: string, userId: string) {
  const existingResult = await db
    .select()
    .from(taskComments)
    .where(eq(taskComments.id, commentId))
    .limit(1);
  const existing = (existingResult as any[])[0];

  if (!existing) {
    throw Object.assign(new Error("Comment not found"), { statusCode: 404 });
  }
  if (existing.authorId !== userId) {
    throw Object.assign(new Error("Not authorized to delete this comment"), { statusCode: 403 });
  }

  await db.delete(taskComments).where(eq(taskComments.id, commentId));
  return { success: true };
}

export async function createChecklist(taskId: string, data: CreateChecklistInput) {
  const lastItemResult = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(position), -1)` })
    .from(taskChecklists)
    .where(eq(taskChecklists.taskId, taskId));
  const lastItem = (lastItemResult as any[])[0] as { maxPos: number } | undefined;

  const nextPos = (lastItem?.maxPos ?? -1) + 1;

  const result = await db
    .insert(taskChecklists)
    .values({
      taskId,
      content: data.content,
      position: nextPos,
    })
    .returning();

  return (result as any[])[0];
}

export async function updateChecklist(checklistId: string, data: UpdateChecklistInput) {
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (data.content !== undefined) updates.content = data.content;
  if (data.completed !== undefined) updates.completed = data.completed;

  const result = await db
    .update(taskChecklists)
    .set(updates)
    .where(eq(taskChecklists.id, checklistId))
    .returning();

  return (result as any[])[0];
}

export async function deleteChecklist(checklistId: string) {
  await db.delete(taskChecklists).where(eq(taskChecklists.id, checklistId));
  return { success: true };
}

export async function createAttachment(taskId: string, userId: string, data: { fileName: string; fileType: string; fileSize: number; fileUrl: string }) {
  const result = await db
    .insert(taskAttachments)
    .values({
      taskId,
      uploadedById: userId,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      fileUrl: data.fileUrl,
    })
    .returning();

  return (result as any[])[0];
}

export async function deleteAttachment(attachmentId: string) {
  await db.delete(taskAttachments).where(eq(taskAttachments.id, attachmentId));
  return { success: true };
}

export async function addWatcher(taskId: string, userId: string) {
  const existingResult = await db
    .select()
    .from(taskWatchers)
    .where(and(eq(taskWatchers.taskId, taskId), eq(taskWatchers.userId, userId)))
    .limit(1);
  const existing = (existingResult as any[])[0];

  if (!existing) {
    await db.insert(taskWatchers).values({ taskId, userId });
  }

  return { success: true };
}

export async function removeWatcher(taskId: string, userId: string) {
  await db
    .delete(taskWatchers)
    .where(and(eq(taskWatchers.taskId, taskId), eq(taskWatchers.userId, userId)));

  return { success: true };
}

export async function createLabel(data: CreateLabelInput) {
  const result = await db
    .insert(taskLabels)
    .values({ name: data.name, color: data.color || "#6366f1" })
    .returning();
  return (result as any[])[0];
}

export async function getAllLabels() {
  return db.select().from(taskLabels).orderBy(asc(taskLabels.name));
}

export async function getDashboardStats() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const [
    tasksDueToday,
    overdueTasks,
    criticalTasks,
    blockedTasks,
    completedThisWeek,
    avgCompletionTime,
    completionRate,
    cardsPerColumn,
    tasksByPriority,
    tasksByType,
    recentActivity,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.dueDate, now),
          ne(tasks.status, "COMPLETED"),
          eq(tasks.archived, false),
        ),
      ),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tasks)
      .where(
        and(
          lte(tasks.dueDate, now),
          ne(tasks.status, "COMPLETED"),
          isNull(tasks.completedAt),
          eq(tasks.archived, false),
        ),
      ),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.priority, "CRITICAL"),
          ne(tasks.status, "COMPLETED"),
          eq(tasks.archived, false),
        ),
      ),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.status, "BLOCKED"),
          eq(tasks.archived, false),
        ),
      ),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.status, "COMPLETED"),
          gte(tasks.completedAt, startOfWeek),
          lte(tasks.completedAt, endOfWeek),
          eq(tasks.archived, false),
        ),
      ),
    db
      .select({ avg: sql<number>`AVG(EXTRACT(EPOCH FROM (${tasks.completedAt} - ${tasks.createdAt})) / 3600)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.status, "COMPLETED"),
          gte(tasks.completedAt, startOfWeek),
          lte(tasks.completedAt, endOfWeek),
        ),
      ),
    (async () => {
      const [completed] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.status, "COMPLETED"),
            gte(tasks.completedAt, startOfWeek),
            lte(tasks.completedAt, endOfWeek),
          ),
        );
      const [total] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(tasks)
        .where(eq(tasks.archived, false));
      const totalCount = Number(total?.count || 0);
      const completedCount = Number(completed?.count || 0);
      return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    })(),
    db
      .select({
        status: tasks.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(tasks)
      .where(eq(tasks.archived, false))
      .groupBy(tasks.status)
      .orderBy(asc(tasks.status)),
    db
      .select({
        priority: tasks.priority,
        count: sql<number>`COUNT(*)`,
      })
      .from(tasks)
      .where(eq(tasks.archived, false))
      .groupBy(tasks.priority)
      .orderBy(asc(tasks.priority)),
    db
      .select({
        taskType: tasks.taskType,
        count: sql<number>`COUNT(*)`,
      })
      .from(tasks)
      .where(eq(tasks.archived, false))
      .groupBy(tasks.taskType)
      .orderBy(asc(tasks.taskType)),
    db
      .select({
        id: taskHistory.id,
        taskId: taskHistory.taskId,
        userId: taskHistory.userId,
        action: taskHistory.action,
        field: taskHistory.field,
        oldValue: taskHistory.oldValue,
        newValue: taskHistory.newValue,
        createdAt: taskHistory.createdAt,
        user: {
          id: users.id,
          name: users.name,
        },
        task: {
          id: tasks.id,
          title: tasks.title,
        },
      })
      .from(taskHistory)
      .innerJoin(users, eq(taskHistory.userId, users.id))
      .innerJoin(tasks, eq(taskHistory.taskId, tasks.id))
      .orderBy(desc(taskHistory.createdAt))
      .limit(20),
  ]);

  return {
    tasksDueToday: Number(tasksDueToday[0]?.count || 0),
    overdueTasks: Number(overdueTasks[0]?.count || 0),
    criticalTasks: Number(criticalTasks[0]?.count || 0),
    blockedTasks: Number(blockedTasks[0]?.count || 0),
    completedThisWeek: Number(completedThisWeek[0]?.count || 0),
    averageCompletionTime: Math.round(Number(avgCompletionTime[0]?.avg || 0) * 10) / 10,
    taskCompletionRate: completionRate,
    cardsPerColumn,
    tasksByPriority,
    tasksByType,
    recentActivity,
  };
}

export async function getActivity(taskId?: string) {
  const conditions: any[] = [];
  if (taskId) {
    conditions.push(eq(taskHistory.taskId, taskId));
  }

  const data = await db
    .select({
      id: taskHistory.id,
      taskId: taskHistory.taskId,
      userId: taskHistory.userId,
      action: taskHistory.action,
      field: taskHistory.field,
      oldValue: taskHistory.oldValue,
      newValue: taskHistory.newValue,
      createdAt: taskHistory.createdAt,
      user: {
        id: users.id,
        name: users.name,
      },
      task: {
        id: tasks.id,
        title: tasks.title,
      },
    })
    .from(taskHistory)
    .innerJoin(users, eq(taskHistory.userId, users.id))
    .innerJoin(tasks, eq(taskHistory.taskId, tasks.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(taskHistory.createdAt))
    .limit(50);

  return data;
}
