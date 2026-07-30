import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { LawyerForm } from "@/components/admin/lawyers/lawyer-form";

export default async function EditLawyerPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "admin.lawyers.form" });

  const supabase = await createClient();
  const { data: lawyer } = await supabase
    .from("lawyers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!lawyer) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{t("editTitle")}</h1>
      <div className="mt-6">
        <LawyerForm
          lawyerId={lawyer.id}
          initial={{
            fullName: lawyer.full_name,
            fullNameBn: lawyer.full_name_bn ?? "",
            barRegistrationNo: lawyer.bar_registration_no ?? "",
            specialization: lawyer.specialization ?? [],
            contactEmail: lawyer.contact_email ?? "",
            contactPhone: lawyer.contact_phone ?? "",
            isActive: lawyer.is_active,
          }}
        />
      </div>
    </div>
  );
}
