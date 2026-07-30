/**
 * Promotes an existing Supabase Auth user to the admin role.
 * The user must have already signed in at least once via /login (magic
 * link) so their profiles row exists — this script only flips the role.
 *
 * Usage: npm run seed:admin -- someone@example.com
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run seed:admin -- <email>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment."
    );
    process.exit(1);
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // GoTrue's admin API has no getUserByEmail; list and match. Fine at this scale.
  let user: { id: string; email?: string } | undefined;
  let page = 1;
  while (!user) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    user = data.users.find((u) => u.email === email);
    if (user || data.users.length < 200) break;
    page += 1;
  }

  if (!user) {
    console.error(
      `No auth user found for ${email} — they must sign in at /login at least once first.`
    );
    process.exit(1);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id);

  if (updateError) throw updateError;

  console.log(`${email} (${user.id}) is now an admin.`);
  console.log(
    "They'll need to sign out and back in (or wait for their token to refresh) for the new role claim to take effect."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
