"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

export interface LawyerInput {
  fullName: string;
  fullNameBn: string;
  barRegistrationNo: string;
  specialization: string[];
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) throw new Error("Unauthorized");
  return supabase;
}

export async function createLawyer(input: LawyerInput, locale: Locale) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from("lawyers")
    .insert({
      full_name: input.fullName,
      full_name_bn: input.fullNameBn || null,
      bar_registration_no: input.barRegistrationNo || null,
      specialization: input.specialization,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      is_active: input.isActive,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create lawyer");
  redirect({ href: `/admin/lawyers/${data.id}`, locale });
}

export async function updateLawyer(id: string, input: LawyerInput, locale: Locale) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("lawyers")
    .update({
      full_name: input.fullName,
      full_name_bn: input.fullNameBn || null,
      bar_registration_no: input.barRegistrationNo || null,
      specialization: input.specialization,
      contact_email: input.contactEmail || null,
      contact_phone: input.contactPhone || null,
      is_active: input.isActive,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  redirect({ href: "/admin/lawyers", locale });
}
