import {
  ShieldAlert,
  HeartHandshake,
  Scale,
  UserRound,
  FileWarning,
  Users,
  MapPin,
  BookOpen,
  CalendarClock,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const name =
    (data?.claims.user_metadata as { full_name?: string } | undefined)
      ?.full_name ??
    data?.claims.email ??
    "";

  const t = await getTranslations({ locale, namespace: "admin.dashboard" });

  const links = [
    { href: "/admin/victims", Icon: HeartHandshake, label: t("links.victims") },
    { href: "/admin/cases", Icon: Scale, label: t("links.cases") },
    { href: "/admin/lawyers", Icon: UserRound, label: t("links.lawyers") },
    { href: "/admin/false-cases", Icon: FileWarning, label: t("links.falseCases") },
    { href: "/admin/forensics", Icon: ShieldAlert, label: t("forensicsQueueLink") },
    { href: "/admin/volunteers", Icon: Users, label: t("links.volunteers") },
    { href: "/admin/volunteer-tasks", Icon: MapPin, label: t("links.volunteerTasks") },
    { href: "/admin/archive", Icon: BookOpen, label: t("links.archive") },
    { href: "/admin/timeline", Icon: CalendarClock, label: t("links.timeline") },
  ] as const;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("welcome", { name })}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground hover:border-primary/40"
          >
            <Icon className="size-4 text-primary" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
