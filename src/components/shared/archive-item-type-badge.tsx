import { useTranslations } from "next-intl";
import { Book, BookOpen, FileText, Image, Newspaper, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database.types";

type ArchiveItemType =
  Database["public"]["Tables"]["archive_items"]["Row"]["item_type"];

const ICON_BY_TYPE: Record<
  "book" | "story" | "video" | "image" | "news_clipping" | "document",
  typeof Book
> = {
  book: Book,
  story: BookOpen,
  video: Video,
  image: Image,
  news_clipping: Newspaper,
  document: FileText,
};

export function ArchiveItemTypeBadge({
  itemType,
}: {
  itemType: ArchiveItemType;
}) {
  const t = useTranslations("archive.itemType");
  const Icon =
    ICON_BY_TYPE[itemType as keyof typeof ICON_BY_TYPE] ?? FileText;

  return (
    <Badge variant="outline">
      <Icon aria-hidden />
      {t(itemType)}
    </Badge>
  );
}
