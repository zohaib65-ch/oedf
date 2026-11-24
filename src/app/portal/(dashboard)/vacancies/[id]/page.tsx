import type { Metadata } from "next";
import Link from "next/link";

import { DetailList } from "@/components/portal/detail-list";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { FormattedText } from "@/components/shared/formatted-text";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VacancyActions } from "@/features/vacancies/vacancy-actions";
import { VacancyForm } from "@/features/vacancies/vacancy-form";
import { VacancyStatus } from "@/features/vacancies/vacancy-status";
import { EMPLOYMENT_TYPE_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { VACANCY_TRANSITIONS } from "@/lib/constants/vacancy-workflow";
import { formatDate, formatDateTime } from "@/lib/format";
import { checkPagePermission } from "@/server/auth/session";
import { orNotFound } from "@/server/http/or-not-found";
import { getDepartments } from "@/server/services/department.service";
import { getVacancyForStaff } from "@/server/services/vacancy-management.service";

export const metadata: Metadata = { title: "Vacancy" };

const linkClass = "font-semibold text-navy underline underline-offset-2";

export default async function VacancyPage({ params }: PageProps<"/portal/vacancies/[id]">) {
  const access = await checkPagePermission("vacancies:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const { staff } = access;
  const { id } = await params;
  const [vacancy, offices] = await Promise.all([
    orNotFound(getVacancyForStaff(id)),
    getDepartments(),
  ]);
  const mayPublish = hasPermission(staff, "vacancies:publish");
  const mayWrite = hasPermission(staff, "vacancies:write");
  const canEdit = mayWrite && (vacancy.status === "DRAFT" || mayPublish);
  const canDelete = mayWrite && vacancy.status === "DRAFT" && vacancy.applicationCount === 0;
  const nextStatuses = mayPublish ? VACANCY_TRANSITIONS[vacancy.status] : [];

  return (
    <>
      <PageHeader
        title={vacancy.title}
        description={`${vacancy.departmentName}, ${vacancy.city}. ${EMPLOYMENT_TYPE_LABELS[vacancy.employmentType]}.`}
        actions={<VacancyStatus vacancy={vacancy} />}
      />

      {nextStatuses.length > 0 || canDelete ? (
        <section aria-label="Vacancy actions" className="flex flex-wrap gap-2">
          <VacancyActions
            vacancyId={vacancy.id}
            title={vacancy.title}
            status={vacancy.status}
            nextStatuses={nextStatuses}
            canDelete={canDelete}
          />
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{canEdit ? "Edit vacancy" : "Vacancy"}</CardTitle>
            <CardDescription>
              {vacancy.status === "DRAFT"
                ? "A draft. Visitors cannot see it."
                : "Changes appear on the careers page at once."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {canEdit ? (
              <VacancyForm
                vacancyId={vacancy.id}
                offices={offices.map((office) => ({ value: office.id, label: office.name }))}
                defaultValues={{
                  title: vacancy.title,
                  departmentId: vacancy.departmentId,
                  city: vacancy.city,
                  employmentType: vacancy.employmentType,
                  description: vacancy.description,
                  requirements: vacancy.requirements,
                  deadline: vacancy.deadlineDay,
                }}
              />
            ) : (
              <>
                <DetailList
                  items={[
                    { label: "Office", value: vacancy.departmentName },
                    { label: "City", value: vacancy.city },
                    {
                      label: "Type of post",
                      value: EMPLOYMENT_TYPE_LABELS[vacancy.employmentType],
                    },
                    { label: "Last day to apply", value: formatDate(new Date(vacancy.deadline)) },
                  ]}
                />
                <div>
                  <h2 className="mb-2 font-semibold">Description</h2>
                  <FormattedText text={vacancy.description} size="base" />
                </div>
                {vacancy.requirements ? (
                  <div>
                    <h2 className="mb-2 font-semibold">Requirements</h2>
                    <FormattedText text={vacancy.requirements} size="base" />
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>At a glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailList
              columns={1}
              items={[
                {
                  label: "Applications",
                  value:
                    vacancy.applicationCount === 0 ? (
                      "None yet"
                    ) : (
                      <Link
                        href={`/portal/job-applications?vacancyId=${vacancy.id}`}
                        className={linkClass}
                      >
                        View {vacancy.applicationCount}{" "}
                        {vacancy.applicationCount === 1 ? "application" : "applications"}
                      </Link>
                    ),
                },
                {
                  label: "First published",
                  value: vacancy.publishedAt ? formatDateTime(vacancy.publishedAt) : "Not yet",
                },
                { label: "Created", value: formatDateTime(vacancy.createdAt) },
                { label: "Last changed", value: formatDateTime(vacancy.updatedAt) },
              ]}
            />
            {vacancy.shownStatus === "PUBLISHED" ? (
              <Link
                href={`/careers/${vacancy.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                View on the careers page<span className="sr-only"> (opens in a new tab)</span>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
