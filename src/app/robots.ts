import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/bn/admin/",
          "/en/admin/",
          "/bn/login",
          "/en/login",
          "/bn/callback",
          "/en/callback",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
