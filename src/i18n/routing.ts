import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["bn", "en"],
  defaultLocale: "bn",
  localePrefix: "always",
  // Bangla is the platform's default audience — don't let browser
  // Accept-Language steer first-time visitors to English. The locale
  // switcher (and the `NEXT_LOCALE` cookie it sets) still works.
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
