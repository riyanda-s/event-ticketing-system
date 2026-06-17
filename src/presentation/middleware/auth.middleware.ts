import { Request, Response, NextFunction } from "express";

export type UserRole = "organizer" | "customer" | "gate_officer" | "admin";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; role: UserRole };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const userId = req.headers["x-user-id"] as string;
  const userRole = req.headers["x-user-role"] as string;

  if (!userId || !userRole) {
    res.status(401).json({ error: "Unauthorized: missing x-user-id or x-user-role header" });
    return;
  }
  req.user = { id: userId, role: userRole as UserRole };
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !(roles as string[]).includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: insufficient permissions" });
      return;
    }
    next();
  };
}
