import { Menu, ShieldCheck, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function PublicNav() {
  const t = await getTranslations("common");
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(auth?.claims?.sub);

  const navItems = [
    { href: "/victims", label: t("nav.victims") },
    { href: "/cases", label: t("nav.cases") },
    { href: "/false-cases", label: t("nav.falseCases") },
    { href: "/budget", label: t("nav.budget") },
    { href: "/volunteers", label: t("nav.volunteers") },
    { href: "/stories", label: t("nav.stories") },
    { href: "/timeline", label: t("nav.timeline") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-black text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-white"
        >
          <span className="grid size-8 place-items-center bg-primary">
            <ShieldCheck className="size-4 text-white" aria-hidden />
          </span>
          <span className="text-sm font-black">{t("siteName")}</span>
          <span className="h-5 w-1 bg-brand-red" aria-hidden />
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
          aria-label={t("nav.publicPortal")}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden items-center gap-1 lg:flex">
            <LocaleSwitcher inverted />
            <ThemeToggle inverted />
            <Button
              variant="secondary"
              size="sm"
              nativeButton={false}
              render={<Link href={isSignedIn ? "/citizen" : "/citizen/login"} />}
              className="border border-white/20 bg-white text-black hover:bg-white/90"
            >
              <UserRound />
              {isSignedIn ? t("nav.citizenPortal") : t("nav.citizenLogin")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/login" />}
              className="text-white/70 hover:bg-white/10 hover:text-white"
            >
              <ShieldCheck />
              {t("nav.adminAccess")}
            </Button>
          </div>

          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "text-white hover:bg-white/10 hover:text-white lg:hidden"
              )}
              aria-label={t("nav.openMenu")}
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{t("siteName")}</SheetTitle>
              </SheetHeader>
              <nav
                className="flex flex-col gap-1 px-4"
                aria-label={t("nav.publicPortal")}
              >
                {navItems.map((item) => (
                  <SheetClose
                    key={item.href}
                    nativeButton={false}
                    render={
                      <Link
                        href={item.href}
                        className="rounded-md px-2.5 py-2 text-sm text-foreground hover:bg-muted"
                      />
                    }
                  >
                    {item.label}
                  </SheetClose>
                ))}
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href={isSignedIn ? "/citizen" : "/citizen/login"}
                      className="rounded-md px-2.5 py-2 text-sm font-medium text-primary hover:bg-muted"
                    />
                  }
                >
                  {isSignedIn ? t("nav.citizenPortal") : t("nav.citizenLogin")}
                </SheetClose>
                <SheetClose
                  nativeButton={false}
                  render={
                    <Link
                      href="/login"
                      className="rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                    />
                  }
                >
                  {t("nav.adminAccess")}
                </SheetClose>
              </nav>
              <div className="mt-2 flex items-center gap-1 border-t border-border px-4 pt-4">
                <LocaleSwitcher />
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
