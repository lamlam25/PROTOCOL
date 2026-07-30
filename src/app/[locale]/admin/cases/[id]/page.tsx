import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CaseForm, type OptionItem } from "@/components/admin/cases/case-form";
import { CaseUpdatesManager } from "@/components/admin/cases/case-updates-manager";
import type { CaseInput } from "@/app/[locale]/admin/cases/actions";

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.cases" });

  const supabase = await createClient();
  const [{ data: caseRow }, { data: victims }, { data: lawyers }, { data: updates }] =
    await Promise.all([
      supabase.from("cases").select("*").eq("id", id).maybeSingle(),
      supabase.from("victims").select("id, full_name, full_name_bn").order("full_name"),
      supabase
        .from("lawyers")
        .select("id, full_name, full_name_bn")
        .eq("is_active", true)
        .order("full_name"),
      supabase
        .from("case_updates")
        .select("*")
        .eq("case_id", id)
        .order("update_date", { ascending: true }),
    ]);

  if (!caseRow) notFound();

  const victimOptions: OptionItem[] = (victims ?? []).map((v) => ({
    id: v.id,
    label: (locale === "bn" && v.full_name_bn) || v.full_name,
  }));
  const lawyerOptions: OptionItem[] = (lawyers ?? []).map((l) => ({
    id: l.id,
    label: (locale === "bn" && l.full_name_bn) || l.full_name,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">
        {t("form.editTitle")}
      </h1>
      <div className="mt-6">
        <CaseForm
          caseId={caseRow.id}
          victimOptions={victimOptions}
          lawyerOptions={lawyerOptions}
          initial={{
            caseNumber: caseRow.case_number ?? "",
            title: caseRow.title,
            titleBn: caseRow.title_bn ?? "",
            description: caseRow.description ?? "",
            descriptionBn: caseRow.description_bn ?? "",
            caseType: caseRow.case_type as CaseInput["caseType"],
            status: caseRow.status as CaseInput["status"],
            victimId: caseRow.victim_id ?? "none",
            assignedLawyerId: caseRow.assigned_lawyer_id ?? "none",
            courtName: caseRow.court_name ?? "",
            filedDate: caseRow.filed_date ?? "",
            isPublished: caseRow.is_published,
          }}
        />
      </div>

      <div className="mt-10 max-w-2xl border-t border-border pt-6">
        <h2 className="text-lg font-semibold text-foreground">{t("updates.title")}</h2>
        <div className="mt-4">
          <CaseUpdatesManager caseId={caseRow.id} locale={locale} updates={updates ?? []} />
        </div>
      </div>
    </div>
  );
}
