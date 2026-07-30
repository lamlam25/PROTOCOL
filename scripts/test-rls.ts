/**
 * Exercises RLS policies against the LIVE linked Supabase project using an
 * anon client (no session) vs. the service-role client. Creates and cleans
 * up its own temporary rows — safe to run repeatedly.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient<Database>(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let failures = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}`, detail ?? "");
  }
}

async function main() {
  console.log("Seeding temporary fixtures via service role...");
  const { data: published, error: e1 } = await admin
    .from("victims")
    .insert({
      full_name: "[test] published victim",
      status: "injured",
      is_published: true,
      verification_status: "verified",
    })
    .select("id")
    .single();
  if (e1 || !published) throw e1 ?? new Error("insert failed");

  const { data: unpublished, error: e2 } = await admin
    .from("victims")
    .insert({
      full_name: "[test] unpublished victim",
      status: "injured",
      is_published: false,
    })
    .select("id")
    .single();
  if (e2 || !unpublished) throw e2 ?? new Error("insert failed");

  const { data: allocation, error: e3 } = await admin
    .from("budget_allocations")
    .insert({
      title: "[test] allocation",
      category: "medical",
      allocated_amount: 1000,
    })
    .select("id")
    .single();
  if (e3 || !allocation) throw e3 ?? new Error("insert failed");

  try {
    console.log("\nvictims:");
    const { data: victimRows } = await anon
      .from("victims")
      .select("id")
      .in("id", [published.id, unpublished.id]);
    const ids = victimRows?.map((r) => r.id) ?? [];
    check("anon sees the published+verified victim", ids.includes(published.id));
    check("anon does NOT see the unpublished victim", !ids.includes(unpublished.id));

    const { error: insertErr } = await anon.from("victims").insert({
      full_name: "[test] anon injected victim",
      status: "injured",
    });
    check("anon cannot INSERT a victim", insertErr !== null, insertErr);

    console.log("\nprofiles:");
    const { data: profileRows, error: profileErr } = await anon
      .from("profiles")
      .select("id");
    check(
      "anon (no session) reads zero profile rows",
      !profileErr && (profileRows?.length ?? -1) === 0,
      { profileErr, profileRows }
    );

    console.log("\nfalse_case_evidence:");
    const { error: fceErr } = await anon.from("false_case_evidence").insert({
      submitted_by: published.id, // arbitrary uuid; RLS should reject before FK is even relevant
      accused_full_name: "[test]",
    });
    check("anon cannot INSERT false_case_evidence", fceErr !== null, fceErr);

    console.log("\nbudget_allocations (public transparency):");
    const { data: allocRows, error: allocErr } = await anon
      .from("budget_allocations")
      .select("id")
      .eq("id", allocation.id);
    check(
      "anon CAN read budget_allocations",
      !allocErr && allocRows?.length === 1,
      allocErr
    );
    const { error: allocInsertErr } = await anon
      .from("budget_allocations")
      .insert({ title: "[test]", category: "medical", allocated_amount: 1 });
    check("anon cannot INSERT budget_allocations", allocInsertErr !== null);
  } finally {
    console.log("\nCleaning up fixtures...");
    await admin
      .from("victims")
      .delete()
      .in("id", [published.id, unpublished.id]);
    await admin.from("budget_allocations").delete().eq("id", allocation.id);
  }

  console.log(
    failures === 0
      ? "\nAll RLS checks passed."
      : `\n${failures} RLS check(s) FAILED.`
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
