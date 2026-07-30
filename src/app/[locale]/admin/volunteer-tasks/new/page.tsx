import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "@/components/admin/volunteer-tasks/task-form";

export default async function NewVolunteerTaskPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.volunteerTasks.form" });

  const supabase = await createClient();
  const { data: volunteers } = await supabase
    .from("volunteers")
    .select("id, full_name, full_name_bn")
    .order("full_name", { ascending: true });

  const volunteerOptions = (volunteers ?? []).map((v) => ({
    id: v.id,
    label: (locale === "bn" && v.full_name_bn) || v.full_name,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("createTitle")}</h1>
      <div className="mt-6">
        <TaskForm volunteerOptions={volunteerOptions} />
      </div>
    </div>
  );
}
