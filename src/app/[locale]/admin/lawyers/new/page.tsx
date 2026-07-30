import { getTranslations, setRequestLocale } from "next-intl/server";
import { LawyerForm } from "@/components/admin/lawyers/lawyer-form";

export default async function NewLawyerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.lawyers.form" });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("createTitle")}</h1>
      <div className="mt-6">
        <LawyerForm />
      </div>
    </div>
  );
}
