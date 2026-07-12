import type { Request, Response } from "express";
import * as postService from "../services/post.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createPostSchema, feedQuerySchema } from "../utils/validators.js";

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const body = createPostSchema.parse(req.body);
  const post = await postService.createPost({
    authorId: req.user!.id,
    content: body.content,
    visibility: body.visibility,
    imageUrl: req.imageUrl ?? null,
  });
  res.status(201).json({ success: true, data: { post } });
});

export const listPosts = asyncHandler(async (req: Request, res: Response) => {
  const query = feedQuerySchema.parse(req.query);
  const data = await postService.getFeed({
    viewerId: req.user?.id,
    limit: query.limit,
    cursor: query.cursor,
  });
  res.json({ success: true, data });
});

export const getPost = asyncHandler(async (req: Request, res: Response) => {
  const post = await postService.getPostById(req.params.id as string, req.user?.id);
  res.json({ success: true, data: { post } });
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  await postService.deletePost(req.params.id as string, req.user!.id);
  res.json({ success: true, message: "Post deleted" });
});
