import { DetailList } from "@/components/portal/detail-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GENDER_LABELS } from "@/lib/constants/labels";
import { formatDay, formatPkr } from "@/lib/format";
import type { ApplicationDetail } from "@/server/repositories/application-review.repository";

/** 3520212345671 as 35202-1234567-1, the way it is printed on the card. */
const formatCnic = (cnic: string) => `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;

/** The applicant's answers: personal details, education and (for a scholarship) the family's finances. */
export function ApplicationDetails({ application }: { application: ApplicationDetail }) {
  const { applicant, education, financial } = application;
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Applicant</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              { label: "Full name", value: applicant.fullName },
              { label: "Father or guardian", value: applicant.guardianName },
              { label: "Date of birth", value: formatDay(applicant.dateOfBirth) },
              { label: "Gender", value: GENDER_LABELS[applicant.gender] },
              { label: "CNIC or B-Form", value: formatCnic(applicant.cnic) },
              { label: "Email", value: applicant.email },
              { label: "Phone", value: applicant.phone },
              { label: "City", value: applicant.city },
              { label: "Address", value: applicant.address },
              { label: "Program", value: application.program?.title ?? "None chosen" },
              { label: "Intake session", value: application.intakeSession },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Education</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              { label: "Last institution", value: education.lastInstitution },
              { label: "Class or degree", value: education.classOrDegree },
              { label: "Board or university", value: education.boardOrUniversity },
              { label: "Marks or percentage", value: education.marksOrPercentage },
              { label: "Passing year", value: String(education.passingYear) },
            ]}
          />
        </CardContent>
      </Card>
      {financial ? (
        <Card>
          <CardHeader>
            <CardTitle>Financial information</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                { label: "Monthly household income", value: formatPkr(financial.monthlyIncomePkr) },
                { label: "People in the family", value: String(financial.familySize) },
                { label: "Guardian's occupation", value: financial.guardianOccupation },
                { label: "Other support", value: financial.otherSupport },
                { label: "Statement of need", value: financial.statementOfNeed },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
