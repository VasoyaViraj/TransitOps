import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorizePermission } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createDriverSchema, updateDriverSchema } from "../validators/driver.validator.js";
import * as driverService from "../services/driver.services.js";
import type { DriverStatus } from "../types/index.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorizePermission("drivers", "VIEW"),
  async (req: Request, res: Response) => {
    try {
      const status = req.query.status as DriverStatus | undefined;
      const drivers = await driverService.getAllDrivers(status);
      res.json({ drivers });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.get(
  "/:id",
  authenticate,
  authorizePermission("drivers", "VIEW"),
  async (req: Request, res: Response) => {
    try {
      const driver = await driverService.getDriverById(req.params.id as string);
      res.json({ driver });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.post(
  "/",
  authenticate,
  authorizePermission("drivers", "EDIT"),
  validate(createDriverSchema),
  async (req: Request, res: Response) => {
    try {
      const driver = await driverService.createDriver(req.body);
      res.status(201).json({ driver });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.patch(
  "/:id",
  authenticate,
  authorizePermission("drivers", "EDIT"),
  validate(updateDriverSchema),
  async (req: Request, res: Response) => {
    try {
      const driver = await driverService.updateDriver(req.params.id as string, req.body);
      res.json({ driver });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  authorizePermission("drivers", "EDIT"),
  async (req: Request, res: Response) => {
    try {
      const driver = await driverService.suspendDriver(req.params.id as string);
      res.json({ driver });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

export default router;
