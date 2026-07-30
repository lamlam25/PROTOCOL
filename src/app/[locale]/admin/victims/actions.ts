"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

export interface VictimInput {
  fullName: string;
  fullNameBn: string;
  status: "martyr" | "injured";
  age: string;
  gender: string;
  district: string;
  upazila: string;
  incidentDate: string;
  incidentLocation: string;
  incidentLocationBn: string;
  storySummary: string;
  storySummaryBn: string;
  isPublished: boolean;
  verificationStatus: "pending" | "verified" | "flagged";
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) throw new Error("Unauthorized");
  return supabase;
}

function toRow(input: VictimInput) {
  return {
    full_name: input.fullName,
    full_name_bn: input.fullNameBn || null,
    status: input.status,
    age: input.age ? Number(input.age) : null,
    gender: input.gender || null,
    district: input.district || null,
    upazila: input.upazila || null,
    incident_date: input.incidentDate || null,
    incident_location: input.incidentLocation || null,
    incident_location_bn: input.incidentLocationBn || null,
    story_summary: input.storySummary || null,
    story_summary_bn: input.storySummaryBn || null,
    is_published: input.isPublished,
    verification_status: input.verificationStatus,
  };
}

export async function createVictim(input: VictimInput, locale: Locale) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("victims")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create victim record");
  redirect({ href: `/admin/victims/${data.id}`, locale });
}

export async function updateVictim(id: string, input: VictimInput, locale: Locale) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("victims").update(toRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
  redirect({ href: "/admin/victims", locale });
}
