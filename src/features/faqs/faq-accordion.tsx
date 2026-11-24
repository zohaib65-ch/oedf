import { cn } from "cn";

import { FormattedText } from "@/components/shared/formatted-text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqRecord } from "@/server/repositories/faq.repository";

/** A list of questions that open to show their answers. */
export function FaqAccordion({
  faqs,
  className,
}: {
  faqs: readonly FaqRecord[];
  className?: string;
}) {
  return (
    <Accordion
      type="single"
      collapsible
      className={cn("rounded-xl border border-border bg-white px-6 shadow-card", className)}
    >
      {faqs.map((faq) => (
        <AccordionItem key={faq.id} value={faq.id}>
          <AccordionTrigger className="text-left text-base font-semibold">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent>
            <FormattedText text={faq.answer} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
