import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

const STORE_DIR = join(process.cwd(), ".local-ipfs-store");
const MOCK_CID_PATTERN = /^mock-[a-f0-9]{32}$/;

/**
 * Dev-only file server for the mock IPFS adapter (src/lib/storage/ipfs/mock-adapter.ts).
 * Serves whatever was written to .local-ipfs-store by that adapter's upload().
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  if (!MOCK_CID_PATTERN.test(cid)) {
    return NextResponse.json({ error: "Invalid CID" }, { status: 400 });
  }
  const filePath = join(STORE_DIR, cid);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readFile(filePath);
  let contentType = "application/octet-stream";
  const metaPath = join(STORE_DIR, `${cid}.meta.json`);
  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(await readFile(metaPath, "utf8"));
      if (typeof meta.type === "string" && meta.type) contentType = meta.type;
    } catch {
      // ignore malformed meta, fall back to octet-stream
    }
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": contentType },
  });
}
