import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
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

export default async function AdminArchivePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.archive" });

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("archive_items")
    .select("id, title, title_bn, item_type, verification_status, is_published, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/archive/new" />}>
          <Plus /> {t("newButton")}
        </Button>
      </div>

      {items && items.length > 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.title")}</TableHead>
                <TableHead>{t("table.type")}</TableHead>
                <TableHead>{t("table.verification")}</TableHead>
                <TableHead>{t("table.published")}</TableHead>
                <TableHead className="sr-only">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-foreground">
                    {(locale === "bn" && item.title_bn) || item.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(`itemType.${item.item_type}`)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.verification_status === "verified" ? "default" : "outline"}>
                      {t(`verification.${item.verification_status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.is_published ? "default" : "secondary"}>
                      {item.is_published ? t("published.yes") : t("published.no")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/archive/${item.id}`}
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
