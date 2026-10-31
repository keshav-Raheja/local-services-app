import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedUser } from "../types/express";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided. Please login." });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token. Please login again." });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Access denied. Insufficient permissions." });
      return;
    }
    next();
  };
};
