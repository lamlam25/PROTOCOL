import { Scale } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * Defense in depth: proxy.ts already gates /admin on the role claim, but a
 * middleware/proxy bug (Next had a real one — CVE-2025-29927) must not be
 * the only thing standing between a citizen and this layout. Re-verify here.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const role = (data?.claims.app_metadata as { role?: string } | undefined)
    ?.role;

  if (error || role !== "admin") {
    redirect({
      href: data?.claims ? "/" : "/login",
      locale: locale as (typeof routing.locales)[number],
    });
  }

  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Scale className="size-5 text-primary" aria-hidden />
          <span className="font-semibold text-foreground">
            {t("nav.adminPanel")}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
