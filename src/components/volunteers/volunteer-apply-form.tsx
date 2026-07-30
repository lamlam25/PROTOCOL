"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const schema = z.object({
  fullName: z.string().min(2),
  fullNameBn: z.string(),
  email: z.union([z.literal(""), z.email()]),
  phone: z.string(),
  district: z.string(),
  upazila: z.string(),
  skillsets: z.string(),
  availability: z.string(),
  motivation: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function VolunteerApplyForm() {
  const t = useTranslations("volunteers.form");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "error" | "done">(
    "idle"
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      fullNameBn: "",
      email: "",
      phone: "",
      district: "",
      upazila: "",
      skillsets: "",
      availability: "",
      motivation: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitState("submitting");
    setSubmitError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("volunteers").insert({
        profile_id: null,
        full_name: values.fullName,
        full_name_bn: values.fullNameBn || null,
        email: values.email || null,
        phone: values.phone || null,
        district: values.district || null,
        upazila: values.upazila || null,
        skillsets: values.skillsets
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        availability: values.availability || null,
        motivation: values.motivation || null,
      });
      if (error) throw new Error(error.message);
      setSubmitState("done");
    } catch (err) {
      setSubmitState("error");
      setSubmitError(err instanceof Error ? err.message : t("errors.submitFailed"));
    }
  }

  if (submitState === "done") {
    return (
      <Alert>
        <CheckCircle2 />
        <AlertTitle>{t("successTitle")}</AlertTitle>
        <AlertDescription>{t("successDescription")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
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
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive">{t("errors.invalidEmail")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="district">{t("district")}</Label>
          <Input id="district" {...register("district")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="upazila">{t("upazila")}</Label>
          <Input id="upazila" {...register("upazila")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="skillsets">{t("skillsets")}</Label>
          <Input id="skillsets" {...register("skillsets")} placeholder={t("skillsetsHint")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="availability">{t("availability")}</Label>
          <Input
            id="availability"
            {...register("availability")}
            placeholder={t("availabilityHint")}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="motivation">{t("motivation")}</Label>
          <Textarea id="motivation" rows={4} {...register("motivation")} />
        </div>
      </div>

      {submitState === "error" && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={submitState === "submitting"}>
        {submitState === "submitting" ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
