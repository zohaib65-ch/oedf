import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ProgramForm } from "@/features/program-management/program-form";
import { hasPermission } from "@/lib/constants/permissions";
import { checkPagePermission } from "@/server/auth/session";
import { getInstitutionChoices } from "@/server/services/program-management.service";

export const metadata: Metadata = { title: "New program" };

export default async function NewProgramPage() {
  const access = await checkPagePermission("programs:write");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const institutions = await getInstitutionChoices();

  return (
    <>
      <PageHeader
        title="New program"
        description="Saved as a draft unless a Director publishes it."
      />
      <Card>
        <CardContent>
          <ProgramForm
            canPublish={hasPermission(access.staff, "programs:publish")}
            institutions={institutions.map((institution) => ({
              value: institution.id,
              label: `${institution.name} (${institution.city})`,
            }))}
            defaultValues={{
              title: "",
              summary: "",
              description: "",
              duration: "",
              eligibility: "",
              institutionIds: [],
              acceptsApplications: false,
              status: "DRAFT",
              imageAlt: "",
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
