import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizePermission } from "../middleware/authorize.js";
import * as expensesService from "../services/expenses.services.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizePermission("fuelExpenses", "VIEW"),
  async (req: Request, res: Response) => {
    try {
      const tripId = req.query.tripId as string | undefined;
      const expenses = await expensesService.getAllExpenses(tripId);
      res.json({ expenses });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.post(
  "/",
  authenticate,
  authorizePermission("fuelExpenses", "EDIT"),
  async (req: Request, res: Response) => {
    try {
      const expense = await expensesService.createExpense(req.body);
      res.status(201).json({ expense });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.get(
  "/summary",
  authenticate,
  authorizePermission("fuelExpenses", "VIEW"),
  async (_req: Request, res: Response) => {
    try {
      const summary = await expensesService.getExpenseSummary();
      res.json({ summary });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

export default router;
