import { PlusIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import { UserFormDialog } from "@/features/users/user-form-dialog";
import { UsersFilter } from "@/features/users/users-filter";
import { UsersTable } from "@/features/users/users-table";
import { buildHref } from "@/lib/query-string";
import { listUsersQuerySchema } from "@/lib/validations/user";
import { checkPagePermission } from "@/server/auth/session";
import { getDepartmentsForStaff } from "@/server/services/settings.service";
import { getUsers } from "@/server/services/user.service";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: PageProps<"/portal/users">) {
  const access = await checkPagePermission("users:manage");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const query = listUsersQuerySchema.parse(await searchParams);
  const [{ items, total }, departments] = await Promise.all([
    getUsers(query),
    getDepartmentsForStaff(),
  ]);
  const departmentOptions = departments.map((department) => ({
    value: department.id,
    label: department.name,
  }));
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const params = { q: query.q, role: query.role };
  const getHref = (page: number) =>
    buildHref("/portal/users", { ...params, sort: query.sort, page });

  return (
    <>
      <PageHeader
        title="Users"
        description="Staff accounts. People are deactivated, never deleted."
        actions={
          <UserFormDialog departments={departmentOptions}>
            <Button>
              <PlusIcon aria-hidden="true" />
              Add user
            </Button>
          </UserFormDialog>
        }
      />
      <UsersFilter query={query} />
      {items.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Try a different search, or add a user."
        />
      ) : (
        <UsersTable
          users={items}
          departments={departmentOptions}
          currentUserId={access.staff.id}
          sorting={{ basePath: "/portal/users", sort: query.sort, params }}
        />
      )}
      <Pagination page={query.page} pageCount={pageCount} getHref={getHref} className="mt-4" />
    </>
  );
}
