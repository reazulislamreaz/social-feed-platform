import type { Request, Response } from "express";
import * as likeService from "../services/like.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { likeSchema } from "../utils/validators.js";
import { z } from "zod";

export const addLike = asyncHandler(async (req: Request, res: Response) => {
  const body = likeSchema.parse(req.body);
  const data = await likeService.addLike({
    userId: req.user!.id,
    targetType: body.targetType,
    targetId: body.targetId,
  });
  res.status(201).json({ success: true, data });
});

export const removeLike = asyncHandler(async (req: Request, res: Response) => {
  const body = likeSchema.parse(req.body);
  const data = await likeService.removeLike({
    userId: req.user!.id,
    targetType: body.targetType,
    targetId: body.targetId,
  });
  res.json({ success: true, data });
});

export const listLikers = asyncHandler(async (req: Request, res: Response) => {
  const query = likeSchema
    .extend({ limit: z.coerce.number().int().min(1).max(100).optional() })
    .parse(req.query);
  const likers = await likeService.listLikers(
    query.targetType,
    query.targetId,
    req.user!.id,
    query.limit,
  );
  res.json({ success: true, data: { likers } });
});
