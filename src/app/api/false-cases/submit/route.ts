import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  getEvidenceFileKind,
  MAX_EVIDENCE_FILES,
  MAX_EVIDENCE_TOTAL_BYTES,
} from "@/lib/evidence-files";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enforceSubmissionThrottle } from "@/lib/submission-throttle";
import { getIpfsAdapter } from "@/lib/storage/ipfs";
import {
  AiCheckerUnavailableError,
  checkImageWithPython,
} from "@/lib/forensics/ai-checker-server";

const ROUTE_NAME = "false-cases.submit";
const DAILY_LIMIT = 5;
const CID_PATTERN = /^[a-zA-Z0-9-]{20,120}$/;

const evidenceFileSchema = z.object({
  file_name: z.string().min(1).max(255),
  file_type: z.string().min(1).max(160),
  file_kind: z.enum(["image", "pdf", "video", "document", "audio"]),
  file_size: z.number().int().positive(),
  ipfs_cid: z.string().regex(CID_PATTERN),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  ela_score: z.number().min(0).max(100).nullable(),
  ela_heatmap_cid: z.string().regex(CID_PATTERN).nullable(),
  risk_flag: z.enum(["none", "low", "medium", "high"]),
  phash: z.string().regex(/^[a-f0-9]{16}$/i).nullable(),
  phash_matches: z
    .array(
      z.object({
        hammingDistance: z.number().int().nonnegative(),
        relatedId: z.string().optional(),
        relatedTable: z.string().optional(),
      })
    )
    .max(20),
  ocr_raw_text: z.string().max(100_000).nullable(),
  ocr_extracted_fields: z.object({
    nationalId: z.string().max(32),
    date: z.string().max(64),
  }),
  video_provenance: z
    .object({
      durationSeconds: z.number().nonnegative(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      frameTimestampSeconds: z.number().nonnegative(),
      aiAssessment: z.enum(["elevated", "inconclusive"]),
      provenanceStatus: z.enum(["metadata_signal", "unverified"]),
      metadataSignals: z.array(z.string().max(80)).max(20),
    })
    .nullable(),
  ai_image_analysis: z
    .object({
      status: z.enum([
        "likely_ai",
        "likely_real",
        "inconclusive",
        "unavailable",
      ]),
      aiProbability: z.number().min(0).max(1),
      realProbability: z.number().min(0).max(1),
      modelId: z.string().max(300).nullable(),
      reviewRequired: z.boolean(),
      source: z.enum(["original_image", "video_frame"]),
    })
    .nullable(),
  analysis_applicability: z.object({
    sha256: z.literal("complete"),
    ela: z.enum(["complete", "not_applicable"]),
    ocr: z.enum(["complete", "not_applicable"]),
    phash: z.enum(["complete", "not_applicable"]),
    ai_video: z.enum(["manual_review", "not_applicable"]),
    ai_image: z.enum([
      "complete",
      "unavailable",
      "not_applicable",
    ]),
  }),
});

const submissionSchema = z
  .object({
    submitterRelationship: z.enum(["self", "representative"]),
    accusedFullName: z.string().trim().min(2).max(200),
    accusedFullNameBn: z.string().trim().max(200).nullable(),
    caseReferenceNumber: z.string().trim().max(120).nullable(),
    district: z.string().trim().max(120).nullable(),
    description: z.string().trim().min(10).max(10_000),
    alibiTimestamp: z.string().max(64).nullable(),
    contactEmail: z.union([z.literal(""), z.email()]).nullable(),
    contactPhone: z.string().trim().max(40).nullable(),
    evidenceFiles: z
      .array(evidenceFileSchema)
      .min(1)
      .max(MAX_EVIDENCE_FILES),
  })
  .refine(
    (value) =>
      Boolean(value.contactEmail?.trim() || value.contactPhone?.trim()),
    { path: ["contactPhone"] }
  );

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (typeof userId !== "string") {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const allowed = await enforceSubmissionThrottle(request, ROUTE_NAME, DAILY_LIMIT);
  if (!allowed) {
    return NextResponse.json(
      { error: "Submission limit reached for today" },
      { status: 429 }
    );
  }

  const parsed = submissionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const body = parsed.data;
  const totalEvidenceBytes = body.evidenceFiles.reduce(
    (total, evidence) => total + evidence.file_size,
    0
  );
  if (totalEvidenceBytes > MAX_EVIDENCE_TOTAL_BYTES) {
    return NextResponse.json(
      { error: "Combined evidence size exceeds 100MB" },
      { status: 413 }
    );
  }

  for (const evidence of body.evidenceFiles) {
    const detectedKind = getEvidenceFileKind(
      evidence.file_type,
      evidence.file_name
    );
    if (detectedKind !== evidence.file_kind) {
      return NextResponse.json(
        { error: "Evidence file type mismatch" },
        { status: 400 }
      );
    }
    if (
      (evidence.file_kind !== "image" &&
        (evidence.ela_score !== null ||
          evidence.ela_heatmap_cid !== null ||
          evidence.risk_flag !== "none")) ||
      (evidence.file_kind !== "video" &&
        evidence.video_provenance !== null) ||
      (evidence.file_kind !== "image" &&
        evidence.file_kind !== "video" &&
        evidence.ai_image_analysis !== null)
    ) {
      return NextResponse.json(
        { error: "Invalid forensic applicability" },
        { status: 400 }
      );
    }

    try {
      const storedFile = await getIpfsAdapter().get(evidence.ipfs_cid);
      const storedBytes = await storedFile.arrayBuffer();
      const storedHash = createHash("sha256")
        .update(Buffer.from(storedBytes))
        .digest("hex");
      if (
        storedHash !== evidence.sha256 ||
        storedFile.size !== evidence.file_size
      ) {
        return NextResponse.json(
          { error: "Stored evidence fingerprint mismatch" },
          { status: 400 }
        );
      }

      if (evidence.file_kind === "image") {
        const verifiedAi = await checkImageWithPython(
          new Blob([storedBytes], { type: evidence.file_type }),
          evidence.file_name
        );
        evidence.ai_image_analysis = {
          status: verifiedAi.status,
          aiProbability: verifiedAi.ai_probability,
          realProbability: verifiedAi.real_probability,
          modelId: verifiedAi.model_id,
          reviewRequired: verifiedAi.review_required,
          source: "original_image",
        };
        if (verifiedAi.status === "likely_ai") {
          evidence.risk_flag = "high";
        } else if (
          verifiedAi.status === "inconclusive" &&
          evidence.risk_flag === "none"
        ) {
          evidence.risk_flag = "medium";
        }
      }
    } catch (error) {
      if (error instanceof AiCheckerUnavailableError) {
        return NextResponse.json(
          { error: error.message },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "Stored evidence could not be verified" },
        { status: 400 }
      );
    }
  }

  let alibiTimestamp: string | null = null;
  if (body.alibiTimestamp) {
    const parsedDate = new Date(body.alibiTimestamp);
    if (Number.isNaN(parsedDate.valueOf())) {
      return NextResponse.json(
        { error: "Invalid alibi timestamp" },
        { status: 400 }
      );
    }
    alibiTimestamp = parsedDate.toISOString();
  }

  const admin = createAdminClient();
  const { data: inserted, error: insertError } = await admin
    .from("false_case_evidence")
    .insert({
      submitted_by: userId,
      submitter_relationship: body.submitterRelationship,
      accused_full_name: body.accusedFullName,
      accused_full_name_bn: body.accusedFullNameBn || null,
      case_reference_number: body.caseReferenceNumber || null,
      district: body.district || null,
      description: body.description,
      alibi_timestamp: alibiTimestamp,
      contact_email: body.contactEmail || null,
      contact_phone: body.contactPhone || null,
      evidence_files: body.evidenceFiles,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to save submission" },
      { status: 500 }
    );
  }

  const forensicRows = body.evidenceFiles.map((evidence) => ({
    related_table: "false_case_evidence",
    related_id: inserted.id,
    file_name: evidence.file_name,
    file_type: evidence.file_type,
    file_kind: evidence.file_kind,
    file_sha256: evidence.sha256,
    ela_score: evidence.ela_score,
    ela_heatmap_ipfs_cid: evidence.ela_heatmap_cid,
    phash: evidence.phash,
    phash_matches: evidence.phash_matches,
    ocr_raw_text: evidence.ocr_raw_text,
    ocr_extracted_fields: evidence.ocr_extracted_fields,
    analysis_metadata: {
      applicability: evidence.analysis_applicability,
      videoProvenance: evidence.video_provenance,
      aiImageAnalysis: evidence.ai_image_analysis,
    },
    risk_flag: evidence.risk_flag,
    ipfs_cid: evidence.ipfs_cid,
    created_by: userId,
  }));

  const { error: recordError } = await admin
    .from("forensic_checks")
    .insert(forensicRows);

  if (recordError) {
    await admin.from("false_case_evidence").delete().eq("id", inserted.id);
    return NextResponse.json({ error: recordError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id });
}
