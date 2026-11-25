import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { InstitutionForm } from "@/features/institution-management/institution-form";
import { hasPermission } from "@/lib/constants/permissions";
import { checkPagePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "New institution" };

export default async function NewInstitutionPage() {
  const access = await checkPagePermission("institutions:write");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  return (
    <>
      <PageHeader
        title="New institution"
        description="Add agreements and reviews once it is saved."
      />
      <Card>
        <CardContent>
          <InstitutionForm
            canPublish={hasPermission(access.staff, "institutions:publish")}
            defaultValues={{
              name: "",
              city: "",
              address: "",
              description: "",
              status: "PROPOSED",
              isPublic: false,
              imageAlt: "",
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
