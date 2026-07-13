import { Redis } from "ioredis";
import { env } from "./env.js";

let client: Redis | null = null;
let connectPromise: Promise<void> | null = null;
let disabled = false;

export function getRedis(): Redis | null {
  if (!env.REDIS_URL || disabled) return null;

  if (!client) {
    try {
      client = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      });
      client.on("error", (err: Error) => {
        console.warn("[redis]", err.message);
      });
    } catch (err) {
      disabled = true;
      console.warn(
        "[redis] disabled — invalid REDIS_URL:",
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  }

  return client;
}

async function ensureConnected(redis: Redis) {
  if (redis.status === "ready") return;
  connectPromise ??= redis.connect().catch((err: Error) => {
    connectPromise = null;
    throw err;
  });
  await connectPromise;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    await ensureConnected(redis);
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  if (ttlSeconds <= 0) return;
  try {
    const redis = getRedis();
    if (!redis) return;
    await ensureConnected(redis);
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // cache is best-effort
  }
}

export async function cacheDelByPrefix(prefix: string) {
  try {
    const redis = getRedis();
    if (!redis) return;
    await ensureConnected(redis);
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
      cursor = next;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== "0");
  } catch {
    // ignore
  }
}

export async function disconnectRedis() {
  if (!client) return;
  await client.quit().catch(() => undefined);
  client = null;
  connectPromise = null;
}
