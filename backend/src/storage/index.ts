import { env } from "../config/env.js";
import { LocalStorage } from "./local.js";
import { S3Storage } from "./s3.js";
import type { ObjectStorage } from "./types.js";

let storage: ObjectStorage | null = null;

export function getStorage(): ObjectStorage {
  if (!storage) {
    storage = env.STORAGE_DRIVER === "s3" ? new S3Storage() : new LocalStorage();
  }
  return storage;
}

export type { ObjectStorage, StoredFile } from "./types.js";
