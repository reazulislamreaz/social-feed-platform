import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./utils/asyncHandler.js";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import likeRoutes from "./routes/like.routes.js";

/**
 * Origins the browser is allowed to load post images from.
 * Default Helmet CSP is `img-src 'self'`, which blocks images served from a
 * different origin than the app (S3/CDN in prod, or a split API/app host).
 */
function imageCspSources(): string[] {
  const sources = new Set<string>(["'self'", "data:", "blob:"]);

  const candidates = [
    env.PUBLIC_ASSET_BASE_URL,
    env.S3_PUBLIC_URL,
    env.S3_ENDPOINT,
    env.STORAGE_DRIVER === "s3" && env.S3_BUCKET
      ? `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`
      : undefined,
  ].filter((v): v is string => Boolean(v));

  for (const candidate of candidates) {
    try {
      sources.add(new URL(candidate).origin);
    } catch {
      // Ignore malformed URLs — a bad env var shouldn't crash CSP setup
    }
  }

  return [...sources];
}

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "img-src": imageCspSources(),
        },
      },
    }),
  );
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Local uploads only — S3 objects are served from the bucket / CDN
  if (env.STORAGE_DRIVER === "local") {
    app.use(
      "/uploads",
      express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
        maxAge: env.NODE_ENV === "production" ? "7d" : 0,
        fallthrough: true,
      }),
    );
  }

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "Taskbook API is healthy" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/likes", likeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
