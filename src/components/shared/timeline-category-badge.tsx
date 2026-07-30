import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type TimelineCategory =
  Database["public"]["Tables"]["timeline_events"]["Row"]["category"];

const VARIANT_BY_CATEGORY: Record<
  TimelineCategory,
  {
    variant: "outline" | "secondary" | "default" | "destructive";
    className?: string;
  }
> = {
  protest: { variant: "default" },
  crackdown: {
    variant: "outline",
    className: "border-warning/30 bg-warning/10 text-warning",
  },
  casualty: { variant: "destructive" },
  political: { variant: "secondary" },
  international: { variant: "outline" },
  other: { variant: "outline" },
};

export function TimelineCategoryBadge({
  category,
}: {
  category: TimelineCategory;
}) {
  const t = useTranslations("timeline.category");
  const { variant, className } = VARIANT_BY_CATEGORY[category];

  return (
    <Badge variant={variant} className={cn(className)}>
      {t(category)}
    </Badge>
  );
}
