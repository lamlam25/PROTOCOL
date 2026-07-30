import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Landmark } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CaseStatusBadge } from "@/components/shared/case-status-badge";
import { formatDate } from "@/lib/format";
import type { Database } from "@/types/database.types";

type Case = Database["public"]["Tables"]["cases"]["Row"];

export function CaseCard({ caseItem }: { caseItem: Case }) {
  const locale = useLocale();
  const t = useTranslations("cases");

  const title = (locale === "bn" && caseItem.title_bn) || caseItem.title;

  return (
    <Link href={`/cases/${caseItem.id}`}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-start justify-between gap-2">
          <h3 className="font-medium text-card-foreground">{title}</h3>
          <CaseStatusBadge status={caseItem.status} />
        </CardHeader>
        <CardContent className="space-y-2">
          {caseItem.case_number && (
            <p className="text-sm text-muted-foreground">
              {t("card.caseNumber", { number: caseItem.case_number })}
            </p>
          )}
          {(caseItem.court_name || caseItem.filed_date) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {caseItem.court_name && (
                <span className="inline-flex items-center gap-1">
                  <Landmark className="size-3.5" aria-hidden />
                  {caseItem.court_name}
                </span>
              )}
              {caseItem.filed_date && (
                <span className="inline-flex items-center gap-1">
                  {caseItem.court_name ? "· " : ""}
                  <CalendarDays className="size-3.5" aria-hidden />
                  {formatDate(caseItem.filed_date, locale)}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
