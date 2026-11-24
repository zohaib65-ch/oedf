import { z } from "zod";

import { DOCUMENT_KINDS, GENDERS } from "@/lib/constants/enums";
import {
  cnicText,
  emailText,
  isoDateText,
  longText,
  nameText,
  phoneText,
  shortText,
  spamProtectionShape,
  uploadedFileSchema,
} from "@/lib/validations/common";

const MIN_APPLICANT_AGE_YEARS = 3;
const MAX_APPLICANT_AGE_YEARS = 100;
const MIN_PASSING_YEAR = 1950;
const MAX_FAMILY_SIZE = 40;
const MAX_INCOME_PKR = 100_000_000;

const applicantSchema = z.object({
  fullName: nameText("Full name"),
  guardianName: nameText("Father or guardian name"),
  dateOfBirth: isoDateText.refine((value) => {
    const born = new Date(`${value}T00:00:00Z`).getTime();
    const now = new Date();
    const youngest = Date.UTC(
      now.getUTCFullYear() - MIN_APPLICANT_AGE_YEARS,
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    const oldest = Date.UTC(
      now.getUTCFullYear() - MAX_APPLICANT_AGE_YEARS,
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    return born <= youngest && born >= oldest;
  }, "Enter a valid date of birth"),
  gender: z.enum(GENDERS, "Choose one"),
  cnic: cnicText,
  email: emailText,
  phone: phoneText,
  address: shortText("Address"),
  city: shortText("City"),
});

const educationSchema = z.object({
  lastInstitution: shortText("Last institution"),
  classOrDegree: shortText("Class or degree"),
  boardOrUniversity: shortText("Board or university"),
  marksOrPercentage: shortText("Marks or percentage", 50),
  passingYear: z.coerce
    .number("Enter a year")
    .int("Enter a year")
    .min(MIN_PASSING_YEAR, "Enter a valid year")
    .refine((year) => year <= new Date().getUTCFullYear() + 1, "Enter a valid year"),
});

const choiceSchema = z.object({
  programId: z
    .string()
    .regex(/^[0-9a-f]{24}$/, "Choose a program")
    .optional(),
  intakeSession: shortText("Intake session", 50),
});

const financialSchema = z.object(
  {
    monthlyIncomePkr: z.coerce
      .number("Enter the monthly income in rupees")
      .int("Enter whole rupees")
      .min(0, "Enter 0 or more")
      .max(MAX_INCOME_PKR, "Enter a realistic amount"),
    familySize: z.coerce
      .number("Enter the number of people")
      .int("Enter a whole number")
      .min(1, "Enter 1 or more")
      .max(MAX_FAMILY_SIZE, "Enter a realistic number"),
    guardianOccupation: shortText("Guardian occupation"),
    otherSupport: z.string().trim().max(500, "This is too long").default(""),
    statementOfNeed: longText("Statement of need"),
  },
  "Financial information is required",
);

const documentsShape = {
  photo: uploadedFileSchema,
  identity: uploadedFileSchema,
  resultCard: uploadedFileSchema,
};

// Both kinds share their fields. A scholarship adds the financial step and proof of income.
const sharedShape = {
  ...choiceSchema.shape,
  applicant: applicantSchema,
  education: educationSchema,
  declaration: z.literal(true, "You must confirm the declaration"),
  ...spamProtectionShape,
};

const admissionSchema = z.object({
  type: z.literal("ADMISSION"),
  ...sharedShape,
  documents: z.object(documentsShape),
});

const scholarshipSchema = z.object({
  type: z.literal("SCHOLARSHIP"),
  ...sharedShape,
  financial: financialSchema,
  documents: z.object({
    ...documentsShape,
    incomeProof: uploadedFileSchema,
  }),
});

/** Chosen by `type`, so a scholarship cannot be sent without its financial details and proof of income. */
export const applicationSchema = z.discriminatedUnion("type", [admissionSchema, scholarshipSchema]);

export type ApplicationInput = z.infer<typeof applicationSchema>;

const REFERENCE_PATTERN = /^OEDF-(ADM|SCH)-\d{4}-\d{6}$/;

export const statusLookupSchema = z.object({
  referenceNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(REFERENCE_PATTERN, "Enter a reference number like OEDF-ADM-2026-000123"),
  email: emailText,
  ...spamProtectionShape,
});

export type StatusLookupInput = z.infer<typeof statusLookupSchema>;

export const missingDocumentsSchema = statusLookupSchema.extend({
  documents: z
    .array(
      z.object({
        kind: z.enum(DOCUMENT_KINDS, "Choose the type of document"),
        file: uploadedFileSchema,
      }),
    )
    .min(1, "Upload at least one document")
    .max(6, "You can upload up to 6 documents at a time"),
});

export type MissingDocumentsInput = z.infer<typeof missingDocumentsSchema>;
