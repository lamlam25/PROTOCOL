"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  updateFalseCaseStatus,
  type FalseCaseStatus,
} from "@/app/[locale]/admin/false-cases/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: FalseCaseStatus[] = ["submitted", "under_review", "verified", "rejected"];

export function FalseCaseStatusForm({
  id,
  initialStatus,
  initialNotes,
}: {
  id: string;
  initialStatus: FalseCaseStatus;
  initialNotes: string;
}) {
  const t = useTranslations("admin.falseCases.detail");
  const router = useRouter();
  const [status, setStatus] = useState<FalseCaseStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateFalseCaseStatus(id, status, notes);
      router.refresh();
    } catch {
      setError(t("actionError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold text-foreground">{t("reviewTitle")}</h2>
      <div className="space-y-1.5">
        <Label>{t("statusLabel")}</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as FalseCaseStatus)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue>{(value: string) => t(`status.${value}`)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-notes">{t("reviewNotes")}</Label>
        <Textarea
          id="review-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="button" onClick={handleSave} disabled={isSubmitting}>
        {isSubmitting ? t("saving") : t("save")}
      </Button>
    </div>
  );
}
