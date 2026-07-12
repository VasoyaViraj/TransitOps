import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createVehicleSchema, updateVehicleSchema } from "../validators/vehicle.validator.js";
import * as vehicleService from "../services/vehicle.services.js";
import type { VehicleStatus } from "../types/index.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizePermission("fleet", "VIEW"),
  async (req: Request, res: Response) => {
    try {
      const status = req.query.status as VehicleStatus | undefined;
      const vehicles = await vehicleService.getAllVehicles(status);
      res.json({ vehicles });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.get(
  "/:id",
  authenticate,
  authorizePermission("fleet", "VIEW"),
  async (req: Request, res: Response) => {
    try {
      const vehicle = await vehicleService.getVehicleById(req.params.id as string);
      res.json({ vehicle });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.post(
  "/",
  authenticate,
  authorizePermission("fleet", "EDIT"),
  validate(createVehicleSchema),
  async (req: Request, res: Response) => {
    try {
      const vehicle = await vehicleService.createVehicle(req.body);
      res.status(201).json({ vehicle });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.patch(
  "/:id",
  authenticate,
  authorizePermission("fleet", "EDIT"),
  validate(updateVehicleSchema),
  async (req: Request, res: Response) => {
    try {
      const vehicle = await vehicleService.updateVehicle(req.params.id as string, req.body);
      res.json({ vehicle });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  authorizePermission("fleet", "EDIT"),
  async (req: Request, res: Response) => {
    try {
      const vehicle = await vehicleService.retireVehicle(req.params.id as string);
      res.json({ vehicle });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

export default router;
