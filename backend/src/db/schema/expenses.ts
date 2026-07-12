import { pgTable, uuid, varchar, text, real, timestamp } from "drizzle-orm/pg-core";
import { trips } from "./trips";

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  tripId: uuid("trip_id")
    .notNull()
    .references(() => trips.id),
  type: varchar("type", { length: 50 }).notNull(),
  amount: real("amount").notNull(),
  description: text("description"),
  date: timestamp("date", { mode: "date" }).defaultNow().notNull(),
});
