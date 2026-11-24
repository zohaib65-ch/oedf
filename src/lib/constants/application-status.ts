import type { APPLICATION_STATUSES } from "@/lib/constants/enums";

/**
 * What an applicant sees for each status: a short label and what happens next. Draft wording the
 * client has not reviewed yet (docs/open-questions.md, D15). Never includes personal details.
 */
export const PUBLIC_APPLICATION_STATUS = {
  SUBMITTED: {
    label: "Submitted",
    nextStep: "We have received your application. Our team will start reviewing it soon.",
  },
  UNDER_REVIEW: {
    label: "Under review",
    nextStep: "Your application is being reviewed. We will contact you if we need anything.",
  },
  INCOMPLETE: {
    label: "Documents needed",
    nextStep: "We need more from you. Upload the items listed below to continue.",
  },
  VERIFIED: {
    label: "Verified",
    nextStep: "Your details and documents are verified. Your application is moving to a decision.",
  },
  RECOMMENDED: {
    label: "Recommended",
    nextStep: "Your application has been recommended and is waiting for the final decision.",
  },
  APPROVED: {
    label: "Approved",
    nextStep: "Your application was approved. We will contact you about the next steps.",
  },
  REJECTED: {
    label: "Not successful",
    nextStep: "Your application was not successful. You can contact us for more information.",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    nextStep: "This application was withdrawn.",
  },
} satisfies Record<(typeof APPLICATION_STATUSES)[number], { label: string; nextStep: string }>;
