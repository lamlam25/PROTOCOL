"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ElaResult } from "@/lib/forensics/types";

const RISK_BADGE_CLASS: Record<ElaResult["riskFlag"], string> = {
  none: "",
  low: "border-warning/30 bg-warning/10 text-warning",
  medium: "border-warning/30 bg-warning/10 text-warning",
  high: "",
};

export function ElaPreview({
  originalFile,
  result,
}: {
  originalFile: File;
  result: ElaResult;
}) {
  const t = useTranslations("forensics.ela");
  const originalUrl = useMemo(
    () => URL.createObjectURL(originalFile),
    [originalFile]
  );
  const heatmapUrl = useMemo(
    () => URL.createObjectURL(result.heatmapBlob),
    [result.heatmapBlob]
  );

  useEffect(() => () => URL.revokeObjectURL(originalUrl), [originalUrl]);
  useEffect(() => () => URL.revokeObjectURL(heatmapUrl), [heatmapUrl]);

  const badgeVariant = result.riskFlag === "high" ? "destructive" : "outline";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
        <Badge
          variant={badgeVariant}
          className={cn(RISK_BADGE_CLASS[result.riskFlag])}
        >
          {t(`risk.${result.riskFlag}`)} · {Math.round(result.score)}/100
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">{t("original")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalUrl}
            alt={t("original")}
            className="w-full rounded-md border border-border"
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">{t("heatmap")}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heatmapUrl}
            alt={t("heatmap")}
            className="w-full rounded-md border border-border bg-black"
          />
        </div>
      </div>
      {result.riskFlag !== "none" && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("disclaimer")}
        </p>
      )}
    </div>
  );
}
