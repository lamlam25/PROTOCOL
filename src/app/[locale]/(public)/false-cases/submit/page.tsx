import { getTranslations, setRequestLocale } from "next-intl/server";
import { FalseCaseForm } from "@/components/false-cases/false-case-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default async function FalseCaseSubmitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    redirect({
      href: "/citizen/login",
      locale: locale as (typeof routing.locales)[number],
    });
  }
  const t = await getTranslations({ locale, namespace: "falseCases" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="border-l-4 border-brand-red pl-4">
        <h1 className="text-2xl font-semibold text-foreground">
          {t("submitTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("submitDescription")}
        </p>
        <p className="mt-2 text-sm font-medium text-primary">
          {t("anonymousNotice")}
        </p>
      </div>
      <div className="mt-8">
        <FalseCaseForm />
      </div>
    </div>
  );
}
