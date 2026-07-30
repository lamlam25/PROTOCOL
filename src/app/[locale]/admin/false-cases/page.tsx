import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_CLASS: Record<string, string> = {
  submitted: "border-warning/30 bg-warning/10 text-warning",
  under_review: "border-warning/30 bg-warning/10 text-warning",
  verified: "",
  rejected: "",
};

export default async function AdminFalseCasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.falseCases" });

  const supabase = await createClient();
  const { data: submissions } = await supabase
    .from("false_case_evidence")
    .select("id, accused_full_name, accused_full_name_bn, district, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      {submissions && submissions.length > 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.submitted")}</TableHead>
                <TableHead>{t("table.accused")}</TableHead>
                <TableHead>{t("table.district")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="sr-only">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(s.created_at, locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {(locale === "bn" && s.accused_full_name_bn) || s.accused_full_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.district || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={s.status === "rejected" ? "destructive" : "outline"}
                      className={cn(STATUS_CLASS[s.status])}
                    >
                      {t(`status.${s.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/false-cases/${s.id}`}
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
