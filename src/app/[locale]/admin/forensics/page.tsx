import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { ForensicRiskBadge } from "@/components/shared/forensic-risk-badge";
import { ReviewStatusBadge } from "@/components/shared/review-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RiskFlag } from "@/lib/forensics/types";

export default async function AdminForensicsQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.forensics" });

  const supabase = await createClient();
  const { data: checks } = await supabase
    .from("forensic_checks")
    .select(
      "id, related_table, related_id, risk_flag, review_status, created_at, file_name, file_kind"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      {checks && checks.length > 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.submitted")}</TableHead>
                <TableHead>{t("table.type")}</TableHead>
                <TableHead>{t("table.risk")}</TableHead>
                <TableHead>{t("table.reviewStatus")}</TableHead>
                <TableHead className="sr-only">{t("viewDetails")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checks.map((check) => (
                <TableRow key={check.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(check.created_at, locale, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-foreground">
                    <span className="block">
                      {t(`relatedTypes.${check.related_table}`)}
                    </span>
                    {check.file_name && (
                      <span className="block max-w-56 truncate text-xs text-muted-foreground">
                        {check.file_name} · {check.file_kind || "file"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ForensicRiskBadge risk={check.risk_flag as RiskFlag} />
                  </TableCell>
                  <TableCell>
                    <ReviewStatusBadge
                      status={check.review_status as "pending" | "approved" | "rejected"}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/forensics/${check.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t("viewDetails")}
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
