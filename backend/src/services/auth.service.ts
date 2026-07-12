import type { Response } from "express";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import {
  hashPassword,
  hashToken,
  newTokenId,
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from "../utils/crypto.js";
import { AppError } from "../utils/errors.js";
import { publicUser } from "../utils/serializers.js";
import type { loginSchema, registerSchema } from "../utils/validators.js";
import type { z } from "zod";

const REFRESH_COOKIE = "refreshToken";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/api/auth",
  });
}

async function issueTokens(userId: string, email: string, res: Response) {
  const jti = newTokenId();
  const refreshToken = signRefreshToken(userId, jti);
  const accessToken = signAccessToken(userId, email);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt: refreshExpiryDate(),
    },
  });

  setRefreshCookie(res, refreshToken);
  return accessToken;
}

export async function register(
  input: z.infer<typeof registerSchema>,
  res: Response,
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AppError(409, "Email is already registered", "EMAIL_TAKEN");
  }

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
    },
  });

  const accessToken = await issueTokens(user.id, user.email, res);
  return { user: publicUser(user), accessToken };
}

export async function login(input: z.infer<typeof loginSchema>, res: Response) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const accessToken = await issueTokens(user.id, user.email, res);
  return { user: publicUser(user), accessToken };
}

export async function refresh(refreshToken: string | undefined, res: Response) {
  if (!refreshToken) {
    throw new AppError(401, "Refresh token missing", "UNAUTHORIZED");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    clearRefreshCookie(res);
    throw new AppError(401, "Invalid refresh token", "UNAUTHORIZED");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    clearRefreshCookie(res);
    throw new AppError(401, "Refresh token revoked or expired", "UNAUTHORIZED");
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    clearRefreshCookie(res);
    throw new AppError(401, "User not found", "UNAUTHORIZED");
  }

  const accessToken = await issueTokens(user.id, user.email, res);
  return { user: publicUser(user), accessToken };
}

export async function logout(refreshToken: string | undefined, res: Response) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  clearRefreshCookie(res);
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found");
  }
  return publicUser(user);
}

export { REFRESH_COOKIE };
