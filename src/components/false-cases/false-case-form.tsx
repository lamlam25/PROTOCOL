"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  Check,
  CheckCircle2,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  ShieldQuestion,
  Trash2,
  TriangleAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  formatFileSize,
  getEvidenceFileKind,
  getEvidenceFileLimit,
  MAX_EVIDENCE_FILES,
  MAX_EVIDENCE_TOTAL_BYTES,
  type EvidenceFileKind,
} from "@/lib/evidence-files";
import { sha256Hex } from "@/lib/forensics/file-hash";
import { computeELA } from "@/lib/forensics/ela";
import { computeDHash } from "@/lib/forensics/phash";
import { runOcr } from "@/lib/forensics/ocr";
import { prepareVisualPreview } from "@/lib/forensics/media-preview";
import type {
  AiImageAnalysis,
  ElaResult,
  OcrResult,
  RiskFlag,
} from "@/lib/forensics/types";
import type { VideoProvenanceResult } from "@/lib/forensics/media-preview";
import { UploadDropzone } from "@/components/forensics/upload-dropzone";
import { ElaPreview } from "@/components/forensics/ela-preview";
import { OcrFieldReview } from "@/components/forensics/ocr-field-review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    accusedFullName: z.string().min(2),
    accusedFullNameBn: z.string(),
    caseReferenceNumber: z.string(),
    district: z.string(),
    description: z.string().min(10),
    alibiTimestamp: z.string(),
    contactEmail: z.union([z.literal(""), z.email()]),
    contactPhone: z.string(),
  })
  .refine(
    (values) => Boolean(values.contactEmail.trim() || values.contactPhone.trim()),
    { path: ["contactPhone"] }
  );

type FormValues = z.infer<typeof schema>;
type SubmitterRelationship = "self" | "representative";

interface PhashMatch {
  hammingDistance: number;
  relatedId?: string;
  relatedTable?: string;
}

interface EvidenceBase {
  id: string;
  file: File;
  kind: EvidenceFileKind;
}

type EvidenceAnalysis =
  | (EvidenceBase & { status: "processing"; progress: number })
  | (EvidenceBase & { status: "error"; message: string })
  | (EvidenceBase & {
      status: "done";
      sha256: string;
      ela: ElaResult | null;
      phash: string | null;
      phashMatches: PhashMatch[];
      ocr: OcrResult | null;
      correctedFields: { nationalId: string; date: string };
      videoProvenance: VideoProvenanceResult | null;
      aiImageAnalysis: AiImageAnalysis | null;
    });

const FILE_ICON: Record<EvidenceFileKind, typeof FileText> = {
  image: FileImage,
  pdf: FileText,
  video: FileVideo,
  document: FileText,
  audio: FileAudio,
};

function newEvidenceId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

async function runAiImageCheck(
  blob: Blob,
  filename: string,
  source: AiImageAnalysis["source"]
): Promise<AiImageAnalysis> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  try {
    const response = await fetch("/api/forensics/ai-check", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("AI checker unavailable");
    const result = (await response.json()) as {
      status: "likely_ai" | "likely_real" | "inconclusive";
      ai_probability: number;
      real_probability: number;
      model_id: string;
      review_required: boolean;
    };
    return {
      status: result.status,
      aiProbability: result.ai_probability,
      realProbability: result.real_probability,
      modelId: result.model_id,
      reviewRequired: result.review_required,
      source,
    };
  } catch {
    return {
      status: "unavailable",
      aiProbability: 0,
      realProbability: 0,
      modelId: null,
      reviewRequired: true,
      source,
    };
  }
}

function mergeImageRisk(
  elaRisk: RiskFlag,
  aiAnalysis: AiImageAnalysis | null
): RiskFlag {
  if (aiAnalysis?.status === "likely_ai") return "high";
  if (aiAnalysis?.status === "inconclusive" && elaRisk === "none") {
    return "medium";
  }
  return elaRisk;
}

