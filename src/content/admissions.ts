import { Camera, FileText, IdCard, type LucideIcon, Wallet } from "lucide-react";

/**
 * Draft copy for the Admissions and Scholarships pages. Eligibility, dates, scholarship types,
 * need criteria and renewal rules are the foundation's to supply (docs/open-questions.md, D9), so
 * they say so instead of guessing. Documents and steps follow the application form.
 */

export const TO_BE_CONFIRMED = "To be confirmed by the foundation.";

interface RequiredDocument {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const ADMISSION_DOCUMENTS: readonly RequiredDocument[] = [
  { icon: Camera, title: "Photograph", description: "A recent passport-size photograph." },
  {
    icon: IdCard,
    title: "CNIC or B-Form",
    description: "A clear copy of the applicant's CNIC or B-Form.",
  },
  { icon: FileText, title: "Result card", description: "The latest result card." },
];

export const SCHOLARSHIP_EXTRA_DOCUMENTS: readonly RequiredDocument[] = [
  {
    icon: Wallet,
    title: "Proof of income",
    description: "A document that shows the household's monthly income.",
  },
];

export const DOCUMENT_FORMAT_NOTE = "Upload PDF, JPG or PNG files of up to 5 MB each.";

export const ADMISSION_STEPS = [
  { title: "Applicant", description: "Your personal and contact details." },
  { title: "Education", description: "Your last institution and results." },
  { title: "Choice", description: "The program or institution you want." },
  { title: "Documents", description: "Upload the documents listed above." },
  { title: "Review and submit", description: "Check your answers and send the application." },
] as const;

export const SCHOLARSHIP_STEPS = [
  ...ADMISSION_STEPS.slice(0, 4),
  {
    title: "Financial information",
    description: "Household income, family size and your statement of need.",
  },
  ADMISSION_STEPS[4],
] as const;

export const SCHOLARSHIP_SECTIONS = [
  { title: "Scholarship types", description: TO_BE_CONFIRMED },
  { title: "Eligibility", description: TO_BE_CONFIRMED },
  { title: "Financial-need criteria", description: TO_BE_CONFIRMED },
  { title: "Renewal rules", description: TO_BE_CONFIRMED },
] as const;

export const ADMISSION_SECTIONS = [
  { title: "Eligibility", description: TO_BE_CONFIRMED },
  { title: "Dates", description: TO_BE_CONFIRMED },
] as const;
