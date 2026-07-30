"use client";

import dynamic from "next/dynamic";
import type { DispatchMapMarker } from "@/components/admin/volunteer-tasks/task-dispatch-map";

const TaskDispatchMap = dynamic(
  () => import("@/components/admin/volunteer-tasks/task-dispatch-map"),
  { ssr: false, loading: () => <div className="h-[420px] w-full rounded-lg bg-muted" /> }
);

export function TaskDispatchMapSection({
  markers,
  detailsLabel,
}: {
  markers: DispatchMapMarker[];
  detailsLabel: string;
}) {
  return <TaskDispatchMap markers={markers} detailsLabel={detailsLabel} />;
}
