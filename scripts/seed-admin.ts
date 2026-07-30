/**
 * Creates or promotes a Supabase Auth user to the admin role.
 * New accounts are confirmed without a password; the administrator still
 * signs in through the normal one-time email link.
 *
 * Usage: npm run seed:admin -- someone@example.com
 */
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
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
  let user: User | undefined;
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

  let created = false;
  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
    created = true;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, role: "admin" }, { onConflict: "id" });

  if (profileError) throw profileError;

  const { error: claimsError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      app_metadata: {
        ...user.app_metadata,
        role: "admin",
      },
    }
  );
  if (claimsError) throw claimsError;

  console.log(
    `${email} (${user.id}) ${created ? "was created and approved" : "is now approved"} as an admin.`
  );
  console.log(
    "Request a fresh link from /login. Existing sessions must sign out first."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
