import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminTimelinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.timeline" });

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("timeline_events")
    .select("id, event_date, title, title_bn, category, is_published")
    .order("event_date", { ascending: true });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/timeline/new" />}>
          <Plus /> {t("newButton")}
        </Button>
      </div>

      {events && events.length > 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead>{t("table.title")}</TableHead>
                <TableHead>{t("table.category")}</TableHead>
                <TableHead>{t("table.published")}</TableHead>
                <TableHead className="sr-only">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(event.event_date, locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {(locale === "bn" && event.title_bn) || event.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(`category.${event.category}`)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.is_published ? "default" : "secondary"}>
                      {event.is_published ? t("published.yes") : t("published.no")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/timeline/${event.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t("table.actions")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="mt-6 text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
