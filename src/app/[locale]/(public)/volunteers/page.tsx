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
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </header>
      <div className="mx-auto mt-8 max-w-2xl">
        <VolunteerApplyForm />
      </div>
    </div>
  );
}
