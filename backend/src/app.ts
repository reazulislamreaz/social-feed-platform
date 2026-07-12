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

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
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
