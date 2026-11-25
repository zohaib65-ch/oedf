import { CircleHelpIcon } from "lucide-react";
import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaqDialog } from "@/features/faq-management/faq-dialog";
import { FaqTopicList } from "@/features/faq-management/faq-topic-list";
import { hasPermission } from "@/lib/constants/permissions";
import { checkPagePermission } from "@/server/auth/session";
import { getFaqsForStaff } from "@/server/services/faq-management.service";

export const metadata: Metadata = { title: "FAQs" };

export default async function FaqsPage() {
  const access = await checkPagePermission("faqs:manage");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const faqs = await getFaqsForStaff();
  const topics = [...new Set(faqs.map((faq) => faq.category))];

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Questions on the public FAQs page, grouped by topic in the order shown here."
        actions={<FaqDialog topics={topics} />}
      />
      {topics.length === 0 ? (
        <EmptyState
          icon={CircleHelpIcon}
          title="No questions yet"
          description="Add the first question; its topic becomes a group on the FAQs page."
        />
      ) : (
        topics.map((topic) => (
          <Card key={topic}>
            <CardHeader>
              <CardTitle>
                <h2>{topic}</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FaqTopicList
                category={topic}
                faqs={faqs.filter((faq) => faq.category === topic)}
                topics={topics}
                canDelete={hasPermission(access.staff, "content:delete")}
              />
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
}
