import "dotenv/config";
import { z } from "zod";

/**
 * Prefer S3_* names; fall back to common AWS_* names so production
 * env boards can use either convention.
 */
function pick(...values: Array<string | undefined>): string | undefined {
  for (const v of values) {
    if (v && v.trim()) return v.trim();
  }
  return undefined;
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),

  PUBLIC_API_URL: z.string().url().optional(),
  PUBLIC_ASSET_BASE_URL: z.string().url().optional(),

  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().url().optional(),

  REDIS_URL: z.string().optional(),
  FEED_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).max(120).default(20),
});

const merged = {
  ...process.env,
  S3_BUCKET: pick(process.env.S3_BUCKET, process.env.AWS_S3_BUCKET_NAME),
  S3_REGION: pick(process.env.S3_REGION, process.env.AWS_REGION)?.replace(/["']/g, ""),
  S3_ACCESS_KEY_ID: pick(process.env.S3_ACCESS_KEY_ID, process.env.AWS_ACCESS_KEY_ID),
  S3_SECRET_ACCESS_KEY: pick(
    process.env.S3_SECRET_ACCESS_KEY,
    process.env.AWS_SECRET_ACCESS_KEY,
  ),
  S3_ENDPOINT: pick(process.env.S3_ENDPOINT, process.env.AWS_ENDPOINT),
  S3_PUBLIC_URL: pick(process.env.S3_PUBLIC_URL, process.env.AWS_S3_PUBLIC_URL),
};

const parsed = envSchema.safeParse(merged);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const data = parsed.data;

if (data.STORAGE_DRIVER === "s3") {
  const missing = [
    !data.S3_BUCKET && "S3_BUCKET / AWS_S3_BUCKET_NAME",
    !data.S3_ACCESS_KEY_ID && "S3_ACCESS_KEY_ID / AWS_ACCESS_KEY_ID",
    !data.S3_SECRET_ACCESS_KEY && "S3_SECRET_ACCESS_KEY / AWS_SECRET_ACCESS_KEY",
  ].filter(Boolean);

  if (missing.length > 0) {
    console.error(`STORAGE_DRIVER=s3 requires: ${missing.join(", ")}`);
    process.exit(1);
  }
}

export const env = data;

/** Public base for objects in the bucket (no trailing slash). */
export function s3PublicBaseUrl(): string {
  if (env.S3_PUBLIC_URL) return env.S3_PUBLIC_URL.replace(/\/$/, "");
  if (env.PUBLIC_ASSET_BASE_URL) return env.PUBLIC_ASSET_BASE_URL.replace(/\/$/, "");
  // Native AWS virtual-hosted–style URL
  return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`;
}
