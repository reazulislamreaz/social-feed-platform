import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/crypto.js";
import { AppError } from "../utils/errors.js";

export type AuthUser = {
  id: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** Set by upload middleware after image is validated and stored */
      imageUrl?: string | null;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired access token", "UNAUTHORIZED"));
  }
}

/** Optional auth — attaches user when a valid token is present */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, email: payload.email };
  } catch {
    // ignore invalid token for optional routes
  }
  next();
}
