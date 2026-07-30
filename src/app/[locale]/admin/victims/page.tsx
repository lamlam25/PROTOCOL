import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VictimStatusBadge } from "@/components/shared/victim-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/types/database.types";

type VerificationStatus =
  Database["public"]["Tables"]["victims"]["Row"]["verification_status"];

const VERIFICATION_CLASS: Record<VerificationStatus, string> = {
  pending: "border-warning/30 bg-warning/10 text-warning",
  verified: "",
  flagged: "",
};

export default async function AdminVictimsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.victims" });

  const supabase = await createClient();
  const { data: victims } = await supabase
    .from("victims")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/victims/new" />}>
          <Plus /> {t("newButton")}
        </Button>
      </div>

      {victims && victims.length > 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.verification")}</TableHead>
                <TableHead>{t("table.published")}</TableHead>
                <TableHead className="sr-only">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {victims.map((victim) => (
                <TableRow key={victim.id}>
                  <TableCell className="text-foreground">
                    {(locale === "bn" && victim.full_name_bn) || victim.full_name}
                  </TableCell>
                  <TableCell>
                    <VictimStatusBadge status={victim.status} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        victim.verification_status === "flagged" ? "destructive" : "outline"
                      }
                      className={cn(VERIFICATION_CLASS[victim.verification_status])}
                    >
                      {t(`verification.${victim.verification_status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={victim.is_published ? "default" : "secondary"}>
                      {victim.is_published ? t("published.yes") : t("published.no")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/victims/${victim.id}`}
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
