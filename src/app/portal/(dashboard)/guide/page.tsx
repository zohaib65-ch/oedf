import type { Metadata } from "next";

import { PageHeader } from "@/components/portal/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { STAFF_GUIDE } from "@/content/staff-guide";
import { hasPermission } from "@/lib/constants/permissions";
import { requireSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Staff guide" };

/** How to use the portal, showing only the parts this person's role and office use. */
export default async function StaffGuidePage() {
  const staff = await requireSession();
  const sections = STAFF_GUIDE.filter(
    (section) => !section.permission || hasPermission(staff, section.permission),
  );

  return (
    <>
      <PageHeader
        title="Staff guide"
        description="How to use the portal. You see the parts that apply to your role and office."
      />
      <Card>
        <CardContent>
          <Accordion type="multiple" defaultValue={[sections[0]?.id ?? ""]}>
            {sections.map((section) => (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="text-base font-semibold">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>{section.intro}</p>
                  <ul className="list-disc space-y-2 pl-5">
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
