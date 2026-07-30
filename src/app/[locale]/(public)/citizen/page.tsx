import { FilePlus2, FolderClock } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function CitizenPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (typeof userId !== "string") {
    redirect({
      href: "/citizen/login",
      locale: locale as (typeof routing.locales)[number],
    });
  }
  const authenticatedUserId = userId as string;

  const t = await getTranslations({
    locale,
    namespace: "auth.citizenPortal",
  });
  const { data: submissions } = await supabase
    .from("false_case_evidence")
    .select(
      "id, accused_full_name, accused_full_name_bn, status, created_at, evidence_files"
    )
    .eq("submitted_by", authenticatedUserId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-xs font-bold uppercase text-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SignOutButton inverted={false} />
          <Button nativeButton={false} render={<Link href="/false-cases/submit" />}>
            <FilePlus2 />
            {t("newSubmission")}
          </Button>
        </div>
      </div>

      <section className="pt-7">
        <h2 className="text-base font-semibold text-foreground">
          {t("submissionsTitle")}
        </h2>
        {submissions && submissions.length > 0 ? (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {submissions.map((submission) => {
              const files = Array.isArray(submission.evidence_files)
                ? submission.evidence_files.length
                : 0;
              return (
                <li
                  key={submission.id}
                  className="flex flex-wrap items-center gap-4 py-4"
                >
                  <span className="grid size-9 shrink-0 place-items-center bg-muted text-muted-foreground">
                    <FolderClock className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {(locale === "bn" && submission.accused_full_name_bn) ||
                        submission.accused_full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(submission.created_at, locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {t("files", { count: files })}
                    </p>
                  </div>
                  <Badge
                    variant={
                      submission.status === "rejected"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {t(`status.${submission.status}`)}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {submission.id.slice(0, 8).toUpperCase()}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-3 border-y border-border py-10 text-center">
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
