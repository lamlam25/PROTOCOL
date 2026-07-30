"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { KeyRound, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Status = "idle" | "submitting" | "error";
type LoginMode = "admin" | "citizen";
type CitizenAction = "signin" | "signup";
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
  const [password, setPassword] = useState("");
  const [citizenAction, setCitizenAction] =
    useState<CitizenAction>("signin");
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
    if (mode === "citizen" && citizenAction === "signup") {
      const response = await fetch("/api/auth/citizen-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        setErrorMessage(
          response.status === 409
            ? t("errors.accountExists")
            : response.status === 429
              ? t("errors.registrationLimit")
              : t("errors.registration")
        );
        setStatus("error");
        return;
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (
        message.includes("invalid login") ||
        message.includes("invalid credentials")
      ) {
        setErrorMessage(t("errors.invalidCredentials"));
      } else {
        setErrorMessage(error.message || t("errorGeneric"));
      }
      setStatus("error");
      return;
    }

    if (mode === "admin") {
      const { data } = await supabase.auth.getClaims();
      const role = (
        data?.claims?.app_metadata as { role?: string } | undefined
      )?.role;
      if (role !== "admin") {
        await supabase.auth.signOut();
        setErrorMessage(t("errors.notAdmin"));
        setStatus("error");
        return;
      }
    }

    window.location.assign(next);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "citizen" && (
        <div className="grid grid-cols-2 rounded-md bg-muted p-1">
          {(["signin", "signup"] as const).map((action) => (
            <button
              key={action}
              type="button"
              aria-pressed={citizenAction === action}
              onClick={() => {
                setCitizenAction(action);
                setStatus("idle");
                setErrorMessage(null);
              }}
              className={`min-h-9 rounded-sm px-3 text-sm font-medium transition-colors ${
                citizenAction === action
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`actions.${action}`)}
            </button>
          ))}
        </div>
      )}

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
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("passwordLabel")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete={
            mode === "citizen" && citizenAction === "signup"
              ? "new-password"
              : "current-password"
          }
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {mode === "citizen" && citizenAction === "signup" && (
          <p className="text-xs text-muted-foreground">
            {t("passwordRequirements")}
          </p>
        )}
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
        <KeyRound />
        {status === "submitting"
          ? t("submitting")
          : mode === "citizen" && citizenAction === "signup"
            ? t("createAccount")
            : t("submit")}
      </Button>
    </form>
  );
}
