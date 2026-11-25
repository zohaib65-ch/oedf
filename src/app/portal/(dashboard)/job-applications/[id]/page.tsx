import type { Metadata } from "next";
import Link from "next/link";

import { ArchiveButton } from "@/components/portal/archive-button";
import { DetailList } from "@/components/portal/detail-list";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { NoteForm } from "@/components/portal/note-form";
import { PageHeader } from "@/components/portal/page-header";
import { StatusBadge } from "@/components/portal/status-badge";
import { Timeline, type TimelineItem } from "@/components/portal/timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateDetails } from "@/features/job-application-review/candidate-details";
import { InterviewForm } from "@/features/job-application-review/interview-form";
import { JobStatusDialog } from "@/features/job-application-review/job-status-dialog";
import {
  INTERVIEW_STATUSES,
  JOB_APPLICATION_TRANSITIONS,
  jobApplicationStatusTone,
} from "@/lib/constants/job-application-workflow";
import { JOB_APPLICATION_STATUS_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { formatDateTime } from "@/lib/format";
import { checkPagePermission } from "@/server/auth/session";
import { orNotFound } from "@/server/http/or-not-found";
import type { JobApplicationDetail } from "@/server/repositories/job-application-review.repository";
import { getJobApplicationDetail } from "@/server/services/job-application-review.service";

export const metadata: Metadata = { title: "Job application" };

function toTimelineItems(application: JobApplicationDetail): TimelineItem[] {
  return application.timeline.map((entry, index) => ({
    id: `${entry.at}-${String(index)}`,
    at: entry.at,
    actorName: entry.actorName,
    change:
      entry.kind === "STATUS" && entry.to
        ? `${entry.from ? JOB_APPLICATION_STATUS_LABELS[entry.from] : "New"} → ${JOB_APPLICATION_STATUS_LABELS[entry.to]}`
        : undefined,
    text: entry.text,
  }));
}

export default async function JobApplicationPage({
  params,
}: PageProps<"/portal/job-applications/[id]">) {
  const access = await checkPagePermission("job-applications:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const { id } = await params;
  const application = await orNotFound(getJobApplicationDetail(id));
  const canReview = hasPermission(access.staff, "job-applications:review");
  const isArchived = application.archivedAt !== null;
  const isEditable = canReview && !isArchived;
  const nextStatuses = isEditable ? JOB_APPLICATION_TRANSITIONS[application.status] : [];
  const canSetInterview = isEditable && INTERVIEW_STATUSES.includes(application.status);

  return (
    <>
      <PageHeader
        title={application.referenceNumber}
        description={`${application.candidate.fullName} applied for ${application.vacancy?.title ?? "a vacancy that was deleted"} on ${formatDateTime(application.createdAt)}.`}
        actions={
          <>
            {isArchived ? <Badge variant="outline">Archived</Badge> : null}
            <StatusBadge
              label={JOB_APPLICATION_STATUS_LABELS[application.status]}
              tone={jobApplicationStatusTone(application.status)}
            />
          </>
        }
      />

      {nextStatuses.length > 0 || canReview ? (
        <section aria-label="Application actions" className="flex flex-wrap gap-2">
          {nextStatuses.map((target) => (
            <JobStatusDialog key={target} applicationId={application.id} target={target} />
          ))}
          {canReview ? (
            <ArchiveButton
              endpoint={`/job-applications/${application.id}`}
              isArchived={isArchived}
            />
          ) : null}
        </section>
      ) : null}

      {isArchived && application.archivedAt ? (
        <Alert>
          <AlertTitle>Archived on {formatDateTime(application.archivedAt)}</AlertTitle>
          <AlertDescription>
            Restore it to change its status or interview time, or to add a note.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <CandidateDetails application={application} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vacancy and interview</CardTitle>
              <CardDescription>
                The candidate is not emailed about changes here; contact them directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailList
                columns={1}
                items={[
                  {
                    label: "Vacancy",
                    value: application.vacancy ? (
                      <Link
                        href={`/portal/vacancies/${application.vacancy.id}`}
                        className="font-semibold text-navy underline underline-offset-2"
                      >
                        {application.vacancy.title}
                      </Link>
                    ) : (
                      "Deleted vacancy"
                    ),
                  },
                  ...(canSetInterview
                    ? []
                    : [
                        {
                          label: "Interview",
                          value: application.interviewAt
                            ? formatDateTime(application.interviewAt)
                            : "Not set",
                        },
                      ]),
                ]}
              />
              {canSetInterview ? (
                <InterviewForm
                  applicationId={application.id}
                  interviewAtLocal={application.interviewAtLocal}
                />
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>History and notes</CardTitle>
              <CardDescription>Internal. Candidates never see this.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditable ? (
                <NoteForm
                  endpoint={`/job-applications/${application.id}/notes`}
                  label="Internal note"
                  placeholder="Only staff can see this note"
                />
              ) : null}
              <Timeline items={toTimelineItems(application)} emptyText="Nothing recorded yet." />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
