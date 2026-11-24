import { z } from "zod";

import {
  cnicText,
  emailText,
  nameText,
  phoneText,
  shortText,
  spamProtectionShape,
  uploadedFileSchema,
} from "@/lib/validations/common";

const MAX_EXPERIENCE_YEARS = 60;
const MAX_COVER_LETTER_LENGTH = 4000;

export const jobApplicationSchema = z.object({
  vacancySlug: z.string().trim().min(1).max(200),
  fullName: nameText("Full name"),
  email: emailText,
  phone: phoneText,
  cnic: cnicText,
  city: shortText("City"),
  highestQualification: shortText("Highest qualification"),
  yearsOfExperience: z.coerce
    .number()
    .int("Enter whole years")
    .min(0, "Enter 0 or more")
    .max(MAX_EXPERIENCE_YEARS, "Enter a realistic number of years"),
  coverLetter: z
    .string()
    .trim()
    .max(MAX_COVER_LETTER_LENGTH, "The cover letter is too long")
    .default(""),
  cv: uploadedFileSchema,
  ...spamProtectionShape,
});

export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
