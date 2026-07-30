"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import {
  createArchiveItem,
  updateArchiveItem,
  type ArchiveItemInput,
} from "@/app/[locale]/admin/archive/actions";
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

const ITEM_TYPES = ["book", "story", "video", "image", "news_clipping", "document"] as const;
const VERIFICATION_STATUSES = ["pending", "verified"] as const;

const schema = z.object({
  title: z.string().min(2),
  titleBn: z.string(),
  itemType: z.enum(ITEM_TYPES),
  description: z.string(),
  descriptionBn: z.string(),
  contentBody: z.string(),
  contentBodyBn: z.string(),
  sourceCitation: z.string(),
  sourceUrl: z.union([z.literal(""), z.url()]),
  publishedDate: z.string(),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function ArchiveItemForm({
  itemId,
  initial,
}: {
  itemId?: string;
  initial?: Partial<ArchiveItemInput>;
}) {
  const t = useTranslations("admin.archive.form");
  const tCommon = useTranslations("admin.archive");
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
      title: initial?.title ?? "",
      titleBn: initial?.titleBn ?? "",
      itemType: initial?.itemType ?? "story",
      description: initial?.description ?? "",
      descriptionBn: initial?.descriptionBn ?? "",
      contentBody: initial?.contentBody ?? "",
      contentBodyBn: initial?.contentBodyBn ?? "",
      sourceCitation: initial?.sourceCitation ?? "",
      sourceUrl: initial?.sourceUrl ?? "",
      publishedDate: initial?.publishedDate ?? "",
      verificationStatus: initial?.verificationStatus ?? "pending",
      isPublished: initial?.isPublished ?? false,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (itemId) {
        await updateArchiveItem(itemId, values, locale);
      } else {
        await createArchiveItem(values, locale);
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
          <Label htmlFor="title">{t("title")}</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{t("errors.required")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="titleBn">{t("titleBn")}</Label>
          <Input id="titleBn" {...register("titleBn")} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("itemType")}</Label>
          <Controller
            name="itemType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => tCommon(`itemType.${value}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {tCommon(`itemType.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("verificationStatus")}</Label>
          <Controller
            name="verificationStatus"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => tCommon(`verification.${value}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {VERIFICATION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {tCommon(`verification.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea id="description" rows={2} {...register("description")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="descriptionBn">{t("descriptionBn")}</Label>
          <Textarea id="descriptionBn" rows={2} {...register("descriptionBn")} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="contentBody">{t("contentBody")}</Label>
          <Textarea
            id="contentBody"
            rows={6}
            {...register("contentBody")}
            placeholder={t("contentBodyHint")}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="contentBodyBn">{t("contentBodyBn")}</Label>
          <Textarea
            id="contentBodyBn"
            rows={6}
            {...register("contentBodyBn")}
            placeholder={t("contentBodyHint")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sourceCitation">{t("sourceCitation")}</Label>
          <Input id="sourceCitation" {...register("sourceCitation")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sourceUrl">{t("sourceUrl")}</Label>
          <Input id="sourceUrl" type="url" {...register("sourceUrl")} />
          {errors.sourceUrl && (
            <p className="text-xs text-destructive">{t("errors.required")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="publishedDate">{t("publishedDate")}</Label>
          <Input id="publishedDate" type="date" {...register("publishedDate")} />
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
