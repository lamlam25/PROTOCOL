import { getTranslations, setRequestLocale } from "next-intl/server";
import { VictimForm } from "@/components/admin/victims/victim-form";

export default async function NewVictimPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.victims.form" });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("createTitle")}</h1>
      <div className="mt-6">
        <VictimForm />
      </div>
    </div>
  );
}
