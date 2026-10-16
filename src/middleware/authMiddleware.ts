import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.auth_token;
  if (typeof token !== "string" || token.length === 0) {
    return res
      .status(401)
      .json({ status: "fail", message: "Token tidak ditemukan" });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "development-secret",
    );

    if (
      typeof payload !== "object" ||
      payload === null ||
      !Number.isInteger(payload.userId) ||
      payload.userId <= 0
    ) {
      throw new Error("INVALID_TOKEN");
    }

    req.userId = payload.userId;
    return next();
  } catch {
    return res
      .status(401)
      .json({ status: "fail", message: "Token tidak valid" });
  }
};
