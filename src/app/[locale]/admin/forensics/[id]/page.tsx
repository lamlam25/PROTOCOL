import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getChainAdapter } from "@/lib/chain";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import { getIpfsDisplayUrl } from "@/lib/storage/ipfs/url";
import { ForensicRiskBadge } from "@/components/shared/forensic-risk-badge";
import { ReviewStatusBadge } from "@/components/shared/review-status-badge";
import { Badge } from "@/components/ui/badge";
import { ForensicReviewActions } from "@/components/admin/forensic-review-actions";
import type { RiskFlag } from "@/lib/forensics/types";

export default async function AdminForensicDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.forensics" });

  const supabase = await createClient();
  const { data: check } = await supabase
    .from("forensic_checks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!check) notFound();

  const evidence =
    check.related_table === "false_case_evidence"
      ? (
          await supabase
            .from("false_case_evidence")
            .select("accused_full_name, accused_full_name_bn, description, contact_email, contact_phone")
            .eq("id", check.related_id)
            .maybeSingle()
        ).data
      : null;

  const phashMatches = Array.isArray(check.phash_matches)
    ? (check.phash_matches as { relatedTable?: string; relatedId?: string; hammingDistance?: number }[])
    : [];
  const extractedFields = (check.ocr_extracted_fields ?? {}) as {
    nationalId?: string;
    date?: string;
  };
  const chain = getChainAdapter();
  const anchoredRecord =
    check.onchain_tx_hash && check.onchain_contract_address && chain.isConfigured()
      ? await chain.verify(check.file_sha256)
      : null;
  const isMockChain =
    check.onchain_tx_hash?.startsWith("0xmock") ||
    check.onchain_contract_address?.startsWith("0xmock");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/forensics"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("detail.back")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-foreground">
          {t(`relatedTypes.${check.related_table}`)}
        </h1>
        <ForensicRiskBadge risk={check.risk_flag as RiskFlag} />
        <ReviewStatusBadge
          status={check.review_status as "pending" | "approved" | "rejected"}
        />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatDate(check.created_at, locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>

      {evidence && (
        <div className="mt-6 space-y-1 rounded-lg border border-border bg-card p-4 text-sm">
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            {t("detail.submittedFields")}
          </h2>
          <p>
            <span className="text-muted-foreground">{t("detail.accusedFullName")}: </span>
            <span className="text-foreground">
              {(locale === "bn" && evidence.accused_full_name_bn) ||
                evidence.accused_full_name}
            </span>
          </p>
          {evidence.description && (
            <p>
              <span className="text-muted-foreground">{t("detail.description")}: </span>
              <span className="text-foreground">{evidence.description}</span>
            </p>
          )}
          {(evidence.contact_email || evidence.contact_phone) && (
            <p>
              <span className="text-muted-foreground">{t("detail.contact")}: </span>
              <span className="text-foreground">
                {[evidence.contact_email, evidence.contact_phone]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </p>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">{t("detail.originalFile")}</p>
          {check.ipfs_cid ? (
            <div className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getIpfsDisplayUrl(check.ipfs_cid)}
                alt={t("detail.originalFile")}
                className="w-full rounded-md border border-border"
              />
              {check.ipfs_cid.startsWith("mock-") && (
                <Badge variant="outline" className="text-muted-foreground">
                  Mock IPFS (dev)
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">{t("detail.heatmap")}</p>
          {check.ela_heatmap_ipfs_cid ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getIpfsDisplayUrl(check.ela_heatmap_ipfs_cid)}
              alt={t("detail.heatmap")}
              className="w-full rounded-md border border-border bg-black"
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("detail.heatmapUnavailable")}</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 rounded-lg border border-border p-3 text-sm">
          <p className="text-xs text-muted-foreground">{t("detail.extractedFields")}</p>
          <p>
            <span className="text-muted-foreground">{t("detail.nationalId")}: </span>
            <span className="text-foreground">{extractedFields.nationalId || "—"}</span>
          </p>
          <p>
            <span className="text-muted-foreground">{t("detail.date")}: </span>
            <span className="text-foreground">{extractedFields.date || "—"}</span>
          </p>
        </div>
        <div className="space-y-1.5 rounded-lg border border-border p-3 text-sm">
          <p className="text-xs text-muted-foreground">{t("detail.duplicateMatches")}</p>
          {phashMatches.length > 0 ? (
            <ul className="space-y-1">
              {phashMatches.map((match, i) => (
                <li key={i} className="text-foreground">
                  {match.relatedTable} · {match.relatedId?.slice(0, 8)} ·{" "}
                  {t("table.risk")}: {match.hammingDistance}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-foreground">{t("detail.noDuplicates")}</p>
          )}
        </div>
      </div>

      {check.ocr_raw_text && (
        <div className="mt-6">
          <p className="mb-1 text-xs text-muted-foreground">{t("detail.ocrText")}</p>
          <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            {check.ocr_raw_text}
          </pre>
        </div>
      )}

      <p className="mt-4 font-mono text-xs text-muted-foreground">
        {t("detail.sha256")}: {check.file_sha256}
      </p>

      {check.onchain_tx_hash && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <ExternalLink className="size-3.5" aria-hidden />
          {t("detail.onchainAnchored")}: {check.onchain_tx_hash.slice(0, 18)}…
          {isMockChain && <span className="text-xs">({t("detail.mockChainNote")})</span>}
        </div>
      )}

      {anchoredRecord?.exists && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm">
          <h2 className="font-semibold text-foreground">{t("detail.onchainVerified")}</h2>
          <p className="mt-1 text-muted-foreground">
            {anchoredRecord.recordType} · {anchoredRecord.recordId}
          </p>
          <p className="mt-1 text-muted-foreground">
            {anchoredRecord.submitter} ·{" "}
            {formatDate(new Date(Number(anchoredRecord.timestamp) * 1000), locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <p className="mt-1 text-muted-foreground">
            {t("detail.contractAddress")}: {check.onchain_contract_address}
          </p>
        </div>
      )}

      {check.review_status === "pending" && (
        <div className="mt-6">
          <ForensicReviewActions id={check.id} />
        </div>
      )}
    </div>
  );
}
