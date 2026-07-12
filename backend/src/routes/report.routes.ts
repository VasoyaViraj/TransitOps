import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizePermission } from "../middleware/authorize.js";
import * as reportService from "../services/report.services.js";

const router = Router();

router.get(
  "/fuel-efficiency",
  authenticate,
  authorizePermission("analytics", "VIEW"),
  async (req: Request, res: Response) => {
    try {
      const vehicleId = req.query.vehicleId as string | undefined;
      const data = await reportService.getFuelEfficiency(vehicleId);
      res.json({ data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.get(
  "/fleet-utilization",
  authenticate,
  authorizePermission("analytics", "VIEW"),
  async (_req: Request, res: Response) => {
    try {
      const data = await reportService.getFleetUtilization();
      res.json({ data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.get(
  "/operational-cost",
  authenticate,
  authorizePermission("analytics", "VIEW"),
  async (req: Request, res: Response) => {
    try {
      const vehicleId = req.query.vehicleId as string | undefined;
      const data = await reportService.getOperationalCost(vehicleId);
      res.json({ data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.get(
  "/roi",
  authenticate,
  authorizePermission("analytics", "VIEW"),
  async (req: Request, res: Response) => {
    try {
      const vehicleId = req.query.vehicleId as string | undefined;
      const data = await reportService.getROI(vehicleId);
      res.json({ data });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

export default router;
