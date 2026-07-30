"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold text-foreground">
        {t("error.title")}
      </h1>
      <p className="mt-2 text-muted-foreground">{t("error.body")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>{t("error.retry")}</Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          {t("error.home")}
        </Button>
      </div>
    </div>
  );
}
