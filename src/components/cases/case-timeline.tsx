import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { Database } from "@/types/database.types";

type CaseUpdate = Database["public"]["Tables"]["case_updates"]["Row"];

const MILESTONE_KEYS = [
  "filed",
  "hearing",
  "evidence_submitted",
  "verdict",
  "other",
] as const;
type MilestoneKey = (typeof MILESTONE_KEYS)[number];

function toMilestoneKey(value: string): MilestoneKey {
  return (MILESTONE_KEYS as readonly string[]).includes(value)
    ? (value as MilestoneKey)
    : "other";
}

export function CaseTimeline({ updates }: { updates: CaseUpdate[] }) {
  const locale = useLocale();
  const t = useTranslations("cases.detail");

  if (updates.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noUpdates")}</p>;
  }

  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {updates.map((update) => {
        const text =
          (locale === "bn" && update.update_text_bn) || update.update_text;
        const milestoneKey = toMilestoneKey(update.milestone_type);

        return (
          <li key={update.id} className="relative">
            <span
              className="absolute -left-[1.6875rem] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background"
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{t(`milestone.${milestoneKey}`)}</Badge>
              <span className="text-sm text-muted-foreground">
                {formatDate(update.update_date, locale)}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
              {text}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