export function FalseCaseForm() {
  const t = useTranslations("falseCases.form");
  const tf = useTranslations("forensics");

  const [relationship, setRelationship] =
    useState<SubmitterRelationship | null>(null);
  const [evidence, setEvidence] = useState<EvidenceAnalysis[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "error" | "done"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      accusedFullName: "",
      accusedFullNameBn: "",
      caseReferenceNumber: "",
      district: "",
      description: "",
      alibiTimestamp: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  function updateEvidence(
    id: string,
    update: (entry: EvidenceAnalysis) => EvidenceAnalysis
  ) {
    setEvidence((current) =>
      current.map((entry) => (entry.id === id ? update(entry) : entry))
    );
  }

  async function analyzeFile(
    id: string,
    file: File,
    kind: EvidenceFileKind
  ) {
    try {
      const shaPromise = sha256Hex(file);
      const preview = await prepareVisualPreview(file, kind);
      const elaPromise =
        kind === "image" ? computeELA(file) : Promise.resolve(null);
      const phashPromise = preview.blob
        ? computeDHash(preview.blob)
        : Promise.resolve(null);
      const ocrPromise =
        preview.blob && (kind === "image" || kind === "pdf")
          ? runOcr(preview.blob, (progress) =>
              updateEvidence(id, (entry) =>
                entry.status === "processing"
                  ? { ...entry, progress }
                  : entry
              )
            )
          : Promise.resolve(null);
      const aiCheckPromise =
        preview.blob && (kind === "image" || kind === "video")
          ? runAiImageCheck(
              preview.blob,
              kind === "image" ? file.name : `${file.name}.frame.jpg`,
              kind === "image" ? "original_image" : "video_frame"
            )
          : Promise.resolve(null);

      const [sha256, ela, phash, ocr, aiImageAnalysis] = await Promise.all([
        shaPromise,
        elaPromise,
        phashPromise,
        ocrPromise,
        aiCheckPromise,
      ]);

      const matchesResult = phash
        ? await fetch("/api/forensics/phash-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phash }),
          })
            .then((response) =>
              response.ok ? response.json() : { matches: [] }
            )
            .catch(() => ({ matches: [] as PhashMatch[] }))
        : { matches: [] as PhashMatch[] };

      updateEvidence(id, () => ({
        id,
        file,
        kind,
        status: "done",
        sha256,
        ela,
        phash,
        phashMatches: matchesResult.matches ?? [],
        ocr,
        correctedFields: {
          nationalId: ocr?.extractedFields.nationalId ?? "",
          date: ocr?.extractedFields.date ?? "",
        },
        videoProvenance: preview.videoProvenance,
        aiImageAnalysis,
      }));
    } catch (error) {
      updateEvidence(id, () => ({
        id,
        file,
        kind,
        status: "error",
        message:
          error instanceof Error ? error.message : t("errors.analysisFailed"),
      }));
    }
  }

  async function handleFilesSelected(selectedFiles: File[]) {
    setSelectionError(null);
    const existingKeys = new Set(
      evidence.map(
        ({ file }) => `${file.name}:${file.size}:${file.lastModified}`
      )
    );
    const uniqueFiles = selectedFiles.filter(
      (file) =>
        !existingKeys.has(`${file.name}:${file.size}:${file.lastModified}`)
    );

    if (evidence.length + uniqueFiles.length > MAX_EVIDENCE_FILES) {
      setSelectionError(t("errors.tooManyFiles", { max: MAX_EVIDENCE_FILES }));
      return;
    }

    const currentBytes = evidence.reduce(
      (total, entry) => total + entry.file.size,
      0
    );
    const selectedBytes = uniqueFiles.reduce(
      (total, file) => total + file.size,
      0
    );
    if (currentBytes + selectedBytes > MAX_EVIDENCE_TOTAL_BYTES) {
      setSelectionError(t("errors.totalTooLarge"));
      return;
    }

    const pending: (EvidenceBase & {
      status: "processing";
      progress: number;
    })[] = [];
    for (const file of uniqueFiles) {
      const kind = getEvidenceFileKind(file.type, file.name);
      if (!kind) {
        setSelectionError(t("errors.unsupportedFile", { name: file.name }));
        continue;
      }
      if (file.size > getEvidenceFileLimit(kind)) {
        setSelectionError(t("errors.fileTooLarge", { name: file.name }));
        continue;
      }
      pending.push({
        id: newEvidenceId(),
        file,
        kind,
        status: "processing",
        progress: 0,
      });
    }

    if (!pending.length) return;
    setEvidence((current) => [...current, ...pending]);
    for (const entry of pending) {
      await analyzeFile(entry.id, entry.file, entry.kind);
    }
  }

  function removeEvidence(id: string) {
    setEvidence((current) => current.filter((entry) => entry.id !== id));
    setSelectionError(null);
  }

  async function uploadEvidence(entry: Extract<EvidenceAnalysis, { status: "done" }>) {
    const uploadForm = new FormData();
    uploadForm.append("file", entry.file);
    const uploadResponse = await fetch("/api/storage/pin", {
      method: "POST",
      body: uploadForm,
    });
    if (!uploadResponse.ok) throw new Error(t("errors.uploadFailed"));
    const upload = (await uploadResponse.json()) as {
      cid: string;
      sha256: string;
    };
    if (upload.sha256 !== entry.sha256) {
      throw new Error(t("errors.uploadFailed"));
    }

    let heatmapCid: string | null = null;
    if (entry.ela) {
      const heatmapForm = new FormData();
      heatmapForm.append(
        "file",
        entry.ela.heatmapBlob,
        `${entry.id}-ela-heatmap.png`
      );
      const heatmapResponse = await fetch("/api/storage/pin", {
        method: "POST",
        body: heatmapForm,
      });
      if (heatmapResponse.ok) {
        heatmapCid = ((await heatmapResponse.json()) as { cid: string }).cid;
      }
    }

    return {
      file_name: entry.file.name,
      file_type: entry.file.type || "application/octet-stream",
      file_kind: entry.kind,
      file_size: entry.file.size,
      ipfs_cid: upload.cid,
      sha256: upload.sha256,
      ela_score: entry.ela?.score ?? null,
      ela_heatmap_cid: heatmapCid,
      risk_flag:
        entry.kind === "image"
          ? mergeImageRisk(
              entry.ela?.riskFlag ?? "none",
              entry.aiImageAnalysis
            )
          : "none",
      phash: entry.phash,
      phash_matches: entry.phashMatches,
      ocr_raw_text: entry.ocr?.text ?? null,
      ocr_extracted_fields: entry.correctedFields,
      video_provenance: entry.videoProvenance,
      ai_image_analysis: entry.aiImageAnalysis,
      analysis_applicability: {
        sha256: "complete",
        ela: entry.kind === "image" ? "complete" : "not_applicable",
        ocr:
          entry.kind === "image" || entry.kind === "pdf"
            ? "complete"
            : "not_applicable",
        phash: entry.phash ? "complete" : "not_applicable",
        ai_video:
          entry.kind === "video" ? "manual_review" : "not_applicable",
        ai_image:
          entry.kind === "image" || entry.kind === "video"
            ? entry.aiImageAnalysis?.status === "unavailable"
              ? "unavailable"
              : "complete"
            : "not_applicable",
      },
    };
  }

  async function onSubmit(values: FormValues) {
    const completed = evidence.filter(
      (entry): entry is Extract<EvidenceAnalysis, { status: "done" }> =>
        entry.status === "done"
    );
    if (!relationship || !completed.length || completed.length !== evidence.length) {
      return;
    }
    setSubmitState("submitting");
    setSubmitError(null);

    try {
      const evidenceFiles = [];
      for (const entry of completed) {
        evidenceFiles.push(await uploadEvidence(entry));
      }

      const submitResponse = await fetch("/api/false-cases/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submitterRelationship: relationship,
          accusedFullName: values.accusedFullName,
          accusedFullNameBn: values.accusedFullNameBn || null,
          caseReferenceNumber: values.caseReferenceNumber || null,
          district: values.district || null,
          description: values.description,
          alibiTimestamp: values.alibiTimestamp || null,
          contactEmail: values.contactEmail || null,
          contactPhone: values.contactPhone || null,
          evidenceFiles,
        }),
      });
      if (!submitResponse.ok) {
        const payload = (await submitResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? t("errors.submitFailed"));
      }

      const submitted = (await submitResponse.json()) as { id: string };
      setSubmissionId(submitted.id);
      setSubmitState("done");
    } catch (error) {
      setSubmitState("error");
      setSubmitError(
        error instanceof Error ? error.message : t("errors.submitFailed")
      );
    }
  }

  if (submitState === "done") {
    return (
      <Alert>
        <CheckCircle2 />
        <AlertTitle>{t("successTitle")}</AlertTitle>
        <AlertDescription>
          {t("successDescription")}
          {submissionId && (
            <span className="mt-2 block font-mono font-medium text-foreground">
              {t("successReference", {
                reference: submissionId.slice(0, 8).toUpperCase(),
              })}
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const hasPendingEvidence = evidence.some(
    (entry) => entry.status === "processing"
  );
  const hasInvalidEvidence = evidence.some((entry) => entry.status === "error");
  const hasUnavailableAiCheck = evidence.some(
    (entry) =>
      entry.status === "done" &&
      (entry.kind === "image" || entry.kind === "video") &&
      entry.aiImageAnalysis?.status === "unavailable"
  );
  const selectedFiles = evidence.map((entry) => entry.file);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-base font-semibold text-foreground">
          {t("victimQuestion")}
        </legend>
        <p className="text-sm text-muted-foreground">
          {t("victimQuestionDescription")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["self", "representative"] as const).map((option) => {
            const Icon = option === "self" ? UserRound : UsersRound;
            const selected = relationship === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setRelationship(option)}
                className={cn(
                  "flex min-h-20 items-center gap-3 rounded-md border p-4 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {selected ? <Check className="size-4" /> : <Icon className="size-4" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {t(`victimOptions.${option}.title`)}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t(`victimOptions.${option}.description`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {relationship && (
        <>
          <section className="space-y-3 border-t border-border pt-7">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {t("evidenceLabel")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("evidenceDescription")}
              </p>
            </div>
            <UploadDropzone
              files={selectedFiles}
              onFilesSelected={handleFilesSelected}
              disabled={
                hasPendingEvidence || evidence.length >= MAX_EVIDENCE_FILES
              }
            />
            {selectionError && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertDescription>{selectionError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {evidence.map((entry) => {
                const Icon = FILE_ICON[entry.kind];
                return (
                  <article
                    key={entry.id}
                    className="rounded-md border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center bg-muted text-muted-foreground">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {entry.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tf(`fileKinds.${entry.kind}`)} ·{" "}
                          {formatFileSize(entry.file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeEvidence(entry.id)}
                        disabled={submitState === "submitting"}
                        title={t("removeFile")}
                        aria-label={t("removeFile")}
                      >
                        <Trash2 />
                      </Button>
                    </div>

                    {entry.status === "processing" && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {t("analyzing")}
                        </p>
                        <Progress value={entry.progress * 100} />
                      </div>
                    )}

                    {entry.status === "error" && (
                      <Alert variant="destructive" className="mt-4">
                        <TriangleAlert />
                        <AlertDescription>{entry.message}</AlertDescription>
                      </Alert>
                    )}

                    {entry.status === "done" && (
                      <div className="mt-4 space-y-5 border-t border-border pt-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {tf("checks.sha256")} · {tf("status.complete")}
                          </Badge>
                          <Badge variant="outline">
                            {tf("checks.ela")} ·{" "}
                            {entry.ela
                              ? tf("status.complete")
                              : tf("status.notApplicable")}
                          </Badge>
                          <Badge variant="outline">
                            {tf("checks.ocr")} ·{" "}
                            {entry.ocr
                              ? tf("status.complete")
                              : tf("status.notApplicable")}
                          </Badge>
                          <Badge variant="outline">
                            {tf("checks.phash")} ·{" "}
                            {entry.phash
                              ? tf("status.complete")
                              : tf("status.notApplicable")}
                          </Badge>
                          <Badge variant="outline">
                            {tf("checks.aiImage")} ·{" "}
                            {entry.aiImageAnalysis?.status === "unavailable"
                              ? tf("status.unavailable")
                              : entry.aiImageAnalysis
                                ? tf("status.complete")
                                : tf("status.notApplicable")}
                          </Badge>
                        </div>

                        {entry.ela && (
                          <ElaPreview
                            originalFile={entry.file}
                            result={entry.ela}
                          />
                        )}
                        {entry.ocr && (
                          <OcrFieldReview
                            idPrefix={`ocr-${entry.id}`}
                            result={entry.ocr}
                            onFieldsChange={(fields) =>
                              updateEvidence(entry.id, (current) =>
                                current.status === "done"
                                  ? {
                                      ...current,
                                      correctedFields: fields,
                                    }
                                  : current
                              )
                            }
                          />
                        )}
                        {entry.videoProvenance && (
                          <Alert
                            variant={
                              entry.videoProvenance.aiAssessment === "elevated"
                                ? "destructive"
                                : "default"
                            }
                          >
                            <ShieldQuestion />
                            <AlertTitle>
                              {tf(
                                `video.assessment.${entry.videoProvenance.aiAssessment}.title`
                              )}
                            </AlertTitle>
                            <AlertDescription>
                              {tf(
                                `video.assessment.${entry.videoProvenance.aiAssessment}.description`
                              )}
                              <span className="mt-2 block text-xs">
                                {tf("video.metadata", {
                                  width: entry.videoProvenance.width,
                                  height: entry.videoProvenance.height,
                                  duration:
                                    entry.videoProvenance.durationSeconds.toFixed(
                                      1
                                    ),
                                })}
                              </span>
                            </AlertDescription>
                          </Alert>
                        )}
                        {entry.aiImageAnalysis && (
                          <Alert
                            variant={
                              entry.aiImageAnalysis.status === "likely_ai"
                                ? "destructive"
                                : "default"
                            }
                          >
                            <ShieldQuestion />
                            <AlertTitle>
                              {tf(
                                `aiImage.assessment.${entry.aiImageAnalysis.status}.title`
                              )}
                            </AlertTitle>
                            <AlertDescription>
                              {tf(
                                `aiImage.assessment.${entry.aiImageAnalysis.status}.description`
                              )}
                              {entry.aiImageAnalysis.status !== "unavailable" && (
                                <span className="mt-2 block text-xs">
                                  {tf("aiImage.score", {
                                    score: Math.round(
                                      entry.aiImageAnalysis.aiProbability * 100
                                    ),
                                  })}
                                </span>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}
                        {entry.phashMatches.length > 0 && (
                          <Alert variant="destructive">
                            <TriangleAlert />
                            <AlertTitle>{t("duplicateWarningTitle")}</AlertTitle>
                            <AlertDescription>
                              {t("duplicateWarningDescription")}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-7">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {t("detailsTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("detailsDescription")}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="accusedFullName">{t("accusedFullName")}</Label>
                <Input id="accusedFullName" {...register("accusedFullName")} />
                {errors.accusedFullName && (
                  <p className="text-xs text-destructive">
                    {t("errors.required")}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accusedFullNameBn">
                  {t("accusedFullNameBn")}
                </Label>
                <Input
                  id="accusedFullNameBn"
                  {...register("accusedFullNameBn")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="caseReferenceNumber">
                  {t("caseReferenceNumber")}
                </Label>
                <Input
                  id="caseReferenceNumber"
                  {...register("caseReferenceNumber")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="district">{t("district")}</Label>
                <Input id="district" {...register("district")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Textarea
                  id="description"
                  rows={4}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {t("errors.descriptionTooShort")}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alibiTimestamp">{t("alibiTimestamp")}</Label>
                <Input
                  id="alibiTimestamp"
                  type="datetime-local"
                  {...register("alibiTimestamp")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
                <Input id="contactPhone" {...register("contactPhone")} />
                {errors.contactPhone && (
                  <p className="text-xs text-destructive">
                    {t("errors.contactRequired")}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register("contactEmail")}
                />
                {errors.contactEmail && (
                  <p className="text-xs text-destructive">
                    {t("errors.invalidEmail")}
                  </p>
                )}
              </div>
            </div>
          </section>

          {submitState === "error" && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={
              evidence.length === 0 ||
              hasPendingEvidence ||
              hasInvalidEvidence ||
              hasUnavailableAiCheck ||
              submitState === "submitting"
            }
          >
            {submitState === "submitting" ? t("submitting") : t("submit")}
          </Button>
        </>
      )}
    </form>
  );
}
