import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { createTripSchema, completeTripSchema } from "../validators/trip.validator.js";
import * as tripService from "../services/trip.services.js";
import type { TripStatus } from "../types/index.js";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize("DISPATCHER", "FLEET_MANAGER"),
  async (req: Request, res: Response) => {
    try {
      const status = req.query.status as TripStatus | undefined;
      const trips = await tripService.getAllTrips(status);
      res.json({ trips });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.get(
  "/:id",
  authenticate,
  authorize("DISPATCHER", "FLEET_MANAGER"),
  async (req: Request, res: Response) => {
    try {
      const trip = await tripService.getTripById(req.params.id);
      res.json({ trip });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.post(
  "/",
  authenticate,
  authorize("DISPATCHER"),
  validate(createTripSchema),
  async (req: Request, res: Response) => {
    try {
      const trip = await tripService.createTrip(req.body);
      res.status(201).json({ trip });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.patch(
  "/:id",
  authenticate,
  authorize("DISPATCHER"),
  async (req: Request, res: Response) => {
    try {
      const trip = await tripService.updateTrip(req.params.id, req.body);
      res.json({ trip });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.post(
  "/:id/dispatch",
  authenticate,
  authorize("DISPATCHER"),
  async (req: Request, res: Response) => {
    try {
      const trip = await tripService.dispatchTrip(req.params.id);
      res.json({ trip });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

router.post(
  "/:id/complete",
  authenticate,
  authorize("DISPATCHER"),
  validate(completeTripSchema),
  async (req: Request, res: Response) => {
    try {
      const trip = await tripService.completeTrip(req.params.id, req.body);
      res.json({ trip });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

export default router;
