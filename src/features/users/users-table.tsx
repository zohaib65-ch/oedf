"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/portal/data-table";
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
import { useSendPasswordReset, useUpdateUser } from "@/features/users/hooks/use-user-mutations";
import { UserFormDialog } from "@/features/users/user-form-dialog";
import { getRoleLabel } from "@/lib/constants/labels";
import { formatDateTime } from "@/lib/format";
import type { UserRecord } from "@/server/repositories/user.repository";

interface UsersTableProps {
  users: UserRecord[];
  departments: readonly { value: string; label: string }[];
  currentUserId: string;
}

export function UsersTable({ users, departments, currentUserId }: UsersTableProps) {
  const [pendingDeactivation, setPendingDeactivation] = useState<UserRecord | null>(null);
  const update = useUpdateUser();
  const sendReset = useSendPasswordReset();

  const columns = useMemo<ColumnDef<UserRecord>[]>(() => {
    const officeName = new Map(
      departments.map((department) => [department.value, department.label]),
    );
    return [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
      { id: "role", header: "Role", cell: ({ row }) => getRoleLabel(row.original.role) },
      {
        id: "office",
        header: "Office",
        cell: ({ row }) => officeName.get(row.original.departmentId ?? "") ?? "None",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "secondary" : "outline"}>
            {row.original.isActive ? "Active" : "Deactivated"}
          </Badge>
        ),
      },
      {
        id: "created",
        header: "Created",
        cell: ({ row }) => formatDateTime(row.original.createdAt),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableHiding: false,
        cell: ({ row }) => {
          const user = row.original;
          return (
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
                    onSelect={() => {
                      sendReset.mutate(user.id);
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
                    onSelect={() => {
                      update.mutate({ id: user.id, changes: { isActive: true } });
                    }}
                  >
                    Reactivate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ];
  }, [departments, currentUserId, sendReset, update]);

  return (
    <>
      <DataTable
        label="Staff accounts"
        columns={columns}
        rows={users}
        getRowId={(user) => user.id}
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
              onClick={() => {
                if (pendingDeactivation) {
                  update.mutate({ id: pendingDeactivation.id, changes: { isActive: false } });
                }
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
