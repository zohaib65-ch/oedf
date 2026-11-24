import { CircleHelpIcon } from "lucide-react";
import { connection } from "next/server";

import { EmptyState } from "@/components/shared/empty-state";
import { JsonLd } from "@/components/shared/json-ld";
import { FaqAccordion } from "@/features/faqs/faq-accordion";
import { faqJsonLd } from "@/lib/structured-data";
import { getFaqGroups } from "@/server/services/faq.service";

export async function FaqGroups() {
  await connection();
  const groups = await getFaqGroups();
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={CircleHelpIcon}
        title="No questions yet"
        description="Frequently asked questions will appear here. In the meantime, contact us."
      />
    );
  }

  return (
    <div className="space-y-12">
      <JsonLd data={faqJsonLd(groups)} />
      {groups.map((group, index) => (
        <section key={group.category} aria-labelledby={`faq-group-${index}`}>
          <h2
            id={`faq-group-${index}`}
            className="text-2xl font-extrabold tracking-tight text-foreground"
          >
            {group.category}
          </h2>
          <FaqAccordion faqs={group.faqs} className="mt-6" />
        </section>
      ))}
    </div>
  );
}
