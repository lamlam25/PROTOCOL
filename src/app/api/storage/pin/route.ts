import { NextResponse, type NextRequest } from "next/server";
import { getIpfsAdapter } from "@/lib/storage/ipfs";
import { enforceSubmissionThrottle } from "@/lib/submission-throttle";
import { createClient } from "@/lib/supabase/server";
import {
  getEvidenceFileKind,
  getEvidenceFileLimit,
  hasValidEvidenceSignature,
} from "@/lib/evidence-files";

const DAILY_UPLOAD_LIMIT = 20;

/**
 * Server-only upload proxy — keeps the real Pinata JWT (Phase 9) off the
 * client. Uploads require a valid citizen/admin session and remain constrained
 * by file type, size, and a server-side daily IP throttle.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const allowed = await enforceSubmissionThrottle(
    request,
    "storage.pin",
    DAILY_UPLOAD_LIMIT
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Upload limit reached for today" },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  const filename = file instanceof File ? file.name : "evidence";
  const kind = getEvidenceFileKind(file.type, filename);
  if (!kind) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 415 }
    );
  }
  if (file.size > getEvidenceFileLimit(kind)) {
    return NextResponse.json(
      { error: "File exceeds the allowed size for this format" },
      { status: 413 }
    );
  }
  if (!(await hasValidEvidenceSignature(file, kind, filename))) {
    return NextResponse.json(
      { error: "File content does not match its declared format" },
      { status: 415 }
    );
  }

  const adapter = getIpfsAdapter();
  const result = await adapter.upload(file, {
    filename,
  });

  return NextResponse.json(result);
}
