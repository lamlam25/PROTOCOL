"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OcrResult } from "@/lib/forensics/types";

/**
 * OCR output is unreliable on handwriting — every field here is editable,
 * and nothing from OCR is ever auto-committed. The caller (the form) owns
 * the corrected values via onFieldsChange.
 */
export function OcrFieldReview({
  result,
  onFieldsChange,
}: {
  result: OcrResult;
  onFieldsChange: (fields: { nationalId: string; date: string }) => void;
}) {
  const t = useTranslations("forensics.ocr");
  const [nationalId, setNationalId] = useState(
    result.extractedFields.nationalId ?? ""
  );
  const [date, setDate] = useState(result.extractedFields.date ?? "");
  const [showRaw, setShowRaw] = useState(false);

  function update(next: { nationalId?: string; date?: string }) {
    const merged = {
      nationalId: next.nationalId ?? nationalId,
      date: next.date ?? date,
    };
    if (next.nationalId !== undefined) setNationalId(next.nationalId);
    if (next.date !== undefined) setDate(next.date);
    onFieldsChange(merged);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
        <span className="text-xs text-muted-foreground">
          {t("confidence", { confidence: Math.round(result.confidence) })}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ocr-nid">{t("nationalId")}</Label>
          <Input
            id="ocr-nid"
            value={nationalId}
            onChange={(e) => update({ nationalId: e.target.value })}
            placeholder={t("nationalIdPlaceholder")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ocr-date">{t("date")}</Label>
          <Input
            id="ocr-date"
            value={date}
            onChange={(e) => update({ date: e.target.value })}
            placeholder={t("datePlaceholder")}
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform", showRaw && "rotate-180")}
            aria-hidden
          />
          {t("showRawText")}
        </button>
        {showRaw && (
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
            {result.text.trim() || t("noText")}
          </pre>
        )}
      </div>
    </div>
  );
}
