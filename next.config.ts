import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public cache (victim photos / archive thumbnails).
      // Hostname pattern is finalized once a project is linked in Phase 2.
    ],
  },
};

export default withNextIntl(nextConfig);
