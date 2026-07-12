import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import * as authService from "../services/auth.services.js";

const router = Router();

router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await authService.getProfile(req.userId!);
    res.json({ user });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;
