import type { Metadata } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import { PublicNav } from "@/components/layout/public-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
});

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "common" });
  const localeCode = locale === "bn" ? "bn_BD" : "en_US";
  return {
    metadataBase: new URL(SITE_URL),
    title: t("siteName"),
    description: t("siteDescription"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        bn: "/bn",
        en: "/en",
      },
    },
    openGraph: {
      type: "website",
      locale: localeCode,
      url: `/${locale}`,
      title: t("siteName"),
      description: t("siteDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("siteName"),
      description: t("siteDescription"),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${notoSansBengali.variable}`}
    >
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <PublicNav />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
