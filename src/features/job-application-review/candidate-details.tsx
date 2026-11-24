import { FileTextIcon } from "lucide-react";

import { DetailList } from "@/components/portal/detail-list";
import { PrivateFileLink } from "@/components/portal/private-file-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/format";
import type { JobApplicationDetail } from "@/server/repositories/job-application-review.repository";

const formatCnic = (cnic: string) => `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;

/** The candidate's answers, CV and cover letter. Only people allowed to read job applications see this. */
export function CandidateDetails({ application }: { application: JobApplicationDetail }) {
  const { candidate, cv } = application;
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Candidate</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              { label: "Full name", value: candidate.fullName },
              { label: "CNIC", value: formatCnic(candidate.cnic) },
              { label: "Email", value: candidate.email },
              { label: "Phone", value: candidate.phone },
              { label: "City", value: candidate.city },
              { label: "Highest qualification", value: candidate.highestQualification },
              {
                label: "Experience",
                value:
                  candidate.yearsOfExperience === 1
                    ? "1 year"
                    : `${String(candidate.yearsOfExperience)} years`,
              },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>CV</CardTitle>
          <CardDescription>Each opening is recorded in the audit log.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileTextIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <p className="truncate text-sm text-muted-foreground">
              {cv.format
                ? `${cv.originalName}, ${cv.format.toUpperCase()}, ${formatBytes(cv.bytes)}`
                : "File details are not available."}
            </p>
          </div>
          <PrivateFileLink fileId={cv.fileId} name="CV" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cover letter</CardTitle>
        </CardHeader>
        <CardContent>
          {candidate.coverLetter ? (
            <p className="whitespace-pre-line">{candidate.coverLetter}</p>
          ) : (
            <p className="text-muted-foreground">No cover letter was written.</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
