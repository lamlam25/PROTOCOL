import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type CaseStatus = Database["public"]["Tables"]["cases"]["Row"]["status"];

const VARIANT_BY_STATUS: Record<
  CaseStatus,
  { variant: "outline" | "secondary" | "default"; className?: string }
> = {
  filed: { variant: "outline" },
  investigation: {
    variant: "outline",
    className: "border-warning/30 bg-warning/10 text-warning",
  },
  under_trial: { variant: "default" },
  verdict: { variant: "default" },
  closed: { variant: "secondary" },
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const t = useTranslations("cases.status");
  const { variant, className } = VARIANT_BY_STATUS[status];

  return (
    <Badge variant={variant} className={cn(className)}>
      {t(status)}
    </Badge>
  );
}
