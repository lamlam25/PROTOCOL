import { NextResponse, type NextRequest } from "next/server";
import {
  getEvidenceFileKind,
  getEvidenceFileLimit,
  hasValidEvidenceSignature,
} from "@/lib/evidence-files";
import {
  AiCheckerUnavailableError,
  checkImageWithPython,
} from "@/lib/forensics/ai-checker-server";
import { createClient } from "@/lib/supabase/server";
import { enforceSubmissionThrottle } from "@/lib/submission-throttle";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const allowed = await enforceSubmissionThrottle(
    request,
    "forensics.ai-check",
    15
  );
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit reached" }, { status: 429 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }
  const filename = file instanceof File ? file.name : "evidence.jpg";
  const kind = getEvidenceFileKind(file.type, filename);
  if (kind !== "image") {
    return NextResponse.json(
      { error: "AI screening accepts image files only" },
      { status: 415 }
    );
  }
  if (
    file.size > getEvidenceFileLimit(kind) ||
    !(await hasValidEvidenceSignature(file, kind, filename))
  ) {
    return NextResponse.json({ error: "Invalid image file" }, { status: 415 });
  }

  try {
    const result = await checkImageWithPython(file, filename);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AiCheckerUnavailableError) {
      return NextResponse.json(
        { error: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "AI image screening failed" },
      { status: 500 }
    );
  }
}
