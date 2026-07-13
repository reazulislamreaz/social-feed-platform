import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // local (default) or s3 (R2 / S3-compatible) — use s3 in production
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),

  /** Public API origin, e.g. https://reaz.sellx.no — makes /uploads URLs absolute */
  PUBLIC_API_URL: z.string().url().optional(),
  /** Optional CDN in front of assets */
  PUBLIC_ASSET_BASE_URL: z.string().url().optional(),

  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default("auto"),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),

  REDIS_URL: z.string().optional(),
  FEED_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).max(120).default(20),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;

if (data.STORAGE_DRIVER === "s3") {
  const missing = [
    !data.S3_BUCKET && "S3_BUCKET",
    !data.S3_ACCESS_KEY_ID && "S3_ACCESS_KEY_ID",
    !data.S3_SECRET_ACCESS_KEY && "S3_SECRET_ACCESS_KEY",
    !(data.S3_PUBLIC_URL || data.PUBLIC_ASSET_BASE_URL) && "S3_PUBLIC_URL (or PUBLIC_ASSET_BASE_URL)",
  ].filter(Boolean);

  if (missing.length > 0) {
    console.error(`STORAGE_DRIVER=s3 requires: ${missing.join(", ")}`);
    process.exit(1);
  }
}

export const env = data;
