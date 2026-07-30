"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  addCaseUpdate,
  deleteCaseUpdate,
  type CaseUpdateInput,
} from "@/app/[locale]/admin/cases/actions";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/types/database.types";

type CaseUpdateRow = Database["public"]["Tables"]["case_updates"]["Row"];

const MILESTONE_TYPES: CaseUpdateInput["milestoneType"][] = [
  "filed",
  "hearing",
  "evidence_submitted",
  "verdict",
  "other",
];

const EMPTY_FORM: CaseUpdateInput = {
  updateText: "",
  updateTextBn: "",
  milestoneType: "other",
  updateDate: new Date().toISOString().slice(0, 10),
};

export function CaseUpdatesManager({
  caseId,
  locale,
  updates,
}: {
  caseId: string;
  locale: string;
  updates: CaseUpdateRow[];
}) {
  const t = useTranslations("admin.cases.updates");
  const router = useRouter();
  const [form, setForm] = useState<CaseUpdateInput>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!form.updateText.trim()) {
      setError(t("errors.required"));
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await addCaseUpdate(caseId, form);
      setForm(EMPTY_FORM);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteCaseUpdate(id);
      router.refresh();
    } catch {
      setError(t("errors.saveFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {updates.length > 0 ? (
        <ul className="space-y-2">
          {updates.map((update) => (
            <li
              key={update.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{t(`milestoneOptions.${update.milestone_type}`)}</Badge>
                  <span className="text-muted-foreground">
                    {formatDate(update.update_date, locale)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground">
                  {(locale === "bn" && update.update_text_bn) || update.update_text}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={deletingId === update.id}
                onClick={() => handleDelete(update.id)}
                aria-label={t("delete")}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}

      <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
        <h3 className="text-sm font-medium text-foreground">{t("addTitle")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="update-text">{t("updateText")}</Label>
            <Textarea
              id="update-text"
              rows={2}
              value={form.updateText}
              onChange={(e) => setForm((f) => ({ ...f, updateText: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="update-text-bn">{t("updateTextBn")}</Label>
            <Textarea
              id="update-text-bn"
              rows={2}
              value={form.updateTextBn}
              onChange={(e) => setForm((f) => ({ ...f, updateTextBn: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("milestoneType")}</Label>
            <Select
              value={form.milestoneType}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, milestoneType: value as CaseUpdateInput["milestoneType"] }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string) => t(`milestoneOptions.${value}`)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MILESTONE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`milestoneOptions.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="update-date">{t("updateDate")}</Label>
            <Input
              id="update-date"
              type="date"
              value={form.updateDate}
              onChange={(e) => setForm((f) => ({ ...f, updateDate: e.target.value }))}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="button" onClick={handleAdd} disabled={isSubmitting}>
          {isSubmitting ? t("adding") : t("add")}
        </Button>
      </div>
    </div>
  );
}
