import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const NAMESPACES = [
  "common",
  "home",
  "auth",
  "admin",
  "victims",
  "cases",
  "timeline",
  "archive",
  "budget",
  "falseCases",
  "forensics",
  "volunteers",
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = Object.fromEntries(
    await Promise.all(
      NAMESPACES.map(async (namespace) => [
        namespace,
        (await import(`../../messages/${locale}/${namespace}.json`)).default,
      ])
    )
  );

  return { locale, messages };
});
