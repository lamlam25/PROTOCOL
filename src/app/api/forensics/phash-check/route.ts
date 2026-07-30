import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const phash = body?.phash;
  if (typeof phash !== "string" || !/^[a-f0-9]{16}$/.test(phash)) {
    return NextResponse.json({ error: "Invalid phash" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("forensic_checks")
    .select("related_table, related_id, phash")
    .not("phash", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const matches = (data ?? [])
    .filter((row) => row.phash)
    .map((row) => ({
      relatedTable: row.related_table,
      relatedId: row.related_id,
      hammingDistance: hammingDistanceHex(phash, row.phash as string),
    }))
    .filter((match) => match.hammingDistance <= DUPLICATE_HAMMING_THRESHOLD)
    .sort((a, b) => a.hammingDistance - b.hammingDistance);

  return NextResponse.json({ matches });
}
