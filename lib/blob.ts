import { del, get, put } from "@vercel/blob";
import type { ImageStore } from "@/lib/scraps";
import { memoryImageStore } from "@/lib/scraps";

export function getImageStore(): ImageStore {
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
    return vercelImageStore;
  }
  return memoryImageStore;
}

const vercelImageStore: ImageStore = {
  async put(pathname, data, contentType) {
    await put(pathname, data, {
      access: "private",
      contentType,
    });
  },
  async get(pathname) {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const chunks: Buffer[] = [];
    const reader = result.stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    return {
      bytes: Buffer.concat(chunks),
      contentType: result.blob.contentType || "application/octet-stream",
    };
  },
  async delete(pathname) {
    await del(pathname);
  },
};
