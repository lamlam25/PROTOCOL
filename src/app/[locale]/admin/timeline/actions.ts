"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

export interface TimelineEventInput {
  eventDate: string;
  eventTime: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  category: "protest" | "crackdown" | "casualty" | "political" | "international" | "other";
  relatedArchiveItemId: string; // "none" sentinel or a uuid
  sourceCitation: string;
  isPublished: boolean;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) throw new Error("Unauthorized");
  return { supabase, userId: data.claims.sub as string };
}

function toRow(input: TimelineEventInput) {
  return {
    event_date: input.eventDate,
    event_time: input.eventTime || null,
    title: input.title,
    title_bn: input.titleBn || null,
    description: input.description || null,
    description_bn: input.descriptionBn || null,
    category: input.category,
    related_archive_item_id:
      input.relatedArchiveItemId === "none" ? null : input.relatedArchiveItemId,
    source_citation: input.sourceCitation || null,
    is_published: input.isPublished,
  };
}

export async function createTimelineEvent(input: TimelineEventInput, locale: Locale) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("timeline_events")
    .insert({ ...toRow(input), created_by: userId });
  if (error) throw new Error(error.message);
  redirect({ href: "/admin/timeline", locale });
}

export async function updateTimelineEvent(id: string, input: TimelineEventInput, locale: Locale) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("timeline_events").update(toRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
  redirect({ href: "/admin/timeline", locale });
}
