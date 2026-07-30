"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { sha256Hex } from "@/lib/forensics/file-hash";
import { computeELA } from "@/lib/forensics/ela";
import { computeDHash } from "@/lib/forensics/phash";
import { runOcr } from "@/lib/forensics/ocr";
import type { ElaResult, OcrResult, RiskFlag } from "@/lib/forensics/types";
import { UploadDropzone } from "@/components/forensics/upload-dropzone";
import { ElaPreview } from "@/components/forensics/ela-preview";
import { OcrFieldReview } from "@/components/forensics/ocr-field-review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const schema = z.object({
  accusedFullName: z.string().min(2),
  accusedFullNameBn: z.string(),
  caseReferenceNumber: z.string(),
  district: z.string(),
  description: z.string().min(10),
  alibiTimestamp: z.string(),
  contactEmail: z.union([z.literal(""), z.email()]),
  contactPhone: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface PhashMatch {
  relatedTable: string;
  relatedId: string;
  hammingDistance: number;
}

type ForensicsState =
  | { status: "idle" }
  | { status: "processing"; ocrProgress: number }
  | {
      status: "done";
      sha256: string;
      ela: ElaResult;
      phash: string;
      phashMatches: PhashMatch[];
      ocr: OcrResult;
      correctedFields: { nationalId: string; date: string };
    }
  | { status: "error"; message: string };

export function FalseCaseForm() {
  const t = useTranslations("falseCases.form");

  const [file, setFile] = useState<File | null>(null);
  const [forensics, setForensics] = useState<ForensicsState>({ status: "idle" });
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "error" | "done"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  async function handleFileSelected(selected: File) {
    setFile(selected);
    setForensics({ status: "processing", ocrProgress: 0 });
    try {
      const [sha256, ela, phash] = await Promise.all([
        sha256Hex(selected),
        computeELA(selected),
        computeDHash(selected),
      ]);

      const ocrPromise = runOcr(selected, (progress) =>
        setForensics((prev) =>
          prev.status === "processing" ? { status: "processing", ocrProgress: progress } : prev
        )
      );

      const matchesPromise = fetch("/api/forensics/phash-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phash }),
      })
        .then((res) => (res.ok ? res.json() : { matches: [] }))
        .catch(() => ({ matches: [] as PhashMatch[] }));

      const [ocr, matchesResult] = await Promise.all([ocrPromise, matchesPromise]);

      setForensics({
        status: "done",
        sha256,
        ela,
        phash,
        phashMatches: matchesResult.matches ?? [],
        ocr,
        correctedFields: {
          nationalId: ocr.extractedFields.nationalId ?? "",
          date: ocr.extractedFields.date ?? "",
        },
      });
    } catch (err) {
      setForensics({
        status: "error",
        message: err instanceof Error ? err.message : t("errors.analysisFailed"),
      });
    }
  }

  async function onSubmit(values: FormValues) {
    if (!file || forensics.status !== "done") return;
    setSubmitState("submitting");
    setSubmitError(null);

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      const uploadRes = await fetch("/api/storage/pin", {
        method: "POST",
        body: uploadForm,
      });
      if (!uploadRes.ok) throw new Error(t("errors.uploadFailed"));
      const upload: { cid: string } = await uploadRes.json();

      const heatmapForm = new FormData();
      heatmapForm.append(
        "file",
        forensics.ela.heatmapBlob,
        "ela-heatmap.png"
      );
      const heatmapUploadRes = await fetch("/api/storage/pin", {
        method: "POST",
        body: heatmapForm,
      });
      const heatmapCid: string | null = heatmapUploadRes.ok
        ? (await heatmapUploadRes.json()).cid
        : null;
      const submitRes = await fetch("/api/false-cases/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accusedFullName: values.accusedFullName,
          accusedFullNameBn: values.accusedFullNameBn || null,
          caseReferenceNumber: values.caseReferenceNumber || null,
          district: values.district || null,
          description: values.description,
          alibiTimestamp: values.alibiTimestamp || null,
          contactEmail: values.contactEmail || null,
          contactPhone: values.contactPhone || null,
          evidenceFiles: [
            {
              ipfs_cid: upload.cid,
              sha256: forensics.sha256,
              file_type: file.type,
              ela_score: forensics.ela.score,
              phash: forensics.phash,
              ocr_extracted: forensics.correctedFields,
            },
          ],
          fileSha256: forensics.sha256,
          elaScore: forensics.ela.score,
          elaHeatmapCid: heatmapCid,
          phash: forensics.phash,
          phashMatches: forensics.phashMatches,
          ocrRawText: forensics.ocr.text,
          ocrExtractedFields: forensics.correctedFields,
          riskFlag: forensics.ela.riskFlag as RiskFlag,
          ipfsCid: upload.cid,
        }),
      });
      if (!submitRes.ok) {
        const payload = (await submitRes.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? t("errors.submitFailed"));
      }

      setSubmitState("done");
    } catch (err) {
      setSubmitState("error");
      setSubmitError(err instanceof Error ? err.message : t("errors.submitFailed"));
    }
  }

  if (submitState === "done") {
    return (
      <Alert>
        <CheckCircle2 />
        <AlertTitle>{t("successTitle")}</AlertTitle>
        <AlertDescription>{t("successDescription")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-1.5">
        <Label>{t("evidenceLabel")}</Label>
        <UploadDropzone
          file={file}
          onFileSelected={handleFileSelected}
          disabled={forensics.status === "processing"}
        />
      </div>

      {forensics.status === "processing" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("analyzing")}</p>
          <Progress value={forensics.ocrProgress * 100} />
        </div>
      )}

      {forensics.status === "error" && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{forensics.message}</AlertDescription>
        </Alert>
      )}

      {forensics.status === "done" && file && (
        <div className="space-y-6 rounded-lg border border-border p-4">
          <ElaPreview originalFile={file} result={forensics.ela} />
          <OcrFieldReview
            result={forensics.ocr}
            onFieldsChange={(fields) =>
              setForensics((prev) =>
                prev.status === "done" ? { ...prev, correctedFields: fields } : prev
              )
            }
          />
          {forensics.phashMatches.length > 0 && (
            <Alert variant="destructive">
              <TriangleAlert />
              <AlertTitle>{t("duplicateWarningTitle")}</AlertTitle>
              <AlertDescription>{t("duplicateWarningDescription")}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="accusedFullName">{t("accusedFullName")}</Label>
          <Input id="accusedFullName" {...register("accusedFullName")} />
          {errors.accusedFullName && (
            <p className="text-xs text-destructive">{t("errors.required")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accusedFullNameBn">{t("accusedFullNameBn")}</Label>
          <Input id="accusedFullNameBn" {...register("accusedFullNameBn")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="caseReferenceNumber">{t("caseReferenceNumber")}</Label>
          <Input id="caseReferenceNumber" {...register("caseReferenceNumber")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="district">{t("district")}</Label>
          <Input id="district" {...register("district")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea id="description" rows={4} {...register("description")} />
          {errors.description && (
            <p className="text-xs text-destructive">{t("errors.descriptionTooShort")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="alibiTimestamp">{t("alibiTimestamp")}</Label>
          <Input id="alibiTimestamp" type="datetime-local" {...register("alibiTimestamp")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
          <Input id="contactPhone" {...register("contactPhone")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
          <Input id="contactEmail" type="email" {...register("contactEmail")} />
          {errors.contactEmail && (
            <p className="text-xs text-destructive">{t("errors.invalidEmail")}</p>
          )}
        </div>
      </div>

      {submitState === "error" && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={forensics.status !== "done" || submitState === "submitting"}
      >
        {submitState === "submitting" ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
