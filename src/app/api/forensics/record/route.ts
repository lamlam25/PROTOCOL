import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SUPPORTED_RELATED_TABLES = new Set(["false_case_evidence"]);

/**
 * Writes a forensic_checks row via the service-role client (RLS on that
 * table is admin-only by design — see CLAUDE.md). Ownership of the parent
 * row is verified through the RLS-scoped client first: the SELECT below
 * only succeeds if `related_id` actually belongs to the caller.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    relatedTable,
    relatedId,
    fileSha256,
    elaScore,
    elaHeatmapCid,
    phash,
    phashMatches,
    ocrRawText,
    ocrExtractedFields,
    riskFlag,
    ipfsCid,
  } = body ?? {};

  if (
    typeof relatedTable !== "string" ||
    !SUPPORTED_RELATED_TABLES.has(relatedTable) ||
    typeof relatedId !== "string" ||
    typeof fileSha256 !== "string"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: owned, error: ownedError } = await supabase
    .from("false_case_evidence")
    .select("id")
    .eq("id", relatedId)
    .maybeSingle();
  if (ownedError || !owned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("forensic_checks").insert({
    related_table: relatedTable,
    related_id: relatedId,
    file_sha256: fileSha256,
    ela_score: typeof elaScore === "number" ? elaScore : null,
    ela_heatmap_ipfs_cid: elaHeatmapCid ?? null,
    phash: phash ?? null,
    phash_matches: Array.isArray(phashMatches) ? phashMatches : [],
    ocr_raw_text: ocrRawText ?? null,
    ocr_extracted_fields: ocrExtractedFields ?? {},
    risk_flag: riskFlag ?? "none",
    ipfs_cid: ipfsCid ?? null,
    created_by: authData.claims.sub,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
