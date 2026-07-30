/**
 * Creates or promotes a Supabase Auth user to the admin role.
 * Set ADMIN_INITIAL_PASSWORD in the current shell to create a usable
 * password-authenticated account or deliberately reset an existing password.
 *
 * Usage: npm run seed:admin -- someone@example.com
 */
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (!email) {
    console.error("Usage: npm run seed:admin -- <email>");
    process.exit(1);
  }
  if (
    initialPassword &&
    (initialPassword.length < 10 ||
      initialPassword.length > 72 ||
      !/[a-z]/.test(initialPassword) ||
      !/[A-Z]/.test(initialPassword) ||
      !/[0-9]/.test(initialPassword))
  ) {
    console.error(
      "ADMIN_INITIAL_PASSWORD must be 10-72 characters and include lowercase, uppercase, and a digit."
    );
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
    if (!initialPassword) {
      console.error(
        "A new admin needs a password. Set ADMIN_INITIAL_PASSWORD in the current shell and run the command again."
      );
      process.exit(1);
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: initialPassword,
      email_confirm: true,
      app_metadata: { role: "admin" },
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
      ...(initialPassword ? { password: initialPassword } : {}),
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
    initialPassword
      ? "The password was set. Sign in through /login; existing sessions must sign out first."
      : "The existing password was kept. Sign in through /login; existing sessions must sign out first."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
