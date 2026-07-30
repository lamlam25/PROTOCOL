import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database.types";

/**
 * Refreshes the Supabase session on every request and returns the decoded
 * JWT claims (role included, via the custom_access_token_hook) so proxy.ts
 * can gate /admin without a DB round trip. Must run before next-intl's
 * routing middleware — see proxy.ts for composition order.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Must be called to keep the session alive — also what actually performs
  // the token refresh that setAll() above writes back to cookies.
  const { data, error } = await supabase.auth.getClaims();

  return { supabaseResponse, claims: error ? null : (data?.claims ?? null) };
}
