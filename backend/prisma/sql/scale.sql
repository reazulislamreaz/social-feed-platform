-- Run after schema push to backfill denormalized counts and add a partial index.
-- pnpm exec prisma db execute --file prisma/sql/scale.sql --schema prisma/schema.prisma

UPDATE "Post" p
SET "likeCount" = (
  SELECT COUNT(*)::int FROM "Like" l
  WHERE l."targetType" = 'POST' AND l."targetId" = p.id
);

UPDATE "Comment" c
SET "likeCount" = (
  SELECT COUNT(*)::int FROM "Like" l
  WHERE l."targetType" = 'COMMENT' AND l."targetId" = c.id
);

UPDATE "Reply" r
SET "likeCount" = (
  SELECT COUNT(*)::int FROM "Like" l
  WHERE l."targetType" = 'REPLY' AND l."targetId" = r.id
);

-- Hot path: public feed pages (PRIVATE posts use authorId index instead)
CREATE INDEX IF NOT EXISTS "Post_public_createdAt_id_idx"
  ON "Post" ("createdAt" DESC, "id" DESC)
  WHERE "visibility" = 'PUBLIC';
