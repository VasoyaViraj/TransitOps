import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate.js";
import * as reportService from "../services/report.services.js";

const router = Router();

router.get(
  "/stats",
  authenticate,
  async (_req: Request, res: Response) => {
    try {
      const stats = await reportService.getDashboardStats();
      res.json({ stats });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  }
);

export default router;
