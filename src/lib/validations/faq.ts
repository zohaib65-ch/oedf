import { z } from "zod";

import { objectIdText, shortText } from "@/lib/validations/common";

const MAX_QUESTION_LENGTH = 300;
const MAX_ANSWER_LENGTH = 5000;
const MAX_CATEGORY_LENGTH = 100;
const MAX_FAQS_IN_TOPIC = 200;

/** One question. The answer is plain text shown with `FormattedText`. */
export const faqFormSchema = z.object({
  question: shortText("Question", MAX_QUESTION_LENGTH),
  answer: shortText("Answer", MAX_ANSWER_LENGTH),
  category: shortText("Topic", MAX_CATEGORY_LENGTH),
  isPublished: z.boolean(),
});

/** The new order of every question in one topic, first to last. */
export const faqOrderSchema = z.object({
  category: shortText("Topic", MAX_CATEGORY_LENGTH),
  ids: z.array(objectIdText).min(1).max(MAX_FAQS_IN_TOPIC),
});

export type FaqFormInput = z.infer<typeof faqFormSchema>;
export type FaqOrderInput = z.infer<typeof faqOrderSchema>;
