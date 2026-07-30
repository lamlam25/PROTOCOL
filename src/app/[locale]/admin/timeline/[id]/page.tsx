import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { TimelineEventForm } from "@/components/admin/timeline/timeline-event-form";

export default async function EditTimelineEventPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.timeline.form" });

  const supabase = await createClient();
  const [{ data: event }, { data: archiveItems }] = await Promise.all([
    supabase.from("timeline_events").select("*").eq("id", id).maybeSingle(),
    supabase.from("archive_items").select("id, title, title_bn").order("title", { ascending: true }),
  ]);

  if (!event) notFound();

  const archiveItemOptions = (archiveItems ?? []).map((item) => ({
    id: item.id,
    label: (locale === "bn" && item.title_bn) || item.title,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("editTitle")}</h1>
      <div className="mt-6">
        <TimelineEventForm
          eventId={event.id}
          archiveItemOptions={archiveItemOptions}
          initial={{
            eventDate: event.event_date,
            eventTime: event.event_time ?? "",
            title: event.title,
            titleBn: event.title_bn ?? "",
            description: event.description ?? "",
            descriptionBn: event.description_bn ?? "",
            category: event.category as
              | "protest"
              | "crackdown"
              | "casualty"
              | "political"
              | "international"
              | "other",
            relatedArchiveItemId: event.related_archive_item_id ?? "none",
            sourceCitation: event.source_citation ?? "",
            isPublished: event.is_published,
          }}
        />
      </div>
    </div>
  );
}
