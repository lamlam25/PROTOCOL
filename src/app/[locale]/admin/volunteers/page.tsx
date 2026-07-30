import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminVolunteersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.volunteers" });

  const supabase = await createClient();
  const { data: volunteers } = await supabase
    .from("volunteers")
    .select("id, full_name, full_name_bn, district, skillsets, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      {volunteers && volunteers.length > 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.district")}</TableHead>
                <TableHead>{t("table.skills")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="sr-only">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {volunteers.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="text-foreground">
                    {(locale === "bn" && v.full_name_bn) || v.full_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{v.district || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.skillsets?.join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.status === "rejected" ? "destructive" : "outline"}>
                      {t(`status.${v.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/volunteers/${v.id}`}
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
