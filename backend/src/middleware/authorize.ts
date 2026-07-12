import { Response, NextFunction } from "express";
import { AuthRequest } from "./authenticate.js";
import type { UserRole } from "../types/index.js";

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole as UserRole)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
};
