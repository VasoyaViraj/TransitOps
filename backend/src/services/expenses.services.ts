import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { expenses, trips, vehicles } from "../db/schema/index.js";

export async function getAllExpenses(tripId?: string) {
  const query = db
    .select({
      id: expenses.id,
      tripId: expenses.tripId,
      type: expenses.type,
      amount: expenses.amount,
      description: expenses.description,
      date: expenses.date,
      tripSource: trips.source,
      tripDestination: trips.destination,
      vehicleId: trips.vehicleId,
    })
    .from(expenses)
    .innerJoin(trips, eq(expenses.tripId, trips.id))
    .orderBy(desc(expenses.date));

  if (tripId) {
    return query.where(eq(expenses.tripId, tripId));
  }
  return query;
}

export async function createExpense(data: {
  tripId: string;
  type: string;
  amount: number;
  description?: string;
  date?: string;
}) {
  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, data.tripId))
    .limit(1);

  if (!trip) {
    throw Object.assign(new Error("Trip not found"), { statusCode: 404 });
  }

  const [expense] = await db
    .insert(expenses)
    .values({
      tripId: data.tripId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
    })
    .returning();

  return expense;
}

export async function getExpenseSummary() {
  const all = await getAllExpenses();
  const total = all.reduce((acc, e) => acc + (e.amount || 0), 0);
  const byType: Record<string, number> = {};
  all.forEach((e) => {
    byType[e.type] = (byType[e.type] || 0) + (e.amount || 0);
  });
  return { total, byType, count: all.length };
}
