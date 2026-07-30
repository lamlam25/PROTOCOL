"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

export interface CaseInput {
  caseNumber: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  caseType: "criminal_prosecution" | "rehabilitation" | "compensation";
  status: "filed" | "investigation" | "under_trial" | "verdict" | "closed";
  victimId: string; // "none" sentinel or a uuid
  assignedLawyerId: string; // "none" sentinel or a uuid
  courtName: string;
  filedDate: string;
  isPublished: boolean;
}

export interface CaseUpdateInput {
  updateText: string;
  updateTextBn: string;
  milestoneType: "filed" | "hearing" | "evidence_submitted" | "verdict" | "other";
  updateDate: string;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) throw new Error("Unauthorized");
  return { supabase, userId: data.claims.sub as string };
}

function toRow(input: CaseInput) {
  return {
    case_number: input.caseNumber || null,
    title: input.title,
    title_bn: input.titleBn || null,
    description: input.description || null,
    description_bn: input.descriptionBn || null,
    case_type: input.caseType,
    status: input.status,
    victim_id: input.victimId === "none" ? null : input.victimId,
    assigned_lawyer_id: input.assignedLawyerId === "none" ? null : input.assignedLawyerId,
    court_name: input.courtName || null,
    filed_date: input.filedDate || null,
    is_published: input.isPublished,
  };
}

export async function createCase(input: CaseInput, locale: Locale) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("cases")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create case");
  redirect({ href: `/admin/cases/${data.id}`, locale });
}

export async function updateCase(id: string, input: CaseInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("cases").update(toRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addCaseUpdate(caseId: string, input: CaseUpdateInput) {
  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase.from("case_updates").insert({
    case_id: caseId,
    update_text: input.updateText,
    update_text_bn: input.updateTextBn || null,
    milestone_type: input.milestoneType,
    update_date: input.updateDate,
    is_published: true,
    created_by: userId,
  });
  if (error) throw new Error(error.message);
}

export async function deleteCaseUpdate(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("case_updates").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
