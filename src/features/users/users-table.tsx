"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";

import {
  DataTable,
  type DataTableColumn,
  type DataTableSorting,
} from "@/components/portal/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteUser,
  useSendPasswordReset,
  useUpdateUser,
} from "@/features/users/hooks/use-user-mutations";
import { UserFormDialog } from "@/features/users/user-form-dialog";
import { toastApiError } from "@/lib/api/use-api-action";
import { getRoleLabel } from "@/lib/constants/labels";
import { formatDateTime } from "@/lib/format";
import type { UserRecord } from "@/server/repositories/user.repository";

interface UsersTableProps {
  users: UserRecord[];
  departments: readonly { value: string; label: string }[];
  currentUserId: string;
  sorting: DataTableSorting;
}

export function UsersTable({ users, departments, currentUserId, sorting }: UsersTableProps) {
  const [pendingDeactivation, setPendingDeactivation] = useState<UserRecord | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<UserRecord | null>(null);
  const update = useUpdateUser();
  const remove = useDeleteUser();
  const sendReset = useSendPasswordReset();
  const officeName = new Map(departments.map((department) => [department.value, department.label]));

  const setActive = (user: UserRecord, isActive: boolean) => {
    update.run(user.id, { isActive }).catch(toastApiError);
  };

  const columns: DataTableColumn<UserRecord>[] = [
    { id: "name", header: "Name", sortKey: "name", cell: (user) => user.name },
    { id: "email", header: "Email", sortKey: "email", cell: (user) => user.email },
    { id: "role", header: "Role", sortKey: "role", cell: (user) => getRoleLabel(user.role) },
    {
      id: "office",
      header: "Office",
      cell: (user) => officeName.get(user.departmentId ?? "") ?? "None",
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => (
        <Badge variant={user.isActive ? "secondary" : "outline"}>
          {user.isActive ? "Active" : "Deactivated"}
        </Badge>
      ),
    },
    {
      id: "created",
      header: "Created",
      sortKey: "createdAt",
      cell: (user) => formatDateTime(user.createdAt),
    },
    {
      id: "actions",
      header: "Actions",
      isActions: true,
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${user.name}`}>
              <MoreHorizontalIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <UserFormDialog user={user} departments={departments}>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                }}
              >
                Edit
              </DropdownMenuItem>
            </UserFormDialog>
            {user.isActive ? (
              <DropdownMenuItem
                disabled={sendReset.isPending}
                onSelect={() => {
                  sendReset.run(user.id).catch(toastApiError);
                }}
              >
                Send password reset
              </DropdownMenuItem>
            ) : null}
            {user.isActive && user.id !== currentUserId ? (
              <DropdownMenuItem
                onSelect={() => {
                  setPendingDeactivation(user);
                }}
              >
                Deactivate
              </DropdownMenuItem>
            ) : null}
            {user.isActive ? null : (
              <DropdownMenuItem
                disabled={update.isPending}
                onSelect={() => {
                  setActive(user, true);
                }}
              >
                Reactivate
              </DropdownMenuItem>
            )}
            {user.id === currentUserId ? null : (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setPendingDeletion(user);
                }}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        label="Staff accounts"
        columns={columns}
        rows={users}
        getRowId={(user) => user.id}
        sorting={sorting}
      />
      <AlertDialog
        open={pendingDeactivation !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPendingDeactivation(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {pendingDeactivation?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They are signed out at once and cannot sign in again until you reactivate the account.
              Their history stays in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={update.isPending}
              onClick={() => {
                if (pendingDeactivation) {
                  setActive(pendingDeactivation, false);
                }
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={pendingDeletion !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPendingDeletion(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDeletion?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The account is removed for good and its invitation link stops working. This is only
              possible while the person has not worked in the portal yet; after that, deactivate the
              account instead so the record of who did what stays complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (pendingDeletion) {
                  remove.run(pendingDeletion.id).catch(toastApiError);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
