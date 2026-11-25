import { AlertTriangleIcon } from "lucide-react";
import type { Metadata } from "next";

import { DetailList } from "@/components/portal/detail-list";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { NoteForm } from "@/components/portal/note-form";
import { PageHeader } from "@/components/portal/page-header";
import { Timeline, type TimelineItem } from "@/components/portal/timeline";
import { FormattedText } from "@/components/shared/formatted-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AssignmentActions,
  type AssignmentAbilities,
} from "@/features/directive-management/assignment-actions";
import {
  AssignmentStatusBadge,
  OverdueBadge,
  PriorityBadge,
} from "@/features/directive-management/directive-badges";
import {
  CLARIFIABLE_ASSIGNMENT_STATUSES,
  isFinished,
  PROGRESS_TRANSITIONS,
} from "@/lib/constants/directive-workflow";
import {
  ASSIGNMENT_STATUS_LABELS,
  CLARIFICATION_DECISION_LABELS,
  CLARIFICATION_REASON_LABELS,
} from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { formatDateTime, formatDay } from "@/lib/format";
import type { StaffContext } from "@/server/auth/api-session";
import { checkPagePermission } from "@/server/auth/session";
import { orNotFound } from "@/server/http/or-not-found";
import {
  actsForOffice,
  getDirective,
  getOwnerChoices,
  type AssignmentView,
} from "@/server/services/directive.service";

export const metadata: Metadata = { title: "Directive" };

function abilitiesFor(staff: StaffContext, assignment: AssignmentView): AssignmentAbilities {
  const isOwnOffice = actsForOffice(staff, assignment);
  const responds = isOwnOffice && hasPermission(staff, "directives:respond");
  const updates = isOwnOffice && hasPermission(staff, "directives:update");
  const { status } = assignment;
  return {
    canAcknowledge: responds && status === "PENDING_ACKNOWLEDGEMENT",
    canChooseOwner: responds && (status === "ACKNOWLEDGED" || status === "IN_PROGRESS"),
    nextStatus: updates
      ? ((PROGRESS_TRANSITIONS[status]?.[0] as AssignmentAbilities["nextStatus"] | undefined) ??
        null)
      : null,
    canAskClarification:
      responds && (CLARIFIABLE_ASSIGNMENT_STATUSES as readonly string[]).includes(status),
    canResolve: hasPermission(staff, "directives:resolve") && status === "CLARIFICATION_REQUESTED",
  };
}

/** Status changes and progress updates together, newest first. */
function toTimeline(assignment: AssignmentView): TimelineItem[] {
  const changes = assignment.history.map((entry, index) => ({
    id: `history-${String(index)}`,
    at: entry.at,
    actorName: entry.actorName,
    change: entry.from
      ? `${ASSIGNMENT_STATUS_LABELS[entry.from]} → ${ASSIGNMENT_STATUS_LABELS[entry.to]}`
      : ASSIGNMENT_STATUS_LABELS[entry.to],
    text: entry.reason,
  }));
  const updates = assignment.updates.map((update) => ({
    id: update.id,
    at: update.createdAt,
    actorName: update.authorName,
    text: update.body,
  }));
  return [...changes, ...updates].sort((a, b) => b.at.localeCompare(a.at));
}

export default async function DirectivePage({ params }: PageProps<"/portal/directives/[id]">) {
  const access = await checkPagePermission("directives:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const { staff } = access;
  const { id } = await params;
  const directive = await orNotFound(getDirective(staff, id));
  const rows = await Promise.all(
    directive.assignments.map(async (assignment) => {
      const abilities = abilitiesFor(staff, assignment);
      const owners = abilities.canChooseOwner ? await getOwnerChoices(assignment.departmentId) : [];
      return { assignment, abilities, owners };
    }),
  );

  return (
    <>
      <PageHeader
        title={directive.title}
        description={`${directive.referenceNumber}. Issued by ${directive.issuedByName} on ${formatDateTime(directive.issuedAt)}.`}
        actions={<PriorityBadge priority={directive.priority} />}
      />
      {directive.isOverdue ? (
        <Alert variant="destructive">
          <AlertTriangleIcon aria-hidden="true" />
          <AlertTitle>Overdue</AlertTitle>
          <AlertDescription>
            This directive was due on {formatDay(directive.dueDate)} and at least one office has not
            finished its part.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <FormattedText text={directive.body} size="base" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>At a glance</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              columns={1}
              items={[
                { label: "Reference", value: directive.referenceNumber },
                {
                  label: "Due",
                  value: (
                    <span className="flex flex-wrap items-center gap-2">
                      {formatDay(directive.dueDate)}
                      {directive.isOverdue ? <OverdueBadge /> : null}
                    </span>
                  ),
                },
                {
                  label: "Offices",
                  value: `${String(directive.assignments.filter((item) => isFinished(item.status)).length)} of ${String(directive.assignments.length)} finished`,
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {rows.map(({ assignment, abilities, owners }) => (
        <section key={assignment.id} aria-labelledby={`office-${assignment.id}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <h2 id={`office-${assignment.id}`}>{assignment.departmentName}</h2>
                <AssignmentStatusBadge status={assignment.status} />
                {assignment.isOverdue ? <OverdueBadge /> : null}
              </CardTitle>
              <CardDescription>
                {assignment.ownerName ? `Owner: ${assignment.ownerName}.` : "No owner yet."}{" "}
                {assignment.acknowledgedAt
                  ? `Acknowledged by ${assignment.acknowledgedByName} on ${formatDateTime(assignment.acknowledgedAt)}.`
                  : "Not acknowledged yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AssignmentActions
                directiveId={directive.id}
                assignmentId={assignment.id}
                officeName={assignment.departmentName}
                abilities={abilities}
                ownerChoices={owners.map((owner) => ({ value: owner.id, label: owner.name }))}
                currentOwnerId={assignment.ownerId}
              />
              {assignment.clarification ? (
                <div className="rounded-lg border border-border p-4">
                  <h3 className="font-semibold">Clarification</h3>
                  <DetailList
                    items={[
                      {
                        label: "Reason",
                        value: CLARIFICATION_REASON_LABELS[assignment.clarification.reason],
                      },
                      {
                        label: "Asked by",
                        value: `${assignment.clarification.requestedByName}, ${formatDateTime(assignment.clarification.requestedAt)}`,
                      },
                      { label: "Explanation", value: assignment.clarification.text },
                      {
                        label: "Decision",
                        value: assignment.clarification.resolution
                          ? `${CLARIFICATION_DECISION_LABELS[assignment.clarification.resolution.decision]} (${assignment.clarification.resolution.resolvedByName}): ${assignment.clarification.resolution.note}`
                          : "Waiting for the CEO Office",
                      },
                    ]}
                  />
                </div>
              ) : null}
              <div>
                <h3 className="mb-3 font-semibold">History and updates</h3>
                <Timeline items={toTimeline(assignment)} emptyText="Nothing yet." />
              </div>
              {actsForOffice(staff, assignment) &&
              hasPermission(staff, "directives:update") &&
              !isFinished(assignment.status) ? (
                <NoteForm
                  endpoint={`/directives/${directive.id}/assignments/${assignment.id}/notes`}
                  label={`Progress update for ${assignment.departmentName}`}
                  submitLabel="Post update"
                  successMessage="Update posted."
                />
              ) : null}
            </CardContent>
          </Card>
        </section>
      ))}
    </>
  );
}
