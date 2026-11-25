import { InboxIcon } from "lucide-react";
import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { MessagesFilter } from "@/features/message-inbox/messages-filter";
import { MessagesTable } from "@/features/message-inbox/messages-table";
import { hasPermission } from "@/lib/constants/permissions";
import { buildHref } from "@/lib/query-string";
import { listMessagesQuerySchema } from "@/lib/validations/message";
import { checkPagePermission } from "@/server/auth/session";
import { getDepartments } from "@/server/services/department.service";
import { getMessages } from "@/server/services/message-inbox.service";

export const metadata: Metadata = { title: "Messages" };

const BASE_PATH = "/portal/messages";

export default async function MessagesPage({ searchParams }: PageProps<"/portal/messages">) {
  const access = await checkPagePermission("messages:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listMessagesQuerySchema.parse(await searchParams);
  const [{ items, total }, departments] = await Promise.all([
    getMessages(access.staff, query),
    getDepartments(),
  ]);
  const officeName = new Map(departments.map((department) => [department.id, department.name]));
  const isAllOffices = access.staff.role === "SUPER_ADMIN" || access.staff.role === "CEO_OFFICE";
  const params = { q: query.q, status: query.status, subject: query.subject };
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageHeader
        title="Messages"
        description={
          isAllOffices
            ? "Messages from the contact form, for every office."
            : "Messages from the contact form whose subject belongs to your office."
        }
      />
      <MessagesFilter query={query} />
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 1 ? "1 message" : `${String(total)} messages`}
      </p>
      {items.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="No messages found"
          description="Nothing matches these filters. Clear them to see every message."
        />
      ) : (
        <MessagesTable
          messages={items.map((message) => ({
            ...message,
            officeName: officeName.get(message.departmentId) ?? "",
          }))}
          showOffice={isAllOffices}
          canDelete={
            hasPermission(access.staff, "messages:manage") &&
            hasPermission(access.staff, "content:delete")
          }
          sorting={{ basePath: BASE_PATH, sort: query.sort, params }}
        />
      )}
      <Pagination
        page={query.page}
        pageCount={pageCount}
        getHref={(page) => buildHref(BASE_PATH, { ...params, sort: query.sort, page })}
        className="mt-4"
      />
    </>
  );
}
