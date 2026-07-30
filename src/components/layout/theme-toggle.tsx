"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Moon, Sun, MonitorCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const t = useTranslations("common.theme");
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t("label")}>
            <Sun className="scale-100 rotate-0 dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute scale-0 rotate-90 dark:scale-100 dark:rotate-0" />
          </Button>
        }
      />
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
