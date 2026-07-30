"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import {
  createTimelineEvent,
  updateTimelineEvent,
  type TimelineEventInput,
} from "@/app/[locale]/admin/timeline/actions";
import type { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORIES = [
  "protest",
  "crackdown",
  "casualty",
  "political",
  "international",
  "other",
] as const;

const schema = z.object({
  eventDate: z.string().min(1),
  eventTime: z.string(),
  title: z.string().min(2),
  titleBn: z.string(),
  description: z.string(),
  descriptionBn: z.string(),
  category: z.enum(CATEGORIES),
  relatedArchiveItemId: z.string(),
  sourceCitation: z.string(),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export interface OptionItem {
  id: string;
  label: string;
}

export function TimelineEventForm({
  eventId,
  initial,
  archiveItemOptions,
}: {
  eventId?: string;
  initial?: Partial<TimelineEventInput>;
  archiveItemOptions: OptionItem[];
}) {
  const t = useTranslations("admin.timeline.form");
  const tCommon = useTranslations("admin.timeline");
  const locale = useLocale() as (typeof routing.locales)[number];
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventDate: initial?.eventDate ?? "",
      eventTime: initial?.eventTime ?? "",
      title: initial?.title ?? "",
      titleBn: initial?.titleBn ?? "",
      description: initial?.description ?? "",
      descriptionBn: initial?.descriptionBn ?? "",
      category: initial?.category ?? "protest",
      relatedArchiveItemId: initial?.relatedArchiveItemId ?? "none",
      sourceCitation: initial?.sourceCitation ?? "",
      isPublished: initial?.isPublished ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (eventId) {
        await updateTimelineEvent(eventId, values, locale);
      } else {
        await createTimelineEvent(values, locale);
      }
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof err.digest === "string" &&
        err.digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }
      setSubmitError(err instanceof Error ? err.message : t("errors.saveFailed"));
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="eventDate">{t("eventDate")}</Label>
          <Input id="eventDate" type="date" {...register("eventDate")} />
          {errors.eventDate && (
            <p className="text-xs text-destructive">{t("errors.required")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eventTime">{t("eventTime")}</Label>
          <Input id="eventTime" type="time" {...register("eventTime")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">{t("title")}</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{t("errors.required")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="titleBn">{t("titleBn")}</Label>
          <Input id="titleBn" {...register("titleBn")} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea id="description" rows={3} {...register("description")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="descriptionBn">{t("descriptionBn")}</Label>
          <Textarea id="descriptionBn" rows={3} {...register("descriptionBn")} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("category")}</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => tCommon(`category.${value}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {tCommon(`category.${category}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("relatedArchiveItem")}</Label>
          <Controller
            name="relatedArchiveItemId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      archiveItemOptions.find((o) => o.id === value)?.label ??
                      tCommon("noneOption")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tCommon("noneOption")}</SelectItem>
                  {archiveItemOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sourceCitation">{t("sourceCitation")}</Label>
          <Input id="sourceCitation" {...register("sourceCitation")} />
        </div>
      </div>

      <Controller
        name="isPublished"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            {t("isPublished")}
          </label>
        )}
      />

      {submitError && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
