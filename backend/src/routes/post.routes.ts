import { Router } from "express";
import * as postController from "../controllers/post.controller.js";
import * as commentController from "../controllers/comment.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { writeLimiter } from "../middlewares/rateLimit.js";
import {
  persistUploadedImage,
  uploadImage,
} from "../middlewares/upload.js";

const router = Router();

router.get("/", requireAuth, postController.listPosts);
router.post(
  "/",
  requireAuth,
  writeLimiter,
  uploadImage,
  persistUploadedImage,
  postController.createPost,
);
router.get("/:id", requireAuth, postController.getPost);
router.delete("/:id", requireAuth, postController.deletePost);

router.get("/:id/comments", requireAuth, commentController.listComments);
router.post(
  "/:id/comments",
  requireAuth,
  writeLimiter,
  commentController.createComment,
);

export default router;
