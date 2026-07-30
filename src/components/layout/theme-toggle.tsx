"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Moon, Sun, MonitorCog } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeToggle({ inverted = false }: { inverted?: boolean }) {
  const t = useTranslations("common.theme");
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("label")}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          inverted && "text-white hover:bg-white/10 hover:text-white"
        )}
      >
        <Sun className="scale-100 rotate-0 dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute scale-0 rotate-90 dark:scale-100 dark:rotate-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          data-active={theme === "light"}
          className="data-[active=true]:font-semibold"
          onClick={() => setTheme("light")}
        >
          <Sun /> {t("light")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-active={theme === "dark"}
          className="data-[active=true]:font-semibold"
          onClick={() => setTheme("dark")}
        >
          <Moon /> {t("dark")}
        </DropdownMenuItem>
        <DropdownMenuItem
          data-active={theme === "system"}
          className="data-[active=true]:font-semibold"
          onClick={() => setTheme("system")}
        >
          <MonitorCog /> {t("system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
