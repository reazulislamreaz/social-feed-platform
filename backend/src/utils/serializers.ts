import { env } from "../config/env.js";

export function publicUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export function authorPreview(user: {
  id: string;
  firstName: string;
  lastName: string;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Turn relative /uploads/... paths into absolute URLs for split frontend/API hosts.
 * Absolute http(s) URLs (e.g. S3/CDN) are returned unchanged.
 */
export function publicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  const base = (
    env.PUBLIC_ASSET_BASE_URL ||
    env.PUBLIC_API_URL ||
    ""
  ).replace(/\/$/, "");

  if (!base) return path.startsWith("/") ? path : `/${path}`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
