import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewsForm } from "@/features/news-management/news-form";
import { checkPagePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "New post" };

export default async function NewNewsPage() {
  const access = await checkPagePermission("news:manage");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }

  return (
    <>
      <PageHeader title="New post" description="A news article or an event." />
      <Card>
        <CardContent>
          <NewsForm
            defaultValues={{
              title: "",
              type: "NEWS",
              excerpt: "",
              body: "",
              eventDate: "",
              eventStartTime: "",
              venue: "",
              status: "DRAFT",
              publishedOn: "",
              seoTitle: "",
              seoDescription: "",
              imageAlt: "",
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
