import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("common");

  const links = [
    { href: "/about", label: t("nav.about") },
    { href: "/timeline", label: t("nav.timeline") },
    { href: "/volunteers", label: t("nav.volunteers") },
  ] as const;

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">{t("siteName")}</p>
          <p>{t("footer.tagline")}</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1" aria-label={t("nav.about")}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p>
          © {new Date().getFullYear()} {t("siteName")} — {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
