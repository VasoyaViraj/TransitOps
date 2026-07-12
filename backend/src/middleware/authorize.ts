import { Response, NextFunction } from "express";
import { AuthRequest } from "./authenticate.js";
import { getPermissionsForRole } from "../services/auth.services.js";
import type { UserRole } from "../types/index.js";

export const authorizePermission = (module: string, level: "VIEW" | "EDIT") => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.userRole) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    // ADMIN bypasses all permission checks — full access to everything
    if (req.userRole === "ADMIN") {
      next();
      return;
    }

    try {
      const permissions = await getPermissionsForRole(req.userRole as UserRole);
      const access = permissions[module as keyof typeof permissions];

      if (!access || access === "NONE") {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      if (level === "EDIT" && access !== "EDIT") {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      if (level === "VIEW" && access !== "VIEW" && access !== "EDIT") {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      next();
    } catch {
      res.status(500).json({ error: "Failed to verify permissions" });
    }
  };
};

// Static role check - ADMIN always passes
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    if (req.userRole === "ADMIN" || roles.includes(req.userRole as UserRole)) {
      next();
      return;
    }
    res.status(403).json({ error: "Insufficient permissions" });
  };
};
