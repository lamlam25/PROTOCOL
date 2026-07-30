import { LogIn } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FalseCaseForm } from "@/components/false-cases/false-case-form";

export default async function FalseCaseSubmitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "falseCases" });

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4 py-16">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t("loginRequiredTitle")}</CardTitle>
            <CardDescription>{t("loginRequiredDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              nativeButton={false}
              render={
                <Link
                  href={`/login?next=${encodeURIComponent(`/${locale}/false-cases/submit`)}`}
                />
              }
            >
              <LogIn /> {t("loginCta")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{t("submitTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("submitDescription")}</p>
      <div className="mt-8">
        <FalseCaseForm />
      </div>
    </div>
  );
}
