import type { Request, Response } from "express";
import * as commentService from "../services/comment.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  commentsQuerySchema,
  createCommentSchema,
  createReplySchema,
} from "../utils/validators.js";

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const body = createCommentSchema.parse(req.body);
  const comment = await commentService.createComment({
    postId: req.params.id as string,
    authorId: req.user!.id,
    content: body.content,
  });
  res.status(201).json({ success: true, data: { comment } });
});

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const query = commentsQuerySchema.parse(req.query);
  const data = await commentService.listComments({
    postId: req.params.id as string,
    viewerId: req.user?.id,
    limit: query.limit,
    cursor: query.cursor,
  });
  res.json({ success: true, data });
});

export const createReply = asyncHandler(async (req: Request, res: Response) => {
  const body = createReplySchema.parse(req.body);
  const reply = await commentService.createReply({
    commentId: req.params.id as string,
    authorId: req.user!.id,
    content: body.content,
  });
  res.status(201).json({ success: true, data: { reply } });
});

export const listReplies = asyncHandler(async (req: Request, res: Response) => {
  const query = commentsQuerySchema.parse(req.query);
  const data = await commentService.listReplies({
    commentId: req.params.id as string,
    viewerId: req.user?.id,
    limit: query.limit,
    cursor: query.cursor,
  });
  res.json({ success: true, data });
});
