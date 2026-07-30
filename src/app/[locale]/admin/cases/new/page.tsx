import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CaseForm, type OptionItem } from "@/components/admin/cases/case-form";

export default async function NewCasePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.cases.form" });

  const supabase = await createClient();
  const [{ data: victims }, { data: lawyers }] = await Promise.all([
    supabase.from("victims").select("id, full_name, full_name_bn").order("full_name"),
    supabase
      .from("lawyers")
      .select("id, full_name, full_name_bn")
      .eq("is_active", true)
      .order("full_name"),
  ]);

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
      <h1 className="text-2xl font-semibold text-foreground">{t("createTitle")}</h1>
      <div className="mt-6">
        <CaseForm victimOptions={victimOptions} lawyerOptions={lawyerOptions} />
      </div>
    </div>
  );
}
