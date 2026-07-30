"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { MailCheck, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Status = "idle" | "submitting" | "sent" | "error";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? `/${locale}`;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <Alert>
        <MailCheck />
        <AlertTitle>{t("checkEmailTitle")}</AlertTitle>
        <AlertDescription>
          {t("checkEmailDescription", { email })}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      {status === "error" && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{t("errorGeneric")}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
