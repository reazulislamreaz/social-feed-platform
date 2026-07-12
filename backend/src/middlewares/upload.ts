import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { getStorage } from "../storage/index.js";
import { AppError } from "../utils/errors.js";
import { processImageUpload } from "../utils/image.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Rough first pass — real check is magic-byte sniffing after upload
    if (!file.mimetype.startsWith("image/")) {
      cb(new AppError(400, "Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
}).single("image");

export function uploadImage(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}

/** After multer: validate bytes, strip EXIF, persist via storage driver. */
export async function persistUploadedImage(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!req.file?.buffer) {
      req.imageUrl = null;
      return next();
    }

    const processed = await processImageUpload(req.file.buffer);
    const stored = await getStorage().put({
      key: processed.key,
      body: processed.buffer,
      contentType: processed.contentType,
    });
    req.imageUrl = stored.url;
    next();
  } catch (err) {
    next(err);
  }
}

export function handleMulterError(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        new AppError(400, `Image must be under ${env.MAX_FILE_SIZE_MB}MB`),
      );
    }
    return next(new AppError(400, err.message));
  }
  next(err);
}
