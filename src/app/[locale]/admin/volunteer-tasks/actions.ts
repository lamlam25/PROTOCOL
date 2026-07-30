"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

export interface VolunteerTaskInput {
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  taskType:
    | "field_verification"
    | "distribution"
    | "documentation"
    | "outreach"
    | "event_support"
    | "other";
  status: "open" | "assigned" | "in_progress" | "completed" | "cancelled";
  district: string;
  upazila: string;
  geoLat: string;
  geoLng: string;
  assignedVolunteerId: string; // "none" sentinel or a uuid
  dueDate: string;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) throw new Error("Unauthorized");
  return { supabase, userId: data.claims.sub as string };
}

function toRow(input: VolunteerTaskInput) {
  return {
    title: input.title,
    title_bn: input.titleBn || null,
    description: input.description || null,
    description_bn: input.descriptionBn || null,
    task_type: input.taskType,
    status: input.status,
    district: input.district || null,
    upazila: input.upazila || null,
    geo_lat: input.geoLat ? Number(input.geoLat) : null,
    geo_lng: input.geoLng ? Number(input.geoLng) : null,
    assigned_volunteer_id: input.assignedVolunteerId === "none" ? null : input.assignedVolunteerId,
    due_date: input.dueDate || null,
  };
}

export async function createVolunteerTask(input: VolunteerTaskInput, locale: Locale) {
  const { supabase, userId } = await requireAdmin();
  const { data, error } = await supabase
    .from("volunteer_tasks")
    .insert({ ...toRow(input), created_by: userId })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create task");
  redirect({ href: `/admin/volunteer-tasks/${data.id}`, locale });
}

export async function updateVolunteerTask(id: string, input: VolunteerTaskInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("volunteer_tasks").update(toRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
}
