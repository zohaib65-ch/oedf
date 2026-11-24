import "server-only";

import { connectDb } from "@/server/db/connection";
import { FaqModel } from "@/server/db/models/faq.model";

export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/** Published questions in the order set in the portal (category, then position). */
export async function listPublishedFaqs(): Promise<FaqRecord[]> {
  await connectDb();
  const faqs = await FaqModel.find({ isPublished: true }, { question: 1, answer: 1, category: 1 })
    .sort({ category: 1, order: 1, _id: 1 })
    .lean();
  return faqs.map((faq) => ({
    id: faq._id.toString(),
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
  }));
}
