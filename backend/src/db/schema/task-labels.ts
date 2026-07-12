import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { tasks } from "./tasks";

export const taskLabels = pgTable("task_labels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const taskToLabels = pgTable("task_to_labels", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  labelId: uuid("label_id").notNull().references(() => taskLabels.id, { onDelete: "cascade" }),
});


