import { Suspense } from "react";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth.adminLogin" });

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-brand-black px-4 py-16">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-brand-red" />
      <Card className="mx-auto w-full max-w-md border-white/15 bg-background shadow-2xl">
        <CardHeader>
          <span className="mb-2 grid size-10 place-items-center bg-primary text-white">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginForm mode="admin" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
