import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceSubmissionThrottle } from "@/lib/submission-throttle";

const ROUTE_NAME = "false-cases.submit";
const DAILY_LIMIT = 5;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await enforceSubmissionThrottle(request, ROUTE_NAME, DAILY_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Submission limit reached for today" },
      { status: 429 }
    );
  }

  const body = await request.json();
  const {
    accusedFullName,
    accusedFullNameBn,
    caseReferenceNumber,
    district,
    description,
    alibiTimestamp,
    contactEmail,
    contactPhone,
    evidenceFiles,
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
    typeof accusedFullName !== "string" ||
    typeof description !== "string" ||
    !Array.isArray(evidenceFiles) ||
    typeof fileSha256 !== "string"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("false_case_evidence")
    .insert({
      submitted_by: authData.claims.sub,
      accused_full_name: accusedFullName,
      accused_full_name_bn: typeof accusedFullNameBn === "string" && accusedFullNameBn ? accusedFullNameBn : null,
      case_reference_number:
        typeof caseReferenceNumber === "string" && caseReferenceNumber
          ? caseReferenceNumber
          : null,
      district: typeof district === "string" && district ? district : null,
      description,
      alibi_timestamp:
        typeof alibiTimestamp === "string" && alibiTimestamp
          ? new Date(alibiTimestamp).toISOString()
          : null,
      contact_email:
        typeof contactEmail === "string" && contactEmail ? contactEmail : null,
      contact_phone:
        typeof contactPhone === "string" && contactPhone ? contactPhone : null,
      evidence_files: evidenceFiles,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to save submission" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();
  const { error: recordError } = await admin.from("forensic_checks").insert({
    related_table: "false_case_evidence",
    related_id: inserted.id,
    file_sha256: fileSha256,
    ela_score: typeof elaScore === "number" ? elaScore : null,
    ela_heatmap_ipfs_cid: typeof elaHeatmapCid === "string" ? elaHeatmapCid : null,
    phash: typeof phash === "string" ? phash : null,
    phash_matches: Array.isArray(phashMatches) ? phashMatches : [],
    ocr_raw_text: typeof ocrRawText === "string" ? ocrRawText : null,
    ocr_extracted_fields:
      ocrExtractedFields && typeof ocrExtractedFields === "object" ? ocrExtractedFields : {},
    risk_flag:
      riskFlag === "low" || riskFlag === "medium" || riskFlag === "high"
        ? riskFlag
        : "none",
    ipfs_cid: typeof ipfsCid === "string" ? ipfsCid : null,
    created_by: authData.claims.sub,
  });

  if (recordError) {
    return NextResponse.json({ error: recordError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
