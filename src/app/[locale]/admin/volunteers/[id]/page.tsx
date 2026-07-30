import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { VolunteerStatusForm } from "@/components/admin/volunteers/volunteer-status-form";
import type { VolunteerStatus } from "@/app/[locale]/admin/volunteers/actions";

export default async function AdminVolunteerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.volunteers" });

  const supabase = await createClient();
  const { data: volunteer } = await supabase
    .from("volunteers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!volunteer) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/volunteers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("detail.back")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">
          {(locale === "bn" && volunteer.full_name_bn) || volunteer.full_name}
        </h1>
        <Badge variant={volunteer.status === "rejected" ? "destructive" : "outline"}>
          {t(`status.${volunteer.status}`)}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(volunteer.created_at, locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="mt-6 space-y-1 rounded-lg border border-border bg-card p-4 text-sm">
        {(volunteer.email || volunteer.phone) && (
          <p>
            <span className="text-muted-foreground">{t("detail.contact")}: </span>
            <span className="text-foreground">
              {[volunteer.email, volunteer.phone].filter(Boolean).join(" · ")}
            </span>
          </p>
        )}
        {volunteer.district && (
          <p>
            <span className="text-muted-foreground">{t("detail.district")}: </span>
            <span className="text-foreground">
              {[volunteer.district, volunteer.upazila].filter(Boolean).join(", ")}
            </span>
          </p>
        )}
        {volunteer.skillsets && volunteer.skillsets.length > 0 && (
          <p>
            <span className="text-muted-foreground">{t("detail.skillsets")}: </span>
            <span className="text-foreground">{volunteer.skillsets.join(", ")}</span>
          </p>
        )}
        {volunteer.availability && (
          <p>
            <span className="text-muted-foreground">{t("detail.availability")}: </span>
            <span className="text-foreground">{volunteer.availability}</span>
          </p>
        )}
        {volunteer.motivation && (
          <p>
            <span className="text-muted-foreground">{t("detail.motivation")}: </span>
            <span className="text-foreground">{volunteer.motivation}</span>
          </p>
        )}
      </div>

      <div className="mt-6">
        <VolunteerStatusForm id={volunteer.id} initialStatus={volunteer.status as VolunteerStatus} />
      </div>
    </div>
  );
}
