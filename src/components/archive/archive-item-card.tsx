import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArchiveItemTypeBadge } from "@/components/shared/archive-item-type-badge";
import type { Database } from "@/types/database.types";

type ArchiveItem = Database["public"]["Tables"]["archive_items"]["Row"];

export function ArchiveItemCard({ item }: { item: ArchiveItem }) {
  const locale = useLocale();

  const title = (locale === "bn" && item.title_bn) || item.title;
  const description =
    (locale === "bn" && item.description_bn) || item.description;

  return (
    <Link href={`/stories/${item.id}`}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-start justify-between gap-2">
          <h3 className="font-medium text-card-foreground">{title}</h3>
          <ArchiveItemTypeBadge itemType={item.item_type} />
        </CardHeader>
        {description && (
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
