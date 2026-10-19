import type { Request, Response, NextFunction } from "express";
import { StallRepository } from "../repositories/stallRepository.ts";

const stallRepository = new StallRepository();

export const requireStallOwnerOrAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.userRole === "admin") {
    return next();
  }

  if (req.userRole !== "owner" || req.userId === undefined) {
    return res.status(403).json({
      status: "fail",
      message: "Anda tidak memiliki izin untuk mengubah warung ini",
    });
  }

  const stallId = Number(req.params.id);
  if (!Number.isInteger(stallId) || stallId <= 0) {
    return res.status(403).json({
      status: "fail",
      message: "Anda tidak memiliki izin untuk mengubah warung ini",
    });
  }

  try {
    const stall = await stallRepository.findById(stallId);
    if (!stall || stall.ownerId !== req.userId) {
      return res.status(403).json({
        status: "fail",
        message: "Anda tidak memiliki izin untuk mengubah warung ini",
      });
    }

    return next();
  } catch {
    return res.status(403).json({
      status: "fail",
      message: "Anda tidak memiliki izin untuk mengubah warung ini",
    });
  }
};
