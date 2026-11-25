import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PublicationForm } from "@/features/publication-management/publication-form";
import { hasPermission } from "@/lib/constants/permissions";
import { checkPagePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "New publication" };

export default async function NewPublicationPage() {
  const access = await checkPagePermission("publications:write");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }

  return (
    <>
      <PageHeader
        title="New publication"
        description="Saved as a draft unless a Director publishes it."
      />
      <Card>
        <CardContent>
          <PublicationForm
            canPublish={hasPermission(access.staff, "publications:publish")}
            defaultValues={{
              title: "",
              summary: "",
              authors: "",
              tags: "",
              publishedOn: "",
              status: "DRAFT",
              imageAlt: "",
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
