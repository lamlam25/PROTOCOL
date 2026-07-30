import { FileSearch } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCitizenAuthOverview } from "@/lib/admin/auth-users";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.users" });
  const overview = await getCitizenAuthOverview();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      {overview.users.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.user")}</TableHead>
                <TableHead>{t("table.joined")}</TableHead>
                <TableHead>{t("table.lastSignIn")}</TableHead>
                <TableHead>{t("table.evidence")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <span className="block text-foreground">
                      {user.fullName || user.email || t("unknown")}
                    </span>
                    {user.fullName && user.email && (
                      <span className="block text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.joinedAt, locale)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastSignInAt
                      ? formatDate(user.lastSignInAt, locale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : t("never")}
                  </TableCell>
                  <TableCell>
                    {user.evidenceCount > 0 ? (
                      <Link
                        href={`/admin/false-cases?user=${user.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        <FileSearch className="size-4" aria-hidden />
                        {t("evidenceCount", { count: user.evidenceCount })}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">
                        {t("evidenceCount", { count: 0 })}
                      </span>
                    )}
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
