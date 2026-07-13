import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env, s3PublicBaseUrl } from "../config/env.js";
import type { ObjectStorage, StoredFile } from "./types.js";

/** S3 / R2 / S3-compatible object storage for persistent production uploads */
export class S3Storage implements ObjectStorage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET!;
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(env.S3_ENDPOINT),
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID!,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }

  async put(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredFile> {
    // Prefix keeps post media tidy in the bucket
    const key = input.key.startsWith("posts/") ? input.key : `posts/${input.key}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    const url = `${s3PublicBaseUrl()}/${key}`;
    return { url, key };
  }

  async delete(key: string): Promise<void> {
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch(() => undefined);
  }
}
