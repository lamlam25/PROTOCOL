import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ReviewStatus = "pending" | "approved" | "rejected";

const VARIANT_BY_STATUS: Record<
  ReviewStatus,
  { variant: "outline" | "default" | "secondary"; className?: string }
> = {
  pending: { variant: "outline", className: "border-warning/30 bg-warning/10 text-warning" },
  approved: { variant: "default" },
  rejected: { variant: "secondary" },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const t = useTranslations("admin.forensics.reviewStatus");
  const { variant, className } = VARIANT_BY_STATUS[status];

  return (
    <Badge variant={variant} className={cn(className)}>
      {t(status)}
    </Badge>
  );
}
