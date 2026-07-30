import { getTranslations, setRequestLocale } from "next-intl/server";
import { VolunteerApplyForm } from "@/components/volunteers/volunteer-apply-form";

export default async function VolunteersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "volunteers" });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{t("description")}</p>
      <div className="mt-8">
        <VolunteerApplyForm />
      </div>
    </div>
  );
}
