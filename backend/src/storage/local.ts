import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import type { ObjectStorage, StoredFile } from "./types.js";

export class LocalStorage implements ObjectStorage {
  private root: string;

  constructor() {
    this.root = path.resolve(process.cwd(), env.UPLOAD_DIR);
  }

  async ensureReady() {
    await fs.mkdir(this.root, { recursive: true });
  }

  async put(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredFile> {
    await this.ensureReady();
    const full = path.join(this.root, input.key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, input.body);

    const base = env.PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "");
    const url = base ? `${base}/uploads/${input.key}` : `/uploads/${input.key}`;
    return { url, key: input.key };
  }

  async delete(key: string): Promise<void> {
    const full = path.join(this.root, key);
    await fs.unlink(full).catch(() => undefined);
  }
}
