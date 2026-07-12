import { Router } from "express";
import * as commentController from "../controllers/comment.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { writeLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.get("/:id/replies", requireAuth, commentController.listReplies);
router.post(
  "/:id/replies",
  requireAuth,
  writeLimiter,
  commentController.createReply,
);

export default router;
