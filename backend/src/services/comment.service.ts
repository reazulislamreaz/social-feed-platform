import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/errors.js";
import { authorPreview } from "../utils/serializers.js";
import { canViewPost, decodeCursor, encodeCursor, likePreview } from "./post.service.js";

export async function createComment(input: {
  postId: string;
  authorId: string;
  content: string;
}) {
  const post = await prisma.post.findUnique({ where: { id: input.postId } });
  if (!post || !canViewPost(post, input.authorId)) {
    throw new AppError(404, "Post not found");
  }

  const comment = await prisma.comment.create({
    data: {
      postId: input.postId,
      authorId: input.authorId,
      content: input.content,
    },
    include: { author: true },
  });

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: authorPreview(comment.author),
    likeCount: comment.likeCount,
    likedByMe: false,
    likers: [],
    replyCount: 0,
    replies: [],
  };
}

export async function listComments(opts: {
  postId: string;
  viewerId?: string;
  limit: number;
  cursor?: string;
}) {
  const post = await prisma.post.findUnique({ where: { id: opts.postId } });
  if (!post || !canViewPost(post, opts.viewerId)) {
    throw new AppError(404, "Post not found");
  }

  const cursor = decodeCursor(opts.cursor);

  const comments = await prisma.comment.findMany({
    where: {
      postId: opts.postId,
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { AND: [{ createdAt: cursor.createdAt }, { id: { lt: cursor.id } }] },
            ],
          }
        : {}),
    },
    include: {
      author: true,
      _count: { select: { replies: true } },
      replies: {
        take: 3,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { author: true },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: opts.limit + 1,
  });

  const hasMore = comments.length > opts.limit;
  const page = hasMore ? comments.slice(0, opts.limit) : comments;

  const commentIds = page.map((c) => c.id);
  const replyIds = page.flatMap((c) => c.replies.map((r) => r.id));
  const commentLikes = await likePreview("COMMENT", commentIds, opts.viewerId);
  const replyLikes = await likePreview("REPLY", replyIds, opts.viewerId);

  const items = page.map((comment) => {
    const preview = commentLikes.get(comment.id) ?? {
      likedByMe: false,
      likers: [],
    };
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: authorPreview(comment.author),
      likeCount: comment.likeCount,
      likedByMe: preview.likedByMe,
      likers: preview.likers,
      replyCount: comment._count.replies,
      replies: comment.replies.map((reply) => {
        const rPreview = replyLikes.get(reply.id) ?? {
          likedByMe: false,
          likers: [],
        };
        return {
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          author: authorPreview(reply.author),
          likeCount: reply.likeCount,
          likedByMe: rPreview.likedByMe,
          likers: rPreview.likers,
        };
      }),
    };
  });

  const last = page[page.length - 1];
  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

export async function createReply(input: {
  commentId: string;
  authorId: string;
  content: string;
}) {
  const comment = await prisma.comment.findUnique({
    where: { id: input.commentId },
    include: { post: true },
  });

  if (!comment || !canViewPost(comment.post, input.authorId)) {
    throw new AppError(404, "Comment not found");
  }

  const reply = await prisma.reply.create({
    data: {
      commentId: input.commentId,
      authorId: input.authorId,
      content: input.content,
    },
    include: { author: true },
  });

  return {
    id: reply.id,
    content: reply.content,
    createdAt: reply.createdAt,
    author: authorPreview(reply.author),
    likeCount: reply.likeCount,
    likedByMe: false,
    likers: [],
  };
}

export async function listReplies(opts: {
  commentId: string;
  viewerId?: string;
  limit: number;
  cursor?: string;
}) {
  const comment = await prisma.comment.findUnique({
    where: { id: opts.commentId },
    include: { post: true },
  });

  if (!comment || !canViewPost(comment.post, opts.viewerId)) {
    throw new AppError(404, "Comment not found");
  }

  const cursor = decodeCursor(opts.cursor);

  const replies = await prisma.reply.findMany({
    where: {
      commentId: opts.commentId,
      ...(cursor
        ? {
            OR: [
              { createdAt: { gt: cursor.createdAt } },
              { AND: [{ createdAt: cursor.createdAt }, { id: { gt: cursor.id } }] },
            ],
          }
        : {}),
    },
    include: { author: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: opts.limit + 1,
  });

  const hasMore = replies.length > opts.limit;
  const page = hasMore ? replies.slice(0, opts.limit) : replies;
  const likes = await likePreview(
    "REPLY",
    page.map((r) => r.id),
    opts.viewerId,
  );

  const items = page.map((reply) => {
    const preview = likes.get(reply.id) ?? { likedByMe: false, likers: [] };
    return {
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt,
      author: authorPreview(reply.author),
      likeCount: reply.likeCount,
      likedByMe: preview.likedByMe,
      likers: preview.likers,
    };
  });

  const last = page[page.length - 1];
  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}
