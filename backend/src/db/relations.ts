import { relations } from "drizzle-orm";
import { users } from "./schema/users.js";
import { vehicles } from "./schema/vehicles.js";
import { drivers } from "./schema/drivers.js";
import { trips } from "./schema/trips.js";
import { maintenanceLogs } from "./schema/maintenance-logs.js";
import { fuelLogs } from "./schema/fuel-logs.js";
import { expenses } from "./schema/expenses.js";
import { sessions } from "./schema/sessions.js";
import { tasks } from "./schema/tasks.js";
import { taskComments } from "./schema/task-comments.js";
import { taskChecklists } from "./schema/task-checklists.js";
import { taskAttachments } from "./schema/task-attachments.js";
import { taskLabels, taskToLabels } from "./schema/task-labels.js";
import { taskWatchers } from "./schema/task-watchers.js";
import { taskHistory } from "./schema/task-history.js";

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  createdTasks: many(tasks, { relationName: "createdBy" }),
  assignedTasks: many(tasks, { relationName: "assignedTo" }),
  comments: many(taskComments),
  attachments: many(taskAttachments),
  watchers: many(taskWatchers),
  history: many(taskHistory),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const vehicleRelations = relations(vehicles, ({ many }) => ({
  trips: many(trips),
  maintenanceLogs: many(maintenanceLogs),
  fuelLogs: many(fuelLogs),
  tasks: many(tasks),
}));

export const driverRelations = relations(drivers, ({ many }) => ({
  trips: many(trips),
  tasks: many(tasks),
}));

export const tripRelations = relations(trips, ({ one, many }) => ({
  vehicle: one(vehicles, {
    fields: [trips.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [trips.driverId],
    references: [drivers.id],
  }),
  fuelLogs: many(fuelLogs),
  expenses: many(expenses),
  tasks: many(tasks),
}));

export const maintenanceLogRelations = relations(maintenanceLogs, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [maintenanceLogs.vehicleId],
    references: [vehicles.id],
  }),
}));

export const fuelLogRelation = relations(fuelLogs, ({ one }) => ({
  trip: one(trips, {
    fields: [fuelLogs.tripId],
    references: [trips.id],
  }),
  vehicle: one(vehicles, {
    fields: [fuelLogs.vehicleId],
    references: [vehicles.id],
  }),
}));

export const expenseRelations = relations(expenses, ({ one }) => ({
  trip: one(trips, {
    fields: [expenses.tripId],
    references: [trips.id],
  }),
}));

export const taskRelations = relations(tasks, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: "createdBy",
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedUserId],
    references: [users.id],
    relationName: "assignedTo",
  }),
  vehicle: one(vehicles, {
    fields: [tasks.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [tasks.driverId],
    references: [drivers.id],
  }),
  trip: one(trips, {
    fields: [tasks.tripId],
    references: [trips.id],
  }),
  comments: many(taskComments),
  checklists: many(taskChecklists),
  attachments: many(taskAttachments),
  labels: many(taskToLabels),
  watchers: many(taskWatchers),
  history: many(taskHistory),
}));

export const taskCommentRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  author: one(users, {
    fields: [taskComments.authorId],
    references: [users.id],
  }),
}));

export const taskChecklistRelations = relations(taskChecklists, ({ one }) => ({
  task: one(tasks, {
    fields: [taskChecklists.taskId],
    references: [tasks.id],
  }),
}));

export const taskAttachmentRelations = relations(taskAttachments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAttachments.taskId],
    references: [tasks.id],
  }),
  uploader: one(users, {
    fields: [taskAttachments.uploadedById],
    references: [users.id],
  }),
}));

export const taskLabelRelations = relations(taskLabels, ({ many }) => ({
  tasks: many(taskToLabels),
}));

export const taskToLabelRelations = relations(taskToLabels, ({ one }) => ({
  task: one(tasks, {
    fields: [taskToLabels.taskId],
    references: [tasks.id],
  }),
  label: one(taskLabels, {
    fields: [taskToLabels.labelId],
    references: [taskLabels.id],
  }),
}));

export const taskWatcherRelations = relations(taskWatchers, ({ one }) => ({
  task: one(tasks, {
    fields: [taskWatchers.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskWatchers.userId],
    references: [users.id],
  }),
}));

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task: one(tasks, {
    fields: [taskHistory.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskHistory.userId],
    references: [users.id],
  }),
}));
