import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskFlag } from "@/lib/forensics/types";

const VARIANT_BY_RISK: Record<
  RiskFlag,
  { variant: "outline" | "destructive"; className?: string }
> = {
  none: { variant: "outline" },
  low: { variant: "outline", className: "border-warning/30 bg-warning/10 text-warning" },
  medium: { variant: "outline", className: "border-warning/30 bg-warning/10 text-warning" },
  high: { variant: "destructive" },
};

export function ForensicRiskBadge({ risk }: { risk: RiskFlag }) {
  const t = useTranslations("forensics.ela.risk");
  const { variant, className } = VARIANT_BY_RISK[risk];

  return (
    <Badge variant={variant} className={cn(className)}>
      {t(risk)}
    </Badge>
  );
}
