"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  createVolunteerTask,
  updateVolunteerTask,
  type VolunteerTaskInput,
} from "@/app/[locale]/admin/volunteer-tasks/actions";
import type { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LocationPickerMap = dynamic(
  () => import("@/components/admin/volunteer-tasks/location-picker-map"),
  { ssr: false, loading: () => <div className="h-[300px] w-full rounded-lg bg-muted" /> }
);

const TASK_TYPES = [
  "field_verification",
  "distribution",
  "documentation",
  "outreach",
  "event_support",
  "other",
] as const;

const STATUSES = ["open", "assigned", "in_progress", "completed", "cancelled"] as const;

const schema = z.object({
  title: z.string().min(2),
  titleBn: z.string(),
  description: z.string(),
  descriptionBn: z.string(),
  taskType: z.enum(TASK_TYPES),
  status: z.enum(STATUSES),
  district: z.string(),
  upazila: z.string(),
  geoLat: z.string(),
  geoLng: z.string(),
  assignedVolunteerId: z.string(),
  dueDate: z.string(),
});

type FormValues = z.infer<typeof schema>;

export interface OptionItem {
  id: string;
  label: string;
}

export function TaskForm({
  taskId,
  initial,
  volunteerOptions,
}: {
  taskId?: string;
  initial?: Partial<VolunteerTaskInput>;
  volunteerOptions: OptionItem[];
}) {
  const t = useTranslations("admin.volunteerTasks.form");
  const tCommon = useTranslations("admin.volunteerTasks");
  const router = useRouter();
  const locale = useLocale() as (typeof routing.locales)[number];
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      titleBn: initial?.titleBn ?? "",
      description: initial?.description ?? "",
      descriptionBn: initial?.descriptionBn ?? "",
      taskType: initial?.taskType ?? "field_verification",
      status: initial?.status ?? "open",
      district: initial?.district ?? "",
      upazila: initial?.upazila ?? "",
      geoLat: initial?.geoLat ?? "",
      geoLng: initial?.geoLng ?? "",
      assignedVolunteerId: initial?.assignedVolunteerId ?? "none",
      dueDate: initial?.dueDate ?? "",
    },
  });

  const geoLat = useWatch({ control, name: "geoLat" });
  const geoLng = useWatch({ control, name: "geoLng" });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (taskId) {
        await updateVolunteerTask(taskId, values);
        router.refresh();
        setIsSubmitting(false);
      } else {
        await createVolunteerTask(values, locale);
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
          <Label>{t("taskType")}</Label>
          <Controller
            name="taskType"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => tCommon(`taskType.${value}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {tCommon(`taskType.${type}`)}
                    </SelectItem>
                  ))}
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
                  <SelectValue>{(value: string) => tCommon(`status.${value}`)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tCommon(`status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
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
          <Label>{t("assignedVolunteer")}</Label>
          <Controller
            name="assignedVolunteerId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      volunteerOptions.find((o) => o.id === value)?.label ??
                      tCommon("noneOption")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tCommon("noneOption")}</SelectItem>
                  {volunteerOptions.map((option) => (
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
          <Label htmlFor="dueDate">{t("dueDate")}</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{t("mapHint")}</p>
        <LocationPickerMap
          lat={geoLat ? Number(geoLat) : null}
          lng={geoLng ? Number(geoLng) : null}
          onPick={(lat, lng) => {
            setValue("geoLat", lat.toFixed(6));
            setValue("geoLng", lng.toFixed(6));
          }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="geoLat">{t("geoLat")}</Label>
            <Input id="geoLat" inputMode="decimal" {...register("geoLat")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="geoLng">{t("geoLng")}</Label>
            <Input id="geoLng" inputMode="decimal" {...register("geoLng")} />
          </div>
        </div>
      </div>

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
