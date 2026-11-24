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
  const getHref = (page: number) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.role) params.set("role", query.role);
    params.set("page", String(page));
    return `/portal/users?${params.toString()}`;
  };

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
      <UsersFilter q={query.q} role={query.role} />
      {items.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Try a different search, or add a user."
        />
      ) : (
        <UsersTable users={items} departments={departmentOptions} currentUserId={access.staff.id} />
      )}
      <Pagination page={query.page} pageCount={pageCount} getHref={getHref} className="mt-4" />
    </>
  );
}
