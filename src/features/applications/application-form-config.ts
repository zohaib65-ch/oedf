import type { Path, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import type { ApplicationInput, applicationSchema } from "@/lib/validations/application";

export type ApplicationFormValues = z.input<typeof applicationSchema>;
export type ApplicationFormApi = UseFormReturn<ApplicationFormValues, unknown, ApplicationInput>;
type FieldPath = Path<ApplicationFormValues>;

export type StepId = "applicant" | "education" | "choice" | "documents" | "financial" | "review";

export interface FormStep {
  id: StepId;
  title: string;
  /** The fields checked before moving on from this step. */
  fields: FieldPath[];
}

const APPLICANT_FIELDS: FieldPath[] = [
  "applicant.fullName",
  "applicant.guardianName",
  "applicant.dateOfBirth",
  "applicant.gender",
  "applicant.cnic",
  "applicant.email",
  "applicant.phone",
  "applicant.address",
  "applicant.city",
];

const EDUCATION_FIELDS: FieldPath[] = [
  "education.lastInstitution",
  "education.classOrDegree",
  "education.boardOrUniversity",
  "education.marksOrPercentage",
  "education.passingYear",
];

const FINANCIAL_FIELDS: FieldPath[] = [
  "financial.monthlyIncomePkr",
  "financial.familySize",
  "financial.guardianOccupation",
  "financial.otherSupport",
  "financial.statementOfNeed",
  "documents.incomeProof",
];

/** The steps in order. A scholarship adds the financial step before the review. */
export function getSteps(type: "ADMISSION" | "SCHOLARSHIP"): FormStep[] {
  return [
    { id: "applicant", title: "Applicant", fields: APPLICANT_FIELDS },
    { id: "education", title: "Education", fields: EDUCATION_FIELDS },
    { id: "choice", title: "Choice", fields: ["programId", "intakeSession"] },
    {
      id: "documents",
      title: "Documents",
      fields: ["documents.photo", "documents.identity", "documents.resultCard"],
    },
    ...(type === "SCHOLARSHIP"
      ? [{ id: "financial" as const, title: "Financial information", fields: FINANCIAL_FIELDS }]
      : []),
    { id: "review", title: "Review and submit", fields: ["declaration"] },
  ];
}

/** Each field's question, so the error summary can say which field a message is about. */
export const FIELD_LABELS: Record<string, string> = {
  "applicant.fullName": "Full name",
  "applicant.guardianName": "Father or guardian name",
  "applicant.dateOfBirth": "Date of birth",
  "applicant.gender": "Gender",
  "applicant.cnic": "CNIC or B-Form number",
  "applicant.email": "Email",
  "applicant.phone": "Phone",
  "applicant.address": "Address",
  "applicant.city": "City",
  "education.lastInstitution": "Last institution",
  "education.classOrDegree": "Class or degree",
  "education.boardOrUniversity": "Board or university",
  "education.marksOrPercentage": "Marks or percentage",
  "education.passingYear": "Passing year",
  programId: "Program",
  intakeSession: "Intake session",
  "documents.photo": "Photograph",
  "documents.identity": "CNIC or B-Form copy",
  "documents.resultCard": "Latest result card",
  "documents.incomeProof": "Proof of income",
  "financial.monthlyIncomePkr": "Monthly household income",
  "financial.familySize": "Family size",
  "financial.guardianOccupation": "Guardian occupation",
  "financial.otherSupport": "Other support received",
  "financial.statementOfNeed": "Statement of need",
  declaration: "Declaration",
};

export const KNOWN_FIELDS: ReadonlySet<string> = new Set(Object.keys(FIELD_LABELS));
