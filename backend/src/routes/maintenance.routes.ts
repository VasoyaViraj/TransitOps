import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createMaintenanceSchema } from "../validators/maintenance.validator.js";
import * as maintenanceService from "../services/maintenance.services.js";
import type { MaintenanceStatus } from "../types/index.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("FLEET_MANAGER"),
  async (req: Request, res: Response) => {
    try {
      const status = req.query.status as MaintenanceStatus | undefined;
      const records = await maintenanceService.getAllMaintenance(status);
      res.json({ records });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.get(
  "/:id",
  authenticate,
  authorize("FLEET_MANAGER"),
  async (req: Request, res: Response) => {
    try {
      const record = await maintenanceService.getMaintenanceById(req.params.id);
      res.json({ record });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.post(
  "/",
  authenticate,
  authorize("FLEET_MANAGER"),
  validate(createMaintenanceSchema),
  async (req: Request, res: Response) => {
    try {
      const record = await maintenanceService.createMaintenance(req.body);
      res.status(201).json({ record });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.patch(
  "/:id/complete",
  authenticate,
  authorize("FLEET_MANAGER"),
  async (req: Request, res: Response) => {
    try {
      const record = await maintenanceService.completeMaintenance(req.params.id);
      res.json({ record });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

export default router;
