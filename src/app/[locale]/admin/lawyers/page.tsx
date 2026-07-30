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

export default async function AdminLawyersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.lawyers" });

  const supabase = await createClient();
  const { data: lawyers } = await supabase
    .from("lawyers")
    .select("*")
    .order("full_name", { ascending: true });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/lawyers/new" />}>
          <Plus /> {t("newButton")}
        </Button>
      </div>

      {lawyers && lawyers.length > 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.barRegNo")}</TableHead>
                <TableHead>{t("table.specialization")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="sr-only">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lawyers.map((lawyer) => (
                <TableRow key={lawyer.id}>
                  <TableCell className="text-foreground">
                    {(locale === "bn" && lawyer.full_name_bn) || lawyer.full_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lawyer.bar_registration_no || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lawyer.specialization?.join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={lawyer.is_active ? "default" : "secondary"}>
                      {lawyer.is_active ? t("status.active") : t("status.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/lawyers/${lawyer.id}`}
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
