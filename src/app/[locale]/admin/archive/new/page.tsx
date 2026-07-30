import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArchiveItemForm } from "@/components/admin/archive/archive-item-form";

export default async function NewArchiveItemPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.archive.form" });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("createTitle")}</h1>
      <div className="mt-6">
        <ArchiveItemForm />
      </div>
    </div>
  );
}
