import { LocalStorage } from "./local.js";
import type { ObjectStorage } from "./types.js";

let storage: ObjectStorage | null = null;

// Images are always stored on local disk and served from /uploads.
export function getStorage(): ObjectStorage {
  if (!storage) {
    storage = new LocalStorage();
  }
  return storage;
}

export type { ObjectStorage, StoredFile } from "./types.js";
