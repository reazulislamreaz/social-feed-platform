import type { LikeTargetType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { cacheDelByPrefix } from "../config/redis.js";
import { AppError } from "../utils/errors.js";
import { authorPreview } from "../utils/serializers.js";
import { canViewPost } from "./post.service.js";

async function assertTargetAccessible(
  targetType: LikeTargetType,
  targetId: string,
  userId: string,
) {
  if (targetType === "POST") {
    const post = await prisma.post.findUnique({ where: { id: targetId } });
    if (!post || !canViewPost(post, userId)) {
      throw new AppError(404, "Post not found");
    }
    return;
  }

  if (targetType === "COMMENT") {
    const comment = await prisma.comment.findUnique({
      where: { id: targetId },
      include: { post: true },
    });
    if (!comment || !canViewPost(comment.post, userId)) {
      throw new AppError(404, "Comment not found");
    }
    return;
  }

  const reply = await prisma.reply.findUnique({
    where: { id: targetId },
    include: { comment: { include: { post: true } } },
  });
  if (!reply || !canViewPost(reply.comment.post, userId)) {
    throw new AppError(404, "Reply not found");
  }
}

async function bumpLikeCount(
  tx: Prisma.TransactionClient,
  targetType: LikeTargetType,
  targetId: string,
  delta: 1 | -1,
) {
  // Never let a race push likeCount below zero
  const where =
    delta < 0 ? { id: targetId, likeCount: { gt: 0 } } : { id: targetId };
  const data = { likeCount: { increment: delta } };

  if (targetType === "POST") {
    await tx.post.updateMany({ where, data });
    return;
  }
  if (targetType === "COMMENT") {
    await tx.comment.updateMany({ where, data });
    return;
  }
  await tx.reply.updateMany({ where, data });
}

async function readLikeCount(targetType: LikeTargetType, targetId: string) {
  if (targetType === "POST") {
    const row = await prisma.post.findUnique({
      where: { id: targetId },
      select: { likeCount: true },
    });
    return row?.likeCount ?? 0;
  }
  if (targetType === "COMMENT") {
    const row = await prisma.comment.findUnique({
      where: { id: targetId },
      select: { likeCount: true },
    });
    return row?.likeCount ?? 0;
  }
  const row = await prisma.reply.findUnique({
    where: { id: targetId },
    select: { likeCount: true },
  });
  return row?.likeCount ?? 0;
}

export async function addLike(input: {
  userId: string;
  targetType: LikeTargetType;
  targetId: string;
}) {
  await assertTargetAccessible(input.targetType, input.targetId, input.userId);

  let created = false;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: {
          userId: input.userId,
          targetType: input.targetType,
          targetId: input.targetId,
        },
      });
      await bumpLikeCount(tx, input.targetType, input.targetId, 1);
      created = true;
    });
  } catch (err) {
    // Already liked — treat as success (idempotent)
    if (!(err && typeof err === "object" && "code" in err && err.code === "P2002")) {
      throw err;
    }
  }

  if (created) {
    await cacheDelByPrefix("feed:");
  }

  return {
    liked: true,
    likeCount: await readLikeCount(input.targetType, input.targetId),
    likers: await listLikers(input.targetType, input.targetId, input.userId, 8),
  };
}

export async function removeLike(input: {
  userId: string;
  targetType: LikeTargetType;
  targetId: string;
}) {
  await assertTargetAccessible(input.targetType, input.targetId, input.userId);

  await prisma.$transaction(async (tx) => {
    const result = await tx.like.deleteMany({
      where: {
        userId: input.userId,
        targetType: input.targetType,
        targetId: input.targetId,
      },
    });
    if (result.count > 0) {
      await bumpLikeCount(tx, input.targetType, input.targetId, -1);
    }
  });

  await cacheDelByPrefix("feed:");

  return {
    liked: false,
    likeCount: Math.max(0, await readLikeCount(input.targetType, input.targetId)),
    likers: await listLikers(input.targetType, input.targetId, input.userId, 8),
  };
}

export async function listLikers(
  targetType: LikeTargetType,
  targetId: string,
  userId: string,
  limit = 50,
) {
  await assertTargetAccessible(targetType, targetId, userId);

  const likes = await prisma.like.findMany({
    where: { targetType, targetId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 100),
  });

  return likes.map((like) => authorPreview(like.user));
}
