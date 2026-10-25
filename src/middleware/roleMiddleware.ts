import type { Request, Response, NextFunction } from "express";

type UserRole = "admin" | "owner" | "customer";

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole as UserRole)) {
      return res.status(403).json({
        status: "fail",
        message: "Anda tidak memiliki izin untuk melakukan aksi ini",
      });
    }

    return next();
  };
};
