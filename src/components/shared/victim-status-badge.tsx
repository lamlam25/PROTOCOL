import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database.types";

type VictimStatus = Database["public"]["Tables"]["victims"]["Row"]["status"];

export function VictimStatusBadge({ status }: { status: VictimStatus }) {
  const t = useTranslations("victims.status");

  if (status === "martyr") {
    return <Badge variant="destructive">{t("martyr")}</Badge>;
  }
  return <Badge variant="secondary">{t("injured")}</Badge>;
}
