"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

export interface ArchiveItemInput {
  title: string;
  titleBn: string;
  itemType: "book" | "story" | "video" | "image" | "news_clipping" | "document";
  description: string;
  descriptionBn: string;
  contentBody: string;
  contentBodyBn: string;
  sourceCitation: string;
  sourceUrl: string;
  publishedDate: string;
  verificationStatus: "pending" | "verified";
  isPublished: boolean;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) throw new Error("Unauthorized");
  return { supabase, userId: data.claims.sub as string };
}

function toRow(input: ArchiveItemInput) {
  return {
    title: input.title,
    title_bn: input.titleBn || null,
    item_type: input.itemType,
    description: input.description || null,
    description_bn: input.descriptionBn || null,
    content_body: input.contentBody || null,
    content_body_bn: input.contentBodyBn || null,
    source_citation: input.sourceCitation || null,
    source_url: input.sourceUrl || null,
    published_date: input.publishedDate || null,
    verification_status: input.verificationStatus,
    is_published: input.isPublished,
  };
}

export async function createArchiveItem(input: ArchiveItemInput, locale: Locale) {
  const { supabase, userId } = await requireAdmin();
  const { data, error } = await supabase
    .from("archive_items")
    .insert({ ...toRow(input), created_by: userId })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create archive item");
  redirect({ href: `/admin/archive/${data.id}`, locale });
}

export async function updateArchiveItem(id: string, input: ArchiveItemInput, locale: Locale) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("archive_items").update(toRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
  redirect({ href: "/admin/archive", locale });
}
