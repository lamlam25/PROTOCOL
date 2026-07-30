"use server";

import { createClient } from "@/lib/supabase/server";
import { getChainAdapter } from "@/lib/chain";

export async function approveForensicCheck(id: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims) throw new Error("Unauthorized");

  const { data: check, error: fetchError } = await supabase
    .from("forensic_checks")
    .select("file_sha256, related_table, related_id")
    .eq("id", id)
    .single();
  if (fetchError || !check) throw new Error("Forensic check not found");

  const chain = getChainAdapter();
  const anchor = await chain.anchor({
    sha256Hex: check.file_sha256,
    recordType: check.related_table,
    recordId: check.related_id,
  });

  const { error } = await supabase
    .from("forensic_checks")
    .update({
      review_status: "approved",
      reviewed_by: authData.claims.sub,
      onchain_tx_hash: anchor.txHash,
      onchain_contract_address: anchor.contractAddress,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function rejectForensicCheck(id: string, notes?: string) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("forensic_checks")
    .update({
      review_status: "rejected",
      reviewed_by: authData.claims.sub,
      review_notes: notes ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
