import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ArchiveItemForm } from "@/components/admin/archive/archive-item-form";

export default async function EditArchiveItemPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.archive.form" });

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("archive_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("editTitle")}</h1>
      <div className="mt-6">
        <ArchiveItemForm
          itemId={item.id}
          initial={{
            title: item.title,
            titleBn: item.title_bn ?? "",
            itemType: item.item_type as
              | "book"
              | "story"
              | "video"
              | "image"
              | "news_clipping"
              | "document",
            description: item.description ?? "",
            descriptionBn: item.description_bn ?? "",
            contentBody: item.content_body ?? "",
            contentBodyBn: item.content_body_bn ?? "",
            sourceCitation: item.source_citation ?? "",
            sourceUrl: item.source_url ?? "",
            publishedDate: item.published_date ?? "",
            verificationStatus: item.verification_status as "pending" | "verified",
            isPublished: item.is_published,
          }}
        />
      </div>
    </div>
  );
}
