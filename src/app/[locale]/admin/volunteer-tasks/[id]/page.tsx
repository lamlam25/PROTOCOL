import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "@/components/admin/volunteer-tasks/task-form";

export default async function EditVolunteerTaskPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.volunteerTasks.form" });

  const supabase = await createClient();
  const [{ data: task }, { data: volunteers }] = await Promise.all([
    supabase.from("volunteer_tasks").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("volunteers")
      .select("id, full_name, full_name_bn")
      .order("full_name", { ascending: true }),
  ]);

  if (!task) notFound();

  const volunteerOptions = (volunteers ?? []).map((v) => ({
    id: v.id,
    label: (locale === "bn" && v.full_name_bn) || v.full_name,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("editTitle")}</h1>
      <div className="mt-6">
        <TaskForm
          taskId={task.id}
          volunteerOptions={volunteerOptions}
          initial={{
            title: task.title,
            titleBn: task.title_bn ?? "",
            description: task.description ?? "",
            descriptionBn: task.description_bn ?? "",
            taskType: task.task_type as
              | "field_verification"
              | "distribution"
              | "documentation"
              | "outreach"
              | "event_support"
              | "other",
            status: task.status as
              | "open"
              | "assigned"
              | "in_progress"
              | "completed"
              | "cancelled",
            district: task.district ?? "",
            upazila: task.upazila ?? "",
            geoLat: task.geo_lat != null ? String(task.geo_lat) : "",
            geoLng: task.geo_lng != null ? String(task.geo_lng) : "",
            assignedVolunteerId: task.assigned_volunteer_id ?? "none",
            dueDate: task.due_date ?? "",
          }}
        />
      </div>
    </div>
  );
}
