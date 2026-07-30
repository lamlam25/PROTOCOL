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
type LoginMode = "admin" | "citizen";
const CALLBACK_ERRORS = new Set([
  "provider",
  "missingToken",
  "expired",
  "session",
  "notAdmin",
]);

export function LoginForm({ mode }: { mode: LoginMode }) {
  const t = useTranslations(`auth.${mode}Login`);
  const locale = useLocale();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const fallback =
    mode === "admin"
      ? `/${locale}/admin/dashboard`
      : `/${locale}/false-cases/submit`;
  const isAllowedNext =
    mode === "admin"
      ? requestedNext?.startsWith(`/${locale}/admin`) === true
      : requestedNext?.startsWith(`/${locale}/citizen`) === true ||
        requestedNext === `/${locale}/false-cases/submit`;
  const next = isAllowedNext && requestedNext ? requestedNext : fallback;
  const requestedError = searchParams.get("error");
  const callbackError =
    requestedError && CALLBACK_ERRORS.has(requestedError)
      ? requestedError
      : null;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>(
    callbackError ? "error" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    callbackError ? t(`errors.${callbackError}`) : null
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === "citizen",
        emailRedirectTo: `${window.location.origin}/${locale}/callback?mode=${mode}&next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("rate limit")) {
        setErrorMessage(t("errors.rateLimit"));
      } else if (
        mode === "admin" &&
        message.includes("signups not allowed")
      ) {
        setErrorMessage(t("errors.notAdmin"));
      } else {
        setErrorMessage(error.message || t("errorGeneric"));
      }
      setStatus("error");
      return;
    }

    setStatus("sent");
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
          <AlertDescription>
            {errorMessage ?? t("errorGeneric")}
          </AlertDescription>
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
