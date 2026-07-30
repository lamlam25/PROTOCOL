"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import {
  createVictim,
  updateVictim,
  type VictimInput,
} from "@/app/[locale]/admin/victims/actions";
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
  fullName: z.string().min(2),
  fullNameBn: z.string(),
  status: z.enum(["martyr", "injured"]),
  age: z.string(),
  gender: z.string(),
  district: z.string(),
  upazila: z.string(),
  incidentDate: z.string(),
  incidentLocation: z.string(),
  incidentLocationBn: z.string(),
  storySummary: z.string(),
  storySummaryBn: z.string(),
  isPublished: z.boolean(),
  verificationStatus: z.enum(["pending", "verified", "flagged"]),
});

type FormValues = z.infer<typeof schema>;

export function VictimForm({
  victimId,
  initial,
}: {
  victimId?: string;
  initial?: Partial<VictimInput>;
}) {
  const t = useTranslations("admin.victims.form");
  const tVerification = useTranslations("admin.victims.verification");
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
      fullName: initial?.fullName ?? "",
      fullNameBn: initial?.fullNameBn ?? "",
      status: initial?.status ?? "injured",
      age: initial?.age ?? "",
      gender: initial?.gender ?? "",
      district: initial?.district ?? "",
      upazila: initial?.upazila ?? "",
      incidentDate: initial?.incidentDate ?? "",
      incidentLocation: initial?.incidentLocation ?? "",
      incidentLocationBn: initial?.incidentLocationBn ?? "",
      storySummary: initial?.storySummary ?? "",
      storySummaryBn: initial?.storySummaryBn ?? "",
      isPublished: initial?.isPublished ?? false,
      verificationStatus: initial?.verificationStatus ?? "pending",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (victimId) {
        await updateVictim(victimId, values, locale);
      } else {
        await createVictim(values, locale);
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
          <Label htmlFor="fullName">{t("fullName")}</Label>
          <Input id="fullName" {...register("fullName")} />
          {errors.fullName && (
            <p className="text-xs text-destructive">{t("errors.required")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fullNameBn">{t("fullNameBn")}</Label>
          <Input id="fullNameBn" {...register("fullNameBn")} />
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
                    {(value: string) =>
                      value === "martyr"
                        ? t("statusOptions.martyr")
                        : t("statusOptions.injured")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="martyr">{t("statusOptions.martyr")}</SelectItem>
                  <SelectItem value="injured">{t("statusOptions.injured")}</SelectItem>
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
                    {(value: string) => tVerification(value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{tVerification("pending")}</SelectItem>
                  <SelectItem value="verified">{tVerification("verified")}</SelectItem>
                  <SelectItem value="flagged">{tVerification("flagged")}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="age">{t("age")}</Label>
          <Input id="age" type="number" min="0" {...register("age")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">{t("gender")}</Label>
          <Input id="gender" {...register("gender")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="district">{t("district")}</Label>
          <Input id="district" {...register("district")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="upazila">{t("upazila")}</Label>
          <Input id="upazila" {...register("upazila")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="incidentDate">{t("incidentDate")}</Label>
          <Input id="incidentDate" type="date" {...register("incidentDate")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="incidentLocation">{t("incidentLocation")}</Label>
          <Input id="incidentLocation" {...register("incidentLocation")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="incidentLocationBn">{t("incidentLocationBn")}</Label>
          <Input id="incidentLocationBn" {...register("incidentLocationBn")} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="storySummary">{t("storySummary")}</Label>
          <Textarea id="storySummary" rows={4} {...register("storySummary")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="storySummaryBn">{t("storySummaryBn")}</Label>
          <Textarea id="storySummaryBn" rows={4} {...register("storySummaryBn")} />
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
