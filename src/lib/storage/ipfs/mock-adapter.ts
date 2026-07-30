import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import type { IpfsAdapter, IpfsUploadResult } from "./types";

const STORE_DIR = join(process.cwd(), ".local-ipfs-store");

async function ensureStoreDir() {
  if (!existsSync(STORE_DIR)) {
    await mkdir(STORE_DIR, { recursive: true });
  }
}

/**
 * Dev-only stand-in for real IPFS pinning. Every CID it returns is prefixed
 * "mock-" so the UI can badge it clearly — never silently indistinguishable
 * from a real pin. Served back via /api/dev/local-ipfs/[cid].
 */
export function createMockIpfsAdapter(): IpfsAdapter {
  return {
    async upload(file, opts) {
      await ensureStoreDir();
      const buffer = Buffer.from(await file.arrayBuffer());
      const hash = createHash("sha256").update(buffer).digest("hex");
      const cid = `mock-${hash.slice(0, 32)}`;
      await writeFile(join(STORE_DIR, cid), buffer);
      if (opts?.filename) {
        await writeFile(join(STORE_DIR, `${cid}.meta.json`), JSON.stringify({ filename: opts.filename, type: file.type }));
      }
      return {
        cid,
        size: buffer.byteLength,
        url: `/api/dev/local-ipfs/${cid}`,
        provider: "mock",
      } satisfies IpfsUploadResult;
    },

    async get(cid) {
      const buffer = await readFile(join(STORE_DIR, cid));
      return new Blob([buffer]);
    },

    isConfigured() {
      return true;
    },
  };
}
