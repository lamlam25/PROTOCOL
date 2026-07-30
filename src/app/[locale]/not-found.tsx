"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("common");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-foreground">{t("notFound.title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("notFound.body")}</p>
      <Button className="mt-6" nativeButton={false} render={<Link href="/" />}>
        {t("notFound.home")}
      </Button>
    </div>
  );
}
