import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { ArchiveItemTypeBadge } from "@/components/shared/archive-item-type-badge";

export default async function ArchiveItemDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "archive" });

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("archive_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();

  const title = (locale === "bn" && item.title_bn) || item.title;
  const description =
    (locale === "bn" && item.description_bn) || item.description;
  const contentBody =
    (locale === "bn" && item.content_body_bn) || item.content_body;
  const paragraphs = contentBody
    ? contentBody.split(/\n\n+/).filter((p) => p.trim().length > 0)
    : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/stories"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("detail.back")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <ArchiveItemTypeBadge itemType={item.item_type} />
      </div>

      {item.published_date && (
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            <dt className="sr-only">{t("detail.published")}</dt>
            <dd>{formatDate(item.published_date, locale)}</dd>
          </div>
        </dl>
      )}

      {description && (
        <p className="mt-4 text-pretty leading-relaxed text-foreground/90">
          {description}
        </p>
      )}

      {paragraphs.length > 0 && (
        <div className="mt-8 space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-pretty leading-relaxed whitespace-pre-wrap text-foreground/90"
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}

      {(item.source_citation || item.source_url) && (
        <div className="mt-10 border-t border-border pt-4">
          <h2 className="text-sm font-semibold text-foreground">
            {t("detail.sourceCitation")}
          </h2>
          {item.source_citation && (
            <p className="mt-2 text-sm text-muted-foreground">
              {item.source_citation}
            </p>
          )}
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              {t("detail.sourceUrl")}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
