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
    <footer className="border-t-4 border-primary bg-brand-black text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 text-sm text-white/65 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-black text-white">{t("siteName")}</p>
            <span className="h-4 w-1 bg-brand-red" aria-hidden />
          </div>
          <p>{t("footer.tagline")}</p>
        </div>
        <nav
          className="flex flex-wrap gap-x-4 gap-y-1"
          aria-label={t("nav.publicPortal")}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white"
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
