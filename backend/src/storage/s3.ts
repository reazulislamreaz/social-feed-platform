import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import type { ObjectStorage, StoredFile } from "./types.js";

/** S3 / R2 / S3-compatible object storage for production uploads */
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
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    const publicBase = (env.S3_PUBLIC_URL || env.PUBLIC_ASSET_BASE_URL || "").replace(
      /\/$/,
      "",
    );
    const url = publicBase
      ? `${publicBase}/${input.key}`
      : `https://${this.bucket}.s3.${env.S3_REGION}.amazonaws.com/${input.key}`;

    return { url, key: input.key };
  }

  async delete(key: string): Promise<void> {
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch(() => undefined);
  }
}
