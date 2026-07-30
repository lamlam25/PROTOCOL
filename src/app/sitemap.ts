import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getSiteUrl } from "@/lib/site-url";

const PUBLIC_PATHS = [
  "",
  "/victims",
  "/cases",
  "/false-cases",
  "/budget",
  "/volunteers",
  "/stories",
  "/timeline",
  "/about",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return routing.locales.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      alternates: {
        languages: {
          bn: `${siteUrl}/bn${path}`,
          en: `${siteUrl}/en${path}`,
        },
      },
    }))
  );
}
