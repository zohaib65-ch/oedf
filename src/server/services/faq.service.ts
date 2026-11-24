import "server-only";
import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import { listPublishedFaqs, type FaqRecord } from "@/server/repositories/faq.repository";

export interface FaqGroup {
  category: string;
  faqs: FaqRecord[];
}

/** Published questions grouped by topic, in the order set in the portal. */
export async function getFaqGroups(): Promise<FaqGroup[]> {
  "use cache";
  cacheTag(CACHE_TAGS.faqs);
  cacheLife("hours");
  const groups = new Map<string, FaqRecord[]>();
  for (const faq of await listPublishedFaqs()) {
    groups.set(faq.category, [...(groups.get(faq.category) ?? []), faq]);
  }
  return [...groups].map(([category, faqs]) => ({ category, faqs }));
}
