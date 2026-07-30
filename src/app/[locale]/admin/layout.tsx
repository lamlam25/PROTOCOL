import { ShieldCheck } from "lucide-react";
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
      <header className="border-b border-white/10 bg-brand-black text-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
          <span className="grid size-8 place-items-center bg-primary">
            <ShieldCheck className="size-4 text-white" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{t("siteName")}</p>
            <p className="truncate text-xs text-white/60">
              {t("nav.adminPanel")}
            </p>
          </div>
          <span className="h-7 w-1 bg-brand-red" aria-hidden />
          <div className="ml-auto flex items-center gap-1">
            <LocaleSwitcher inverted />
            <ThemeToggle inverted />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
