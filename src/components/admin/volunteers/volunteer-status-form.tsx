"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  updateVolunteerStatus,
  type VolunteerStatus,
} from "@/app/[locale]/admin/volunteers/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: VolunteerStatus[] = ["applied", "reviewed", "approved", "rejected", "inactive"];

export function VolunteerStatusForm({
  id,
  initialStatus,
}: {
  id: string;
  initialStatus: VolunteerStatus;
}) {
  const t = useTranslations("admin.volunteers.detail");
  const router = useRouter();
  const [status, setStatus] = useState<VolunteerStatus>(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateVolunteerStatus(id, status);
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
        <Select value={status} onValueChange={(v) => setStatus(v as VolunteerStatus)}>
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
