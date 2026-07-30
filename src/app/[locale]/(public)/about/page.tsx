import { getTranslations, setRequestLocale } from "next-intl/server";
import { ComingSoon } from "@/components/shared/coming-soon";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });
  return <ComingSoon title={t("nav.about")} description={t("comingSoon.description")} />;
}
