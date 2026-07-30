"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { createLawyer, updateLawyer, type LawyerInput } from "@/app/[locale]/admin/lawyers/actions";
import type { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z.object({
  fullName: z.string().min(2),
  fullNameBn: z.string(),
  barRegistrationNo: z.string(),
  specialization: z.string(),
  contactEmail: z.union([z.literal(""), z.email()]),
  contactPhone: z.string(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function LawyerForm({
  lawyerId,
  initial,
}: {
  lawyerId?: string;
  initial?: Partial<LawyerInput>;
}) {
  const t = useTranslations("admin.lawyers.form");
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
      barRegistrationNo: initial?.barRegistrationNo ?? "",
      specialization: (initial?.specialization ?? []).join(", "),
      contactEmail: initial?.contactEmail ?? "",
      contactPhone: initial?.contactPhone ?? "",
      isActive: initial?.isActive ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    const input: LawyerInput = {
      fullName: values.fullName,
      fullNameBn: values.fullNameBn,
      barRegistrationNo: values.barRegistrationNo,
      specialization: values.specialization
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      isActive: values.isActive,
    };

    try {
      if (lawyerId) {
        await updateLawyer(lawyerId, input, locale);
      } else {
        await createLawyer(input, locale);
      }
    } catch (err) {
      // next/navigation's redirect() throws a special digest to trigger
      // navigation — let it propagate, only real errors show the alert.
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
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
          <Label htmlFor="barRegistrationNo">{t("barRegistrationNo")}</Label>
          <Input id="barRegistrationNo" {...register("barRegistrationNo")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
          <Input id="contactEmail" type="email" {...register("contactEmail")} />
          {errors.contactEmail && (
            <p className="text-xs text-destructive">{t("errors.invalidEmail")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
          <Input id="contactPhone" {...register("contactPhone")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="specialization">{t("specialization")}</Label>
          <Input id="specialization" {...register("specialization")} placeholder={t("specializationHint")} />
        </div>
      </div>

      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            {t("isActive")}
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
