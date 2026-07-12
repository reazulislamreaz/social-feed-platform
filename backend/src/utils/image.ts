import crypto from "node:crypto";
import sharp from "sharp";
import { AppError } from "./errors.js";

export type ImageKind = "jpeg" | "png" | "webp" | "gif";

const KIND_TO_MIME: Record<ImageKind, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Trust the file bytes, not the client-reported Content-Type. */
export function sniffImage(buffer: Buffer): ImageKind | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "gif";
  }

  return null;
}

export type ProcessedImage = {
  buffer: Buffer;
  contentType: string;
  extension: string;
  key: string;
};

/**
 * Validate magic bytes, strip metadata (via sharp), and build an opaque storage key.
 * GIFs are stored as-is so animation is preserved.
 */
export async function processImageUpload(raw: Buffer): Promise<ProcessedImage> {
  const kind = sniffImage(raw);
  if (!kind) {
    throw new AppError(400, "File is not a valid JPEG, PNG, WebP, or GIF image");
  }

  let buffer = raw;
  let extension: string = kind === "jpeg" ? "jpg" : kind;
  let contentType = KIND_TO_MIME[kind];

  if (kind !== "gif") {
    // rotate() honours EXIF orientation and drops the metadata block
    const pipeline = sharp(raw, { failOn: "truncated" }).rotate();

    if (kind === "jpeg") {
      buffer = await pipeline.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
      extension = "jpg";
      contentType = "image/jpeg";
    } else if (kind === "png") {
      buffer = await pipeline.png({ compressionLevel: 8 }).toBuffer();
      extension = "png";
      contentType = "image/png";
    } else {
      buffer = await pipeline.webp({ quality: 82 }).toBuffer();
      extension = "webp";
      contentType = "image/webp";
    }
  }

  const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  return { buffer, contentType, extension, key };
}
