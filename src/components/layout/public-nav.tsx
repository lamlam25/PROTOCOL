import { Menu, Scale } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
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

export async function PublicNav() {
  const t = await getTranslations("common");

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
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <Scale className="size-5 text-primary" aria-hidden />
          <span>{t("siteName")}</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label={t("nav.about")}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden md:flex md:items-center md:gap-1">
            <LocaleSwitcher />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              {t("nav.login")}
            </Button>
          </div>

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={t("nav.about")}
                >
                  <Menu />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{t("siteName")}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label={t("nav.about")}>
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
                      href="/login"
                      className="rounded-md px-2.5 py-2 text-sm font-medium text-primary hover:bg-muted"
                    />
                  }
                >
                  {t("nav.login")}
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
