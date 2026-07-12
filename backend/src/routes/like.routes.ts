import { Router } from "express";
import * as likeController from "../controllers/like.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { likeLimiter } from "../middlewares/rateLimit.js";

const router = Router();

router.get("/", requireAuth, likeController.listLikers);
router.post("/", requireAuth, likeLimiter, likeController.addLike);
router.delete("/", requireAuth, likeLimiter, likeController.removeLike);

export default router;
