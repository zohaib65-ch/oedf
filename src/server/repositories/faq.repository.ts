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

export interface StaffFaqRecord extends FaqRecord {
  order: number;
  isPublished: boolean;
  updatedAt: string;
}

/** Every question, published or not, by topic and position. */
export async function listFaqsForStaff(): Promise<StaffFaqRecord[]> {
  await connectDb();
  const faqs = await FaqModel.find({}).sort({ category: 1, order: 1, _id: 1 }).lean();
  return faqs.map((faq) => ({
    id: faq._id.toString(),
    question: faq.question,
    answer: faq.answer,
    category: faq.category,
    order: faq.order,
    isPublished: faq.isPublished,
    updatedAt: faq.updatedAt.toISOString(),
  }));
}

export async function findFaqForStaff(id: string): Promise<StaffFaqRecord | null> {
  await connectDb();
  const faq = await FaqModel.findById(id).lean();
  return faq
    ? {
        id: faq._id.toString(),
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order: faq.order,
        isPublished: faq.isPublished,
        updatedAt: faq.updatedAt.toISOString(),
      }
    : null;
}

/** The position after the last question in a topic. */
async function nextOrder(category: string): Promise<number> {
  const last = await FaqModel.findOne({ category }, { order: 1 }).sort({ order: -1 }).lean();
  return last ? last.order + 1 : 0;
}

export interface FaqFields {
  question: string;
  answer: string;
  category: string;
  isPublished: boolean;
}

/** Saves a new question at the end of its topic and returns its ID. */
export async function createFaq(fields: FaqFields): Promise<string> {
  await connectDb();
  const [created] = await FaqModel.insertMany([
    { ...fields, order: await nextOrder(fields.category) },
  ]);
  if (!created) {
    throw new Error("The question was not created.");
  }
  return created._id.toString();
}

/** Saves the fields; a question moved to another topic goes to its end. Returns false when gone. */
export async function updateFaq(
  id: string,
  fields: FaqFields,
  movesTopic: boolean,
): Promise<boolean> {
  await connectDb();
  const result = await FaqModel.updateOne(
    { _id: id },
    { $set: { ...fields, ...(movesTopic ? { order: await nextOrder(fields.category) } : {}) } },
  );
  return result.matchedCount === 1;
}

export async function deleteFaq(id: string): Promise<boolean> {
  await connectDb();
  const result = await FaqModel.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

/** The IDs of every question in a topic. */
export async function listFaqIdsInCategory(category: string): Promise<string[]> {
  await connectDb();
  const faqs = await FaqModel.find({ category }, { _id: 1 }).lean();
  return faqs.map((faq) => faq._id.toString());
}

/** Numbers the topic's questions in the given order. */
export async function saveFaqOrder(category: string, ids: readonly string[]): Promise<void> {
  await connectDb();
  await FaqModel.bulkWrite(
    ids.map((id, order) => ({
      updateOne: { filter: { _id: id, category }, update: { $set: { order } } },
    })),
  );
}
