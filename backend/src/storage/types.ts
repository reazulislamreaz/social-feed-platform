export type StoredFile = {
  /** Public URL or path the API returns to clients */
  url: string;
  /** Storage key / relative filename (for deletes) */
  key: string;
};

export interface ObjectStorage {
  put(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}
