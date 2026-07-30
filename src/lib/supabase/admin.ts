import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role client — bypasses RLS entirely. Only ever import this from
 * server-only code (Route Handlers, Server Actions): the `server-only`
 * import above makes any accidental client-side bundling fail the build.
 * Never expose SUPABASE_SERVICE_ROLE_KEY as NEXT_PUBLIC_*.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
