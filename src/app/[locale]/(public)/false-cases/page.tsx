import { ShieldAlert, FileCheck2, Lock } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function FalseCasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "falseCases" });

  const points = [
    { Icon: Lock, title: t("points.private.title"), body: t("points.private.body") },
    { Icon: ShieldAlert, title: t("points.forensic.title"), body: t("points.forensic.body") },
    { Icon: FileCheck2, title: t("points.track.title"), body: t("points.track.body") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-2 text-pretty text-muted-foreground">{t("intro")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {points.map(({ Icon, title, body }) => (
          <div key={title} className="rounded-lg border border-border bg-card p-4">
            <Icon className="size-5 text-primary" aria-hidden />
            <h2 className="mt-2 text-sm font-medium text-card-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button size="lg" nativeButton={false} render={<Link href="/false-cases/submit" />}>
          {t("cta")}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">{t("loginNote")}</p>
      </div>
    </div>
  );
}
