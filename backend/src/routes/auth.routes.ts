import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import * as authService from "../services/auth.services.js";
import { UserRole } from "../types/index.js";

const router = Router();

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
};

const accessTokenOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const refreshTokenOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    res.cookie("accessToken", result.accessToken, accessTokenOptions);
    res.cookie("refreshToken", result.refreshToken, refreshTokenOptions);
    res.status(201).json({ user: result.user, accessToken: result.accessToken });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    res.cookie("accessToken", result.accessToken, accessTokenOptions);
    res.cookie("refreshToken", result.refreshToken, refreshTokenOptions);
    res.json({ user: result.user, accessToken: result.accessToken });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      res.status(401).json({ error: "Refresh token required" });
      return;
    }
    const result = await authService.refresh(token);
    res.cookie("accessToken", result.accessToken, accessTokenOptions);
    res.cookie("refreshToken", result.refreshToken, refreshTokenOptions);
    res.json({ user: result.user, accessToken: result.accessToken });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

// GET all role permissions — any authenticated user can view
router.get("/permissions", authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const list = await authService.getAllRolePermissions();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT permissions — ADMIN ONLY
router.put("/permissions/:role", authenticate, authorize("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const role = req.params.role as UserRole;
    const permissionsData = req.body;
    const updated = await authService.updateRolePermissions(role, permissionsData);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
