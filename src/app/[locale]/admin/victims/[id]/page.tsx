import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VictimForm } from "@/components/admin/victims/victim-form";
import type { VictimInput } from "@/app/[locale]/admin/victims/actions";

export default async function EditVictimPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.victims.form" });

  const supabase = await createClient();
  const { data: victim } = await supabase
    .from("victims")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!victim) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("editTitle")}</h1>
      <div className="mt-6">
        <VictimForm
          victimId={victim.id}
          initial={{
            fullName: victim.full_name,
            fullNameBn: victim.full_name_bn ?? "",
            status: victim.status as VictimInput["status"],
            age: victim.age?.toString() ?? "",
            gender: victim.gender ?? "",
            district: victim.district ?? "",
            upazila: victim.upazila ?? "",
            incidentDate: victim.incident_date ?? "",
            incidentLocation: victim.incident_location ?? "",
            incidentLocationBn: victim.incident_location_bn ?? "",
            storySummary: victim.story_summary ?? "",
            storySummaryBn: victim.story_summary_bn ?? "",
            isPublished: victim.is_published,
            verificationStatus:
              victim.verification_status as VictimInput["verificationStatus"],
          }}
        />
      </div>
    </div>
  );
}
