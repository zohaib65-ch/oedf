import { CheckboxField } from "@/components/forms/checkbox-field";
import { Button } from "@/components/ui/button";
import type {
  ApplicationFormApi,
  ApplicationFormValues,
  StepId,
} from "@/features/applications/application-form-config";
import { GENDER_LABELS } from "@/lib/constants/labels";
import type { ApplicationProgramOption } from "@/server/repositories/program.repository";

interface SummaryRow {
  label: string;
  value: string;
}

interface SummarySection {
  title: string;
  step: StepId;
  rows: SummaryRow[];
}

function asText(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function getFileName(file: unknown): string {
  return typeof file === "object" && file !== null && "originalName" in file
    ? asText(file.originalName)
    : "";
}

/** The answers as text, so the applicant can check them before sending. */
function summarize(
  values: ApplicationFormValues,
  programs: readonly ApplicationProgramOption[],
): SummarySection[] {
  const { applicant, education, documents } = values;
  const financial = "financial" in values ? values.financial : undefined;
  const program = programs.find((option) => option.id === values.programId)?.title ?? "Not chosen";
  const gender = applicant.gender in GENDER_LABELS ? GENDER_LABELS[applicant.gender] : "";
  const sections: SummarySection[] = [
    {
      title: "Applicant",
      step: "applicant",
      rows: [
        { label: "Full name", value: asText(applicant.fullName) },
        { label: "Father or guardian", value: asText(applicant.guardianName) },
        { label: "Date of birth", value: asText(applicant.dateOfBirth) },
        { label: "Gender", value: gender },
        { label: "CNIC or B-Form", value: asText(applicant.cnic) },
        { label: "Email", value: asText(applicant.email) },
        { label: "Phone", value: asText(applicant.phone) },
        { label: "Address", value: `${asText(applicant.address)}, ${asText(applicant.city)}` },
      ],
    },
    {
      title: "Education",
      step: "education",
      rows: [
        { label: "Last institution", value: asText(education.lastInstitution) },
        { label: "Class or degree", value: asText(education.classOrDegree) },
        { label: "Board or university", value: asText(education.boardOrUniversity) },
        { label: "Marks or percentage", value: asText(education.marksOrPercentage) },
        { label: "Passing year", value: asText(education.passingYear) },
      ],
    },
    {
      title: "Choice",
      step: "choice",
      rows: [
        { label: "Program", value: program },
        { label: "Intake session", value: asText(values.intakeSession) },
      ],
    },
    {
      title: "Documents",
      step: "documents",
      rows: [
        { label: "Photograph", value: getFileName(documents.photo) },
        { label: "CNIC or B-Form copy", value: getFileName(documents.identity) },
        { label: "Latest result card", value: getFileName(documents.resultCard) },
        ...(values.type === "SCHOLARSHIP"
          ? [{ label: "Proof of income", value: getFileName(values.documents.incomeProof) }]
          : []),
      ],
    },
  ];
  if (financial) {
    sections.push({
      title: "Financial information",
      step: "financial",
      rows: [
        { label: "Monthly income (PKR)", value: asText(financial.monthlyIncomePkr) },
        { label: "Family size", value: asText(financial.familySize) },
        { label: "Guardian's occupation", value: asText(financial.guardianOccupation) },
        { label: "Other support", value: asText(financial.otherSupport) || "None" },
        { label: "Statement of need", value: asText(financial.statementOfNeed) },
      ],
    });
  }
  return sections;
}

interface StepReviewProps {
  form: ApplicationFormApi;
  programs: readonly ApplicationProgramOption[];
  onEdit: (step: StepId) => void;
}

export function StepReview({ form, programs, onEdit }: StepReviewProps) {
  const sections = summarize(form.getValues(), programs);
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.title} className="rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onEdit(section.step);
              }}
            >
              Edit<span className="sr-only"> {section.title}</span>
            </Button>
          </div>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {section.rows.map((row) => (
              <div key={row.label}>
                <dt className="text-xs font-bold tracking-widest text-gold-text uppercase">
                  {row.label}
                </dt>
                <dd className="mt-1 break-words text-foreground">{row.value || "Not provided"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <CheckboxField control={form.control} name="declaration">
        I declare that the information and documents I have given are true and complete, and I
        understand that a false statement can lead to my application being rejected.
      </CheckboxField>
    </div>
  );
}
