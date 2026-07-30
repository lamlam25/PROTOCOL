import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default async function AdminIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({
    href: "/admin/dashboard",
    locale: locale as (typeof routing.locales)[number],
  });
}
