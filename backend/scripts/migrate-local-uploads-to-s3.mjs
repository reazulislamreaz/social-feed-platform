// Migrate legacy local-disk post images (/uploads/... rows) to S3 and
// repoint the DB rows, so images survive ephemeral/multi-host deploys.
//
// Dry run (default):  node scripts/migrate-local-uploads-to-s3.mjs
// Apply changes:      node scripts/migrate-local-uploads-to-s3.mjs --apply
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const apply = process.argv.includes("--apply");
const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");

if (!bucket) {
  console.error("Missing S3_BUCKET / AWS_S3_BUCKET_NAME in env");
  process.exit(1);
}

const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
const s3 = new S3Client({ region });
const prisma = new PrismaClient();

const posts = await prisma.post.findMany({
  where: { imageUrl: { contains: "/uploads/" } },
  select: { id: true, imageUrl: true },
});

console.log(`${posts.length} post(s) with legacy /uploads/ image URLs${apply ? "" : " (dry run — pass --apply to migrate)"}`);

for (const post of posts) {
  const rel = post.imageUrl.slice(post.imageUrl.indexOf("/uploads/") + "/uploads/".length);
  const file = path.join(uploadDir, rel);
  if (!fs.existsSync(file)) {
    console.log(`SKIP ${post.id}: local file not found (${file})`);
    continue;
  }

  const key = `posts/${rel}`;
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  const ext = path.extname(rel).slice(1).toLowerCase();

  if (!apply) {
    console.log(`WOULD migrate ${post.id}: ${post.imageUrl} -> ${url}`);
    continue;
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.readFileSync(file),
      ContentType: MIME[ext] ?? "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const head = await fetch(url, { method: "HEAD" });
  if (head.status !== 200) {
    console.log(`FAIL ${post.id}: uploaded but ${url} returned ${head.status} — DB row left unchanged`);
    continue;
  }
  await prisma.post.update({ where: { id: post.id }, data: { imageUrl: url } });
  console.log(`OK   ${post.id}: ${post.imageUrl} -> ${url}`);
}

await prisma.$disconnect();
