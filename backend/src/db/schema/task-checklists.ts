import { pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { tasks } from "./tasks";

export const taskChecklists = pgTable("task_checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  completed: boolean("completed").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
