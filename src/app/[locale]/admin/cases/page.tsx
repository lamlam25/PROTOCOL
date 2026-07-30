import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CaseStatusBadge } from "@/components/shared/case-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminCasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.cases" });

  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/cases/new" />}>
          <Plus /> {t("newButton")}
        </Button>
      </div>

      {cases && cases.length > 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.title")}</TableHead>
                <TableHead>{t("table.caseNumber")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.published")}</TableHead>
                <TableHead className="sr-only">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-foreground">
                    {(locale === "bn" && c.title_bn) || c.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.case_number || "—"}
                  </TableCell>
                  <TableCell>
                    <CaseStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.is_published ? "default" : "secondary"}>
                      {c.is_published ? t("published.yes") : t("published.no")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/cases/${c.id}`}
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
