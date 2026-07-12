import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizePermission } from "../middleware/authorize.js";
import * as fuelService from "../services/fuel-logs.services.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizePermission("fuelExpenses", "VIEW"),
  async (req: Request, res: Response) => {
    try {
      const vehicleId = req.query.vehicleId as string | undefined;
      const logs = await fuelService.getAllFuelLogs(vehicleId);
      res.json({ logs });
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
      const log = await fuelService.createFuelLog(req.body);
      res.status(201).json({ log });
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
      const summary = await fuelService.getFuelSummary();
      res.json({ summary });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

export default router;
