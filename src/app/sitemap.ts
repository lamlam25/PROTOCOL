import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
  return routing.locales.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${SITE_URL}/${locale}${path}`,
      alternates: {
        languages: {
          bn: `${SITE_URL}/bn${path}`,
          en: `${SITE_URL}/en${path}`,
        },
      },
    }))
  );
}
