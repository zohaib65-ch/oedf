import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { IssueDirectiveForm } from "@/features/directive-management/issue-directive-form";
import { checkPagePermission } from "@/server/auth/session";
import { getDepartments } from "@/server/services/department.service";

export const metadata: Metadata = { title: "Issue directive" };

export default async function NewDirectivePage() {
  const access = await checkPagePermission("directives:issue");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const departments = await getDepartments();

  return (
    <>
      <PageHeader
        title="Issue directive"
        description="Each chosen office's Director is emailed and asked to acknowledge it."
      />
      <Card>
        <CardContent>
          <IssueDirectiveForm
            offices={departments.map((department) => ({
              value: department.id,
              label: department.name,
            }))}
          />
        </CardContent>
      </Card>
    </>
  );
}
