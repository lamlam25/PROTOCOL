"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Check, TriangleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { approveForensicCheck, rejectForensicCheck } from "@/app/[locale]/admin/forensics/actions";

export function ForensicReviewActions({ id }: { id: string }) {
  const t = useTranslations("admin.forensics.detail");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setAction("approve");
    setError(null);
    startTransition(async () => {
      try {
        await approveForensicCheck(id);
        router.refresh();
      } catch {
        setError(t("actionError"));
      }
    });
  }

  function handleReject() {
    setAction("reject");
    setError(null);
    startTransition(async () => {
      try {
        await rejectForensicCheck(id);
        router.refresh();
      } catch {
        setError(t("actionError"));
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleApprove} disabled={isPending}>
          <Check /> {isPending && action === "approve" ? t("approving") : t("approve")}
        </Button>
        <Button variant="outline" onClick={handleReject} disabled={isPending}>
          <X /> {isPending && action === "reject" ? t("rejecting") : t("reject")}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
