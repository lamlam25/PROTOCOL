import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ArchiveItemCard } from "@/components/archive/archive-item-card";

export default async function StoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "archive" });

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("archive_items")
    .select("*")
    .order("published_date", { ascending: false, nullsFirst: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      {items && items.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ArchiveItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
