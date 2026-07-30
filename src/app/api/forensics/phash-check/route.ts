import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enforceSubmissionThrottle } from "@/lib/submission-throttle";
import {
  hammingDistanceHex,
  DUPLICATE_HAMMING_THRESHOLD,
} from "@/lib/forensics/phash";

/**
 * Server-side duplicate lookup — the client posts its computed hash, never
 * the full hash table. Distances are computed in JS rather than SQL, which
 * is fine at this project's scale (hundreds, not millions, of rows).
 */
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
    "forensics.phash-check",
    10
  );
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit reached" }, { status: 429 });
  }

  const body = await request.json();
  const phash = body?.phash;
  if (typeof phash !== "string" || !/^[a-f0-9]{16}$/.test(phash)) {
    return NextResponse.json({ error: "Invalid phash" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("forensic_checks")
    .select("phash")
    .not("phash", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const matches = (data ?? [])
    .filter((row) => row.phash)
    .map((row) => ({
      hammingDistance: hammingDistanceHex(phash, row.phash as string),
    }))
    .filter((match) => match.hammingDistance <= DUPLICATE_HAMMING_THRESHOLD)
    .sort((a, b) => a.hammingDistance - b.hammingDistance);

  return NextResponse.json({ matches });
}
