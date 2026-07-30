import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { TimelineEventForm } from "@/components/admin/timeline/timeline-event-form";

export default async function NewTimelineEventPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.timeline.form" });

  const supabase = await createClient();
  const { data: archiveItems } = await supabase
    .from("archive_items")
    .select("id, title, title_bn")
    .order("title", { ascending: true });

  const archiveItemOptions = (archiveItems ?? []).map((item) => ({
    id: item.id,
    label: (locale === "bn" && item.title_bn) || item.title,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("createTitle")}</h1>
      <div className="mt-6">
        <TimelineEventForm archiveItemOptions={archiveItemOptions} />
      </div>
    </div>
  );
}
