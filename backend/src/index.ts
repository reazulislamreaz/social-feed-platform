import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { disconnectRedis } from "./config/redis.js";

const app = createApp();

async function main() {
  await prisma.$connect();
  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
    if (env.REDIS_URL) console.log("Feed cache: Redis enabled");
    console.log(`Uploads: ${env.STORAGE_DRIVER}`);
  });
}

async function shutdown() {
  await disconnectRedis();
  await prisma.$disconnect();
}

process.on("SIGINT", () => void shutdown().then(() => process.exit(0)));
process.on("SIGTERM", () => void shutdown().then(() => process.exit(0)));

main().catch(async (err) => {
  console.error("Failed to start server:", err);
  await shutdown();
  process.exit(1);
});
