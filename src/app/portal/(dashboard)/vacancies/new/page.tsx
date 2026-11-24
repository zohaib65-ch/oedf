import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { VacancyForm } from "@/features/vacancies/vacancy-form";
import { checkPagePermission } from "@/server/auth/session";
import { getDepartments } from "@/server/services/department.service";

export const metadata: Metadata = { title: "New vacancy" };

// Most vacancies belong to Human Resources & Teacher Management, so it is the starting choice.
const DEFAULT_OFFICE_CODE = "HR_TEACHER_MANAGEMENT";

export default async function NewVacancyPage() {
  const access = await checkPagePermission("vacancies:write");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const offices = await getDepartments();
  const defaultOffice = offices.find((office) => office.code === DEFAULT_OFFICE_CODE);

  return (
    <>
      <PageHeader
        title="New vacancy"
        description="Saved as a draft. It reaches the careers page only when a Director publishes it."
      />
      <Card>
        <CardContent>
          <VacancyForm
            offices={offices.map((office) => ({ value: office.id, label: office.name }))}
            defaultValues={{
              title: "",
              departmentId: defaultOffice?.id ?? "",
              city: "",
              description: "",
              requirements: "",
              deadline: "",
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
