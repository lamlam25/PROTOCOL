import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const handleI18nRouting = createIntlMiddleware(routing);
const LOCALE_PATTERN = /^\/(bn|en)(?=\/|$)/;

function isAdminPath(pathname: string) {
  const withoutLocale = pathname.replace(LOCALE_PATTERN, "");
  return withoutLocale === "/admin" || withoutLocale.startsWith("/admin/");
}

function localeFromPath(pathname: string) {
  return pathname.match(LOCALE_PATTERN)?.[1] ?? routing.defaultLocale;
}

/**
 * Composition order matters: refresh the Supabase session first (so claims
 * are current), gate /admin on the role claim, then hand off to next-intl's
 * routing. This is the FIRST of two checks — admin/layout.tsx re-verifies
 * role server-side too (defense in depth; see CLAUDE.md re: CVE-2025-29927).
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse, claims } = await updateSession(request);

  if (isAdminPath(request.nextUrl.pathname)) {
    const role = (claims?.app_metadata as { role?: string } | undefined)?.role;
    if (role !== "admin") {
      const locale = localeFromPath(request.nextUrl.pathname);
      const redirectUrl = claims
        ? new URL(`/${locale}`, request.url)
        : new URL(`/${locale}/login`, request.url);
      if (!claims) {
        redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      }
      const redirectResponse = NextResponse.redirect(redirectUrl);
      supabaseResponse.cookies
        .getAll()
        .forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }
  }

  const intlResponse = handleI18nRouting(request);
  supabaseResponse.cookies
    .getAll()
    .forEach((cookie) => intlResponse.cookies.set(cookie));
  return intlResponse;
}

export const config = {
  // Skip Next.js internals, static files, and API routes (which don't need locale routing).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
