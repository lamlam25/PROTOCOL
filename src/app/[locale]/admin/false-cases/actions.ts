"use server";

import { createClient } from "@/lib/supabase/server";

export type FalseCaseStatus = "submitted" | "under_review" | "verified" | "rejected";

export async function updateFalseCaseStatus(
  id: string,
  status: FalseCaseStatus,
  reviewNotes?: string
) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("false_case_evidence")
    .update({
      status,
      review_notes: reviewNotes ?? null,
      reviewed_by: data.claims.sub,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
