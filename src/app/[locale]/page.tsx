import {
  HeartHandshake,
  Scale,
  ShieldAlert,
  Landmark,
  Users,
  BookOpenText,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const PILLAR_ICONS = {
  victims: HeartHandshake,
  cases: Scale,
  falseCases: ShieldAlert,
  budget: Landmark,
  volunteers: Users,
  stories: BookOpenText,
} as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });

  const pillars = (
    Object.keys(PILLAR_ICONS) as Array<keyof typeof PILLAR_ICONS>
  ).map((key) => ({
    key,
    Icon: PILLAR_ICONS[key],
    title: t(`pillars.${key}.title`),
    description: t(`pillars.${key}.description`),
  }));

  return (
    <div>
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/victims" />}
            >
              {t("hero.viewVictims")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/budget" />}
            >
              {t("hero.viewBudget")}
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <h2 className="text-xl font-semibold text-foreground">
          {t("mission.title")}
        </h2>
        <p className="mt-3 text-pretty text-muted-foreground">
          {t("mission.body")}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="mb-6 text-center text-xl font-semibold text-foreground">
          {t("pillars.title")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map(({ key, Icon, title, description }) => (
            <div
              key={key}
              className="rounded-lg border border-border bg-card p-5"
            >
              <Icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-3 font-medium text-card-foreground">
                {title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
