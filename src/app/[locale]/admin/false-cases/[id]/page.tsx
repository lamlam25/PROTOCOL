import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FalseCaseStatusForm } from "@/components/admin/false-cases/false-case-status-form";
import type { FalseCaseStatus } from "@/app/[locale]/admin/false-cases/actions";

const STATUS_CLASS: Record<string, string> = {
  submitted: "border-warning/30 bg-warning/10 text-warning",
  under_review: "border-warning/30 bg-warning/10 text-warning",
  verified: "",
  rejected: "",
};

export default async function AdminFalseCaseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.falseCases" });

  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("false_case_evidence")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!submission) notFound();

  const { data: forensicChecks } = await supabase
    .from("forensic_checks")
    .select("id, risk_flag, review_status, file_name, file_kind")
    .eq("related_table", "false_case_evidence")
    .eq("related_id", id);

  const evidenceFiles = Array.isArray(submission.evidence_files)
    ? (submission.evidence_files as {
        ipfs_cid?: string;
        sha256?: string;
        file_type?: string;
      }[])
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/false-cases"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("detail.back")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">
          {(locale === "bn" && submission.accused_full_name_bn) ||
            submission.accused_full_name}
        </h1>
        <Badge
          variant={submission.status === "rejected" ? "destructive" : "outline"}
          className={cn(STATUS_CLASS[submission.status])}
        >
          {t(`status.${submission.status}`)}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(submission.created_at, locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="mt-6 space-y-1 rounded-lg border border-border bg-card p-4 text-sm">
        {submission.case_reference_number && (
          <p>
            <span className="text-muted-foreground">{t("detail.caseReference")}: </span>
            <span className="text-foreground">{submission.case_reference_number}</span>
          </p>
        )}
        <p>
          <span className="text-muted-foreground">
            {t("detail.submitterRelationship")}:{" "}
          </span>
          <span className="text-foreground">
            {t(
              `detail.relationship.${submission.submitter_relationship || "self"}`
            )}
          </span>
        </p>
        {submission.district && (
          <p>
            <span className="text-muted-foreground">{t("detail.district")}: </span>
            <span className="text-foreground">{submission.district}</span>
          </p>
        )}
        {submission.alibi_timestamp && (
          <p>
            <span className="text-muted-foreground">{t("detail.alibiTimestamp")}: </span>
            <span className="text-foreground">
              {formatDate(submission.alibi_timestamp, locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </p>
        )}
        {submission.description && (
          <p>
            <span className="text-muted-foreground">{t("detail.description")}: </span>
            <span className="text-foreground">{submission.description}</span>
          </p>
        )}
        {(submission.contact_email || submission.contact_phone) && (
          <p>
            <span className="text-muted-foreground">{t("detail.contact")}: </span>
            <span className="text-foreground">
              {[submission.contact_email, submission.contact_phone].filter(Boolean).join(" · ")}
            </span>
          </p>
        )}
      </div>

      {(evidenceFiles.length > 0 || (forensicChecks && forensicChecks.length > 0)) && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            {t("detail.evidenceTitle")}
          </h2>
          <ul className="space-y-2">
            {(forensicChecks ?? []).map((check) => (
              <li key={check.id}>
                <Link
                  href={`/admin/forensics/${check.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm hover:border-primary/40"
                >
                  <span className="inline-flex items-center gap-1.5 text-foreground">
                    <ShieldCheck className="size-4 text-primary" aria-hidden />
                    <span className="min-w-0">
                      <span className="block">
                        {check.file_name || t("detail.viewForensicAnalysis")}
                      </span>
                      {check.file_name && (
                        <span className="block text-xs text-muted-foreground">
                          {t("detail.viewForensicAnalysis")} ·{" "}
                          {check.file_kind || "file"}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {check.risk_flag} · {check.review_status}
                  </span>
                </Link>
              </li>
            ))}
            {evidenceFiles.length > (forensicChecks?.length ?? 0) && (
              <li className="text-xs text-muted-foreground">
                {t("detail.filesCount", { count: evidenceFiles.length })}
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <FalseCaseStatusForm
          id={submission.id}
          initialStatus={submission.status as FalseCaseStatus}
          initialNotes={submission.review_notes ?? ""}
        />
      </div>
    </div>
  );
}
