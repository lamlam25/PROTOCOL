import { Plus } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskDispatchMapSection } from "@/components/admin/volunteer-tasks/task-dispatch-map-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminVolunteerTasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.volunteerTasks" });

  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("volunteer_tasks")
    .select(
      "*, assigned_volunteer:volunteers!volunteer_tasks_assigned_volunteer_id_fkey(full_name, full_name_bn)"
    )
    .order("created_at", { ascending: false });

  const markers = (tasks ?? [])
    .filter((task) => task.geo_lat != null && task.geo_lng != null)
    .map((task) => ({
      id: task.id,
      lat: Number(task.geo_lat),
      lng: Number(task.geo_lng),
      title: (locale === "bn" && task.title_bn) || task.title,
      statusLabel: t(`status.${task.status}`),
      href: `/${locale}/admin/volunteer-tasks/${task.id}`,
    }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/volunteer-tasks/new" />}>
          <Plus /> {t("newButton")}
        </Button>
      </div>

      <div className="mt-6">
        <TaskDispatchMapSection markers={markers} detailsLabel={t("table.actions")} />
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.task")}</TableHead>
                <TableHead>{t("table.type")}</TableHead>
                <TableHead>{t("table.district")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.assigned")}</TableHead>
                <TableHead className="sr-only">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="text-foreground">
                    {(locale === "bn" && task.title_bn) || task.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t(`taskType.${task.task_type}`)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {task.district || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={task.status === "cancelled" ? "destructive" : "outline"}>
                      {t(`status.${task.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(locale === "bn" && task.assigned_volunteer?.full_name_bn) ||
                      task.assigned_volunteer?.full_name ||
                      t("noneOption")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/volunteer-tasks/${task.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t("table.actions")}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="mt-6 text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
