"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ inverted = true }: { inverted?: boolean }) {
  const t = useTranslations("admin.dashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        inverted &&
          "border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
      )}
      disabled={isPending}
      onClick={handleSignOut}
    >
      <LogOut /> {t("signOut")}
    </Button>
  );
}
