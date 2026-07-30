import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { TimelineCategoryBadge } from "@/components/shared/timeline-category-badge";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "timeline" });

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("timeline_events")
    .select("*")
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      {events && events.length > 0 ? (
        <ol className="relative mt-10 max-w-3xl space-y-8 border-l-2 border-border pl-8">
          {events.map((event) => {
            const title = (locale === "bn" && event.title_bn) || event.title;
            const description =
              (locale === "bn" && event.description_bn) || event.description;
            const dateLabel = formatDate(
              event.event_time
                ? `${event.event_date}T${event.event_time}`
                : event.event_date,
              locale,
              event.event_time
                ? {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }
                : { year: "numeric", month: "long", day: "numeric" }
            );

            return (
              <li key={event.id} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-10 top-1.5 size-4 rounded-full border-2 border-background bg-primary"
                />
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                    <span>{dateLabel}</span>
                    <TimelineCategoryBadge category={event.category} />
                  </div>
                  <h2 className="mt-2 font-medium text-card-foreground">
                    {title}
                  </h2>
                  {description && (
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                      {description}
                    </p>
                  )}
                  {event.related_archive_item_id && (
                    <Link
                      href={`/stories/${event.related_archive_item_id}`}
                      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      {t("relatedStory")}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-8 text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
