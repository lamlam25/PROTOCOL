import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Landmark, Scale, User } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { CaseStatusBadge } from "@/components/shared/case-status-badge";
import { CaseTimeline } from "@/components/cases/case-timeline";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "cases" });

  const supabase = await createClient();
  const { data: caseItem } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!caseItem) notFound();

  const [{ data: lawyer }, { data: victim }, { data: updates }] =
    await Promise.all([
      caseItem.assigned_lawyer_id
        ? supabase
            .from("lawyers")
            .select("id, full_name, full_name_bn")
            .eq("id", caseItem.assigned_lawyer_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      caseItem.victim_id
        ? supabase
            .from("victims")
            .select("id, full_name, full_name_bn")
            .eq("id", caseItem.victim_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("case_updates")
        .select("*")
        .eq("case_id", id)
        .order("update_date", { ascending: true }),
    ]);

  const title = (locale === "bn" && caseItem.title_bn) || caseItem.title;
  const description =
    (locale === "bn" && caseItem.description_bn) || caseItem.description;
  const lawyerName =
    lawyer && ((locale === "bn" && lawyer.full_name_bn) || lawyer.full_name);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/cases"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("detail.back")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <CaseStatusBadge status={caseItem.status} />
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
        {caseItem.case_number && (
          <div className="flex items-center gap-1.5">
            <Scale className="size-4" aria-hidden />
            <dt className="sr-only">{t("detail.caseNumber")}</dt>
            <dd>{caseItem.case_number}</dd>
          </div>
        )}
        {caseItem.court_name && (
          <div className="flex items-center gap-1.5">
            <Landmark className="size-4" aria-hidden />
            <dt className="sr-only">{t("detail.court")}</dt>
            <dd>{caseItem.court_name}</dd>
          </div>
        )}
        {caseItem.filed_date && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            <dt className="sr-only">{t("detail.filedDate")}</dt>
            <dd>{formatDate(caseItem.filed_date, locale)}</dd>
          </div>
        )}
      </dl>

      {lawyerName && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <User className="size-4" aria-hidden />
          {t("detail.lawyer")}: {lawyerName}
        </p>
      )}

      {victim && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t("detail.victimLinkPrefix")}{" "}
          <Link
            href={`/victims/${victim.id}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {(locale === "bn" && victim.full_name_bn) || victim.full_name}
          </Link>
        </p>
      )}

      {description && (
        <div className="mt-8">
          <p className="text-pretty leading-relaxed text-foreground/90">
            {description}
          </p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-foreground">
          {t("detail.timelineTitle")}
        </h2>
        <div className="mt-4">
          <CaseTimeline updates={updates ?? []} />
        </div>
      </div>
    </div>
  );
}
