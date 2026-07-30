import { ExternalLink } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildBudgetSankeyData } from "@/lib/budget-sankey";
import { BudgetSankeyChart } from "@/components/budget/sankey-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BudgetPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "budget" });
  const categories = t.raw("category") as Record<string, string>;

  const supabase = await createClient();
  const [{ data: allocations }, { data: transactions }] = await Promise.all([
    supabase
      .from("budget_allocations")
      .select("*")
      .order("allocated_amount", { ascending: false }),
    supabase
      .from("budget_transactions")
      .select("*")
      .order("disbursement_date", { ascending: false }),
  ]);

  const totalAllocated =
    allocations?.reduce((sum, a) => sum + Number(a.allocated_amount), 0) ?? 0;
  const totalDisbursed =
    transactions
      ?.filter((tx) => tx.transaction_type === "disbursement")
      .reduce((sum, tx) => sum + Number(tx.amount), 0) ?? 0;

  const allocationTitleById = new Map(
    (allocations ?? []).map((a) => [
      a.id,
      (locale === "bn" && a.title_bn) || a.title,
    ])
  );

  const sankeyData = buildBudgetSankeyData(
    allocations ?? [],
    transactions ?? [],
    locale,
    categories
  );
  const explorerBaseUrl = process.env.NEXT_PUBLIC_CHAIN_EXPLORER_BASE_URL;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">
              {t("totalAllocated")}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {formatCurrency(totalAllocated, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">
              {t("totalDisbursed")}
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-foreground">
              {formatCurrency(totalDisbursed, locale)}
            </p>
          </CardContent>
        </Card>
      </div>

      {sankeyData.links.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">
            {t("sankeyTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("sankeyDescription")}
          </p>
          <div className="mt-3 rounded-lg border border-border bg-card p-4">
            <BudgetSankeyChart data={sankeyData} locale={locale} />
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          {t("allocationsTitle")}
        </h2>
        {allocations && allocations.length > 0 ? (
          <div className="mt-3 rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("allocationsTable.title")}</TableHead>
                  <TableHead>{t("allocationsTable.category")}</TableHead>
                  <TableHead>{t("allocationsTable.allocated")}</TableHead>
                  <TableHead>{t("allocationsTable.source")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => {
                  const title =
                    (locale === "bn" && allocation.title_bn) ||
                    allocation.title;
                  return (
                    <TableRow key={allocation.id}>
                      <TableCell className="whitespace-normal text-foreground">
                        {title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {categories[allocation.category] ??
                          allocation.category}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatCurrency(
                          Number(allocation.allocated_amount),
                          locale
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {allocation.source ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="mt-3 text-muted-foreground">{t("empty")}</p>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">
          {t("transactionsTitle")}
        </h2>
        {transactions && transactions.length > 0 ? (
          <div className="mt-3 rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("transactionsTable.date")}</TableHead>
                  <TableHead>{t("transactionsTable.recipient")}</TableHead>
                  <TableHead>{t("transactionsTable.allocation")}</TableHead>
                  <TableHead>{t("transactionsTable.amount")}</TableHead>
                  <TableHead>{t("transactionsTable.description")}</TableHead>
                  <TableHead>{t("transactionsTable.onchain")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const recipient =
                    (locale === "bn" && tx.recipient_name_bn) ||
                    tx.recipient_name ||
                    "—";
                  const description =
                    (locale === "bn" && tx.description_bn) ||
                    tx.description ||
                    "—";
                  const allocationTitle = tx.allocation_id
                    ? allocationTitleById.get(tx.allocation_id) ?? "—"
                    : "—";
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(tx.disbursement_date, locale)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {recipient}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {allocationTitle}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatCurrency(Number(tx.amount), locale)}
                      </TableCell>
                      <TableCell className="max-w-[20rem] truncate whitespace-normal text-muted-foreground">
                        {description}
                      </TableCell>
                      <TableCell>
                        {tx.onchain_tx_hash && explorerBaseUrl ? (
                          <a
                            href={`${explorerBaseUrl}/tx/${tx.onchain_tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            {t("onchain.view")}
                            <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            {t("onchain.pending")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="mt-3 text-muted-foreground">{t("empty")}</p>
        )}
      </div>
    </div>
  );
}
