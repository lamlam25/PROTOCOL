"use server";

import { createClient } from "@/lib/supabase/server";

export type VolunteerStatus = "applied" | "reviewed" | "approved" | "rejected" | "inactive";

export async function updateVolunteerStatus(id: string, status: VolunteerStatus) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("volunteers")
    .update({ status, reviewed_by: data.claims.sub })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
