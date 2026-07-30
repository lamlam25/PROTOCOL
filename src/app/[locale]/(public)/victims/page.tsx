import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VictimCard } from "@/components/victims/victim-card";

export default async function VictimsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "victims" });

  const supabase = await createClient();
  const { data: victims } = await supabase
    .from("victims")
    .select("*")
    .order("incident_date", { ascending: false, nullsFirst: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      {victims && victims.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {victims.map((victim) => (
            <VictimCard key={victim.id} victim={victim} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
