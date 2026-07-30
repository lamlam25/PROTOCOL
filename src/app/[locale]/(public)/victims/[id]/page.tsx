import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { VictimStatusBadge } from "@/components/shared/victim-status-badge";
import { CaseStatusBadge } from "@/components/shared/case-status-badge";

export default async function VictimDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "victims" });

  const supabase = await createClient();
  const { data: victim } = await supabase
    .from("victims")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!victim) notFound();

  const { data: cases } = await supabase
    .from("cases")
    .select("id, title, title_bn, status")
    .eq("victim_id", id)
    .order("filed_date", { ascending: false });

  const name = (locale === "bn" && victim.full_name_bn) || victim.full_name;
  const story =
    (locale === "bn" && victim.story_summary_bn) || victim.story_summary;
  const incidentLocation =
    (locale === "bn" && victim.incident_location_bn) ||
    victim.incident_location;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/victims"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("detail.back")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{name}</h1>
        <VictimStatusBadge status={victim.status} />
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {victim.district && (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            <dt className="sr-only">{t("detail.district")}</dt>
            <dd>
              {victim.district}
              {victim.upazila ? `, ${victim.upazila}` : ""}
            </dd>
          </div>
        )}
        {victim.incident_date && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            <dt className="sr-only">{t("detail.incidentDate")}</dt>
            <dd>{formatDate(victim.incident_date, locale)}</dd>
          </div>
        )}
      </dl>

      {incidentLocation && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("detail.incidentLocation")}: {incidentLocation}
        </p>
      )}

      {story && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-foreground">
            {t("detail.storyTitle")}
          </h2>
          <p className="mt-2 text-pretty leading-relaxed text-foreground/90">
            {story}
          </p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">
          {t("detail.relatedCasesTitle")}
        </h2>
        {cases && cases.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {cases.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cases/${c.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm hover:border-primary/40"
                >
                  <span className="text-foreground">
                    {(locale === "bn" && c.title_bn) || c.title}
                  </span>
                  <CaseStatusBadge status={c.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("detail.noRelatedCases")}
          </p>
        )}
      </div>
    </div>
  );
}
