"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  createCase,
  updateCase,
  type CaseInput,
} from "@/app/[locale]/admin/cases/actions";
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

const schema = z.object({
  caseNumber: z.string(),
  title: z.string().min(2),
  titleBn: z.string(),
  description: z.string(),
  descriptionBn: z.string(),
  caseType: z.enum(["criminal_prosecution", "rehabilitation", "compensation"]),
  status: z.enum(["filed", "investigation", "under_trial", "verdict", "closed"]),
  victimId: z.string(),
  assignedLawyerId: z.string(),
  courtName: z.string(),
  filedDate: z.string(),
  isPublished: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export interface OptionItem {
  id: string;
  label: string;
}

export function CaseForm({
  caseId,
  initial,
  victimOptions,
  lawyerOptions,
}: {
  caseId?: string;
  initial?: Partial<CaseInput>;
  victimOptions: OptionItem[];
  lawyerOptions: OptionItem[];
}) {
  const t = useTranslations("admin.cases.form");
  const tCommon = useTranslations("admin.cases");
  const router = useRouter();
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
      caseNumber: initial?.caseNumber ?? "",
      title: initial?.title ?? "",
      titleBn: initial?.titleBn ?? "",
      description: initial?.description ?? "",
      descriptionBn: initial?.descriptionBn ?? "",
      caseType: initial?.caseType ?? "criminal_prosecution",
      status: initial?.status ?? "filed",
      victimId: initial?.victimId ?? "none",
      assignedLawyerId: initial?.assignedLawyerId ?? "none",
      courtName: initial?.courtName ?? "",
      filedDate: initial?.filedDate ?? "",
      isPublished: initial?.isPublished ?? false,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (caseId) {
        await updateCase(caseId, values);
        router.refresh();
        setIsSubmitting(false);
      } else {
        await createCase(values, locale);
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

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">{t("description")}</Label>
          <Textarea id="description" rows={3} {...register("description")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="descriptionBn">{t("descriptionBn")}</Label>
          <Textarea id="descriptionBn" rows={3} {...register("descriptionBn")} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("caseType")}</Label>
          <Controller
            name="caseType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => tCommon(`caseType.${value}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="criminal_prosecution">
                    {tCommon("caseType.criminal_prosecution")}
                  </SelectItem>
                  <SelectItem value="rehabilitation">
                    {tCommon("caseType.rehabilitation")}
                  </SelectItem>
                  <SelectItem value="compensation">
                    {tCommon("caseType.compensation")}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("status")}</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => tCommon(`status.${value}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filed">{tCommon("status.filed")}</SelectItem>
                  <SelectItem value="investigation">{tCommon("status.investigation")}</SelectItem>
                  <SelectItem value="under_trial">{tCommon("status.under_trial")}</SelectItem>
                  <SelectItem value="verdict">{tCommon("status.verdict")}</SelectItem>
                  <SelectItem value="closed">{tCommon("status.closed")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("victim")}</Label>
          <Controller
            name="victimId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      victimOptions.find((o) => o.id === value)?.label ??
                      tCommon("noneOption")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tCommon("noneOption")}</SelectItem>
                  {victimOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("assignedLawyer")}</Label>
          <Controller
            name="assignedLawyerId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      lawyerOptions.find((o) => o.id === value)?.label ??
                      tCommon("noneOption")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tCommon("noneOption")}</SelectItem>
                  {lawyerOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="caseNumber">{t("caseNumber")}</Label>
          <Input id="caseNumber" {...register("caseNumber")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="courtName">{t("courtName")}</Label>
          <Input id="courtName" {...register("courtName")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filedDate">{t("filedDate")}</Label>
          <Input id="filedDate" type="date" {...register("filedDate")} />
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
