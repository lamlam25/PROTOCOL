import {
  ArrowRight,
  BookOpenText,
  HeartHandshake,
  Landmark,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge } from "@/components/shared/case-status-badge";

const PILLAR_ICONS = {
  victims: HeartHandshake,
  cases: Scale,
  falseCases: ShieldAlert,
  budget: Landmark,
  volunteers: Users,
  stories: BookOpenText,
} as const;

const PILLAR_HREFS = {
  victims: "/victims",
  cases: "/cases",
  falseCases: "/false-cases",
  budget: "/budget",
  volunteers: "/volunteers",
  stories: "/stories",
} as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });

  const supabase = await createClient();
  const [
    victimsResult,
    casesResult,
    allocationsResult,
    transactionsResult,
    archiveResult,
    latestCasesResult,
  ] = await Promise.all([
    supabase.from("victims").select("id", { count: "exact", head: true }),
    supabase.from("cases").select("id", { count: "exact", head: true }),
    supabase.from("budget_allocations").select("allocated_amount"),
    supabase
      .from("budget_transactions")
      .select("amount")
      .eq("transaction_type", "disbursement"),
    supabase.from("archive_items").select("id", { count: "exact", head: true }),
    supabase
      .from("cases")
      .select("id, title, title_bn, status, court_name")
      .order("updated_at", { ascending: false })
      .limit(3),
  ]);

  const totalAllocated = (allocationsResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.allocated_amount),
    0
  );
  const totalDisbursed = (transactionsResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );

  const stats = [
    {
      label: t("stats.verifiedPeople"),
      value: formatNumber(victimsResult.count ?? 0, locale),
    },
    {
      label: t("stats.publicCases"),
      value: formatNumber(casesResult.count ?? 0, locale),
    },
    {
      label: t("stats.allocated"),
      value: formatCurrency(totalAllocated, locale),
    },
    {
      label: t("stats.archiveRecords"),
      value: formatNumber(archiveResult.count ?? 0, locale),
    },
  ];

  const pillars = (
    Object.keys(PILLAR_ICONS) as Array<keyof typeof PILLAR_ICONS>
  ).map((key) => ({
    key,
    href: PILLAR_HREFS[key],
    Icon: PILLAR_ICONS[key],
    title: t(`pillars.${key}.title`),
    description: t(`pillars.${key}.description`),
  }));

  return (
    <div>
      <section
        className="relative min-h-[32rem] overflow-hidden bg-brand-black text-white"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(3,7,5,.98) 0%, rgba(3,7,5,.9) 38%, rgba(3,7,5,.28) 76%, rgba(3,7,5,.12) 100%), url('/protocol-archive-hero.webp')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-brand-red" />
        <div className="mx-auto flex min-h-[32rem] max-w-7xl items-center px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase text-white/70">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              {t("hero.eyebrow")}
            </div>
            <h1 className="text-5xl font-black text-white sm:text-6xl">
              PROTOCOL36
            </h1>
            <p className="mt-4 max-w-xl text-xl font-medium text-white">
              {t("hero.title")}
            </p>
            <p className="mt-3 max-w-xl text-pretty leading-relaxed text-white/70">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/victims" />}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {t("hero.viewVictims")}
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/budget" />}
                className="border border-white/35 bg-white text-black hover:bg-white/90"
              >
                {t("hero.viewBudget")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`min-w-0 px-3 py-6 sm:px-6 ${
                index > 0 ? "border-l border-border" : ""
              }`}
            >
              <p className="truncate text-2xl font-bold text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">
            {t("live.caseEyebrow")}
          </p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {t("live.caseTitle")}
            </h2>
            <Link
              href="/cases"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("live.viewAll")} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {(latestCasesResult.data ?? []).length > 0 ? (
              latestCasesResult.data?.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  href={`/cases/${caseItem.id}`}
                  className="flex min-h-20 items-center justify-between gap-4 py-4 hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {(locale === "bn" && caseItem.title_bn) || caseItem.title}
                    </p>
                    {caseItem.court_name && (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {caseItem.court_name}
                      </p>
                    )}
                  </div>
                  <CaseStatusBadge status={caseItem.status} />
                </Link>
              ))
            ) : (
              <p className="py-8 text-sm text-muted-foreground">
                {t("live.noCases")}
              </p>
            )}
          </div>
        </div>

        <div className="border-l-4 border-brand-red bg-brand-black p-6 text-white">
          <Landmark className="size-6 text-primary" aria-hidden />
          <p className="mt-6 text-xs font-semibold uppercase text-white/55">
            {t("live.budgetEyebrow")}
          </p>
          <p className="mt-2 text-3xl font-bold text-white">
            {formatCurrency(totalDisbursed, locale)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            {t("live.budgetDescription")}
          </p>
          <Link
            href="/budget"
            className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-white hover:text-primary"
          >
            {t("live.inspectBudget")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-brand-red">
              {t("mission.eyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              {t("mission.title")}
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              {t("mission.body")}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map(({ key, href, Icon, title, description }) => (
              <Link
                key={key}
                href={href}
                className="group min-h-44 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-6 text-primary" aria-hidden />
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand-red" />
                </div>
                <h3 className="mt-5 font-medium text-card-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
