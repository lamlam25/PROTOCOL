import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VictimStatusBadge } from "@/components/shared/victim-status-badge";
import type { Database } from "@/types/database.types";

type Victim = Database["public"]["Tables"]["victims"]["Row"];

export function VictimCard({ victim }: { victim: Victim }) {
  const locale = useLocale();
  const t = useTranslations("victims.card");

  const name =
    (locale === "bn" && victim.full_name_bn) || victim.full_name;
  const story =
    (locale === "bn" && victim.story_summary_bn) || victim.story_summary;

  return (
    <Link href={`/victims/${victim.id}`}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-start justify-between gap-2">
          <h3 className="font-medium text-card-foreground">{name}</h3>
          <VictimStatusBadge status={victim.status} />
        </CardHeader>
        <CardContent className="space-y-2">
          {(victim.district || victim.age) && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {victim.district && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {victim.district}
                </span>
              )}
              {victim.age && (
                <span>{victim.district ? "· " : ""}{t("age", { age: victim.age })}</span>
              )}
            </div>
          )}
          {story && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {story}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
