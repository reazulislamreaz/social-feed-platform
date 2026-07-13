import { Prisma, Visibility } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { cacheDelByPrefix, cacheGet, cacheSet } from "../config/redis.js";
import { AppError } from "../utils/errors.js";
import { authorPreview, publicAssetUrl } from "../utils/serializers.js";

function decodeCursor(cursor?: string): { createdAt: Date; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as { createdAt: string; id: string };
    return { createdAt: new Date(parsed.createdAt), id: parsed.id };
  } catch {
    throw new AppError(400, "Invalid cursor");
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString(
    "base64url",
  );
}

type LikePreview = {
  likedByMe: boolean;
  likers: { id: string; firstName: string; lastName: string }[];
};

/**
 * Feed-scale like enrichment: use denormalized likeCount on the parent row.
 * This only loads "liked by me" + a short liker preview (no GROUP BY).
 */
async function likePreview(
  targetType: "POST" | "COMMENT" | "REPLY",
  targetIds: string[],
  userId?: string,
): Promise<Map<string, LikePreview>> {
  const map = new Map<string, LikePreview>();
  for (const id of targetIds) {
    map.set(id, { likedByMe: false, likers: [] });
  }
  if (targetIds.length === 0) return map;

  // One indexed lookup per target keeps popular posts from starving the rest
  const recentBatches = await Promise.all(
    targetIds.map((targetId) =>
      prisma.like.findMany({
        where: { targetType, targetId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ),
  );

  for (const rows of recentBatches) {
    for (const row of rows) {
      const entry = map.get(row.targetId);
      if (!entry) continue;
      entry.likers.push(authorPreview(row.user));
    }
  }

  if (userId) {
    const mine = await prisma.like.findMany({
      where: { userId, targetType, targetId: { in: targetIds } },
      select: { targetId: true },
    });
    for (const row of mine) {
      const entry = map.get(row.targetId);
      if (entry) entry.likedByMe = true;
    }
  }

  return map;
}

function canViewPost(
  post: { visibility: Visibility; authorId: string },
  viewerId?: string,
): boolean {
  return post.visibility === Visibility.PUBLIC || post.authorId === viewerId;
}

function cursorClause(cursor: { createdAt: Date; id: string }): Prisma.PostWhereInput {
  return {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { AND: [{ createdAt: cursor.createdAt }, { id: { lt: cursor.id } }] },
    ],
  };
}

export async function createPost(input: {
  authorId: string;
  content: string;
  visibility: "PUBLIC" | "PRIVATE";
  imageUrl?: string | null;
}) {
  const post = await prisma.post.create({
    data: {
      authorId: input.authorId,
      content: input.content,
      visibility: input.visibility,
      imageUrl: input.imageUrl ?? null,
    },
    include: { author: true },
  });

  await cacheDelByPrefix("feed:");

  return {
    ...serializePost(post),
    likeCount: post.likeCount,
    likedByMe: false,
    likers: [],
    commentCount: 0,
  };
}

function serializePost(post: {
  id: string;
  content: string;
  imageUrl: string | null;
  visibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: { id: string; firstName: string; lastName: string };
}) {
  return {
    id: post.id,
    content: post.content,
    imageUrl: publicAssetUrl(post.imageUrl),
    visibility: post.visibility,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: authorPreview(post.author),
  };
}

export async function getFeed(opts: {
  viewerId?: string;
  limit: number;
  cursor?: string;
}) {
  const cacheKey = `feed:${opts.viewerId ?? "anon"}:${opts.cursor ?? ""}:${opts.limit}`;
  const cached = await cacheGet<{
    items: unknown[];
    nextCursor: string | null;
  }>(cacheKey);
  if (cached) return cached;

  const cursor = decodeCursor(opts.cursor);

  // Public timeline uses (visibility, createdAt, id). Private posts for the
  // viewer are merged in a second cheap author-scoped query.
  const publicWhere: Prisma.PostWhereInput = {
    visibility: Visibility.PUBLIC,
    ...(cursor ? cursorClause(cursor) : {}),
  };

  const publicPosts = await prisma.post.findMany({
    where: publicWhere,
    include: {
      author: true,
      _count: { select: { comments: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: opts.limit + 1,
  });

  let privatePosts: typeof publicPosts = [];
  if (opts.viewerId) {
    privatePosts = await prisma.post.findMany({
      where: {
        authorId: opts.viewerId,
        visibility: Visibility.PRIVATE,
        ...(cursor ? cursorClause(cursor) : {}),
      },
      include: {
        author: true,
        _count: { select: { comments: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: opts.limit + 1,
    });
  }

  const merged = [...publicPosts, ...privatePosts].sort((a, b) => {
    const byTime = b.createdAt.getTime() - a.createdAt.getTime();
    if (byTime !== 0) return byTime;
    return b.id < a.id ? -1 : b.id > a.id ? 1 : 0;
  });

  const hasMore = merged.length > opts.limit;
  const page = hasMore ? merged.slice(0, opts.limit) : merged;
  const previews = await likePreview(
    "POST",
    page.map((p) => p.id),
    opts.viewerId,
  );

  const items = page.map((post) => {
    const preview = previews.get(post.id) ?? { likedByMe: false, likers: [] };
    return {
      ...serializePost(post),
      likeCount: post.likeCount,
      likedByMe: preview.likedByMe,
      likers: preview.likers,
      commentCount: post._count.comments,
    };
  });

  const last = page[page.length - 1];
  const result = {
    items,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };

  await cacheSet(cacheKey, result, env.FEED_CACHE_TTL_SECONDS);
  return result;
}

export async function getPostById(postId: string, viewerId?: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      _count: { select: { comments: true } },
    },
  });

  if (!post || !canViewPost(post, viewerId)) {
    throw new AppError(404, "Post not found");
  }

  const previews = await likePreview("POST", [post.id], viewerId);
  const preview = previews.get(post.id) ?? { likedByMe: false, likers: [] };

  return {
    ...serializePost(post),
    likeCount: post.likeCount,
    likedByMe: preview.likedByMe,
    likers: preview.likers,
    commentCount: post._count.comments,
  };
}

export async function deletePost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new AppError(404, "Post not found");
  }
  if (post.authorId !== userId) {
    throw new AppError(403, "You can only delete your own posts", "FORBIDDEN");
  }

  // Polymorphic likes have no FK — clean them up before cascade-deleting the tree
  const comments = await prisma.comment.findMany({
    where: { postId },
    select: { id: true, replies: { select: { id: true } } },
  });
  const commentIds = comments.map((c) => c.id);
  const replyIds = comments.flatMap((c) => c.replies.map((r) => r.id));

  await prisma.$transaction([
    prisma.like.deleteMany({
      where: {
        OR: [
          { targetType: "POST", targetId: postId },
          ...(commentIds.length
            ? [{ targetType: "COMMENT" as const, targetId: { in: commentIds } }]
            : []),
          ...(replyIds.length
            ? [{ targetType: "REPLY" as const, targetId: { in: replyIds } }]
            : []),
        ],
      },
    }),
    prisma.post.delete({ where: { id: postId } }),
  ]);
  await cacheDelByPrefix("feed:");
}

export { canViewPost, likePreview, encodeCursor, decodeCursor };
