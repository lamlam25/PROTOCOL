import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SUPPORTED_OTP_TYPES = new Set<EmailOtpType>(["email", "magiclink"]);
type LoginMode = "admin" | "citizen";

function loginUrl(
  request: NextRequest,
  locale: string,
  mode: LoginMode,
  error: string
) {
  const url = request.nextUrl.clone();
  url.pathname =
    mode === "admin" ? `/${locale}/login` : `/${locale}/citizen/login`;
  url.search = "";
  url.searchParams.set("error", error);
  return url;
}

function safeDestination(
  value: string | null,
  locale: string,
  mode: LoginMode
) {
  const fallback =
    mode === "admin"
      ? `/${locale}/admin/dashboard`
      : `/${locale}/false-cases/submit`;
  const isAllowed =
    mode === "admin"
      ? value?.startsWith(`/${locale}/admin`) === true
      : value?.startsWith(`/${locale}/citizen`) === true ||
        value === `/${locale}/false-cases/submit`;
  if (!value || !isAllowed) return fallback;

  try {
    const parsed = new URL(value, "http://protocol36.local");
    return parsed.origin === "http://protocol36.local"
      ? `${parsed.pathname}${parsed.search}`
      : fallback;
  } catch {
    return fallback;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const { searchParams } = request.nextUrl;
  const mode: LoginMode =
    searchParams.get("mode") === "citizen" ? "citizen" : "admin";

  if (searchParams.get("error_description")) {
    return NextResponse.redirect(loginUrl(request, locale, mode, "provider"));
  }

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeDestination(searchParams.get("next"), locale, mode);
  const supabase = await createClient();

  let authError: Error | null = null;
  if (tokenHash && type && SUPPORTED_OTP_TYPES.has(type)) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    authError = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    authError = result.error;
  } else {
    return NextResponse.redirect(
      loginUrl(request, locale, mode, "missingToken")
    );
  }

  if (authError) {
    return NextResponse.redirect(loginUrl(request, locale, mode, "expired"));
  }

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const role = (
    data?.claims.app_metadata as { role?: string } | undefined
  )?.role;

  if (claimsError || !data?.claims) {
    return NextResponse.redirect(loginUrl(request, locale, mode, "session"));
  }

  if (mode === "admin" && role !== "admin") {
    await supabase.auth.signOut();
    return NextResponse.redirect(loginUrl(request, locale, mode, "notAdmin"));
  }

  const destination = request.nextUrl.clone();
  const [pathname, query] = next.split("?");
  destination.pathname = pathname ?? `/${locale}/admin/dashboard`;
  destination.search = query ? `?${query}` : "";
  return NextResponse.redirect(destination);
}
