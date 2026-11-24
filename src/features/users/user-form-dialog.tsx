"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";
import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { useCreateUser, useUpdateUser } from "@/features/users/hooks/use-user-mutations";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { ROLE_OPTIONS } from "@/lib/constants/labels";
import { createUserSchema, type CreateUserInput } from "@/lib/validations/user";
import type { UserRecord } from "@/server/repositories/user.repository";

const KNOWN_FIELDS: ReadonlySet<string> = new Set(["name", "email", "role", "departmentId"]);

interface UserFormDialogProps {
  /** The person being edited. Leave out to create a new account. */
  user?: UserRecord;
  departments: readonly { value: string; label: string }[];
  /** The button that opens the dialog. */
  children: ReactNode;
}

/** Creates a staff account (and emails the invitation) or edits an existing one. */
export function UserFormDialog({ user, departments, children }: UserFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const create = useCreateUser();
  const update = useUpdateUser();
  const isEditing = user !== undefined;
  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role,
      departmentId: user?.departmentId ?? "",
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      if (isEditing) {
        await update.mutateAsync({
          id: user.id,
          changes: { name: values.name, role: values.role, departmentId: values.departmentId },
        });
      } else {
        await create.mutateAsync(values);
        form.reset();
      }
      setIsOpen(false);
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit user" : "Add a user"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Change the name, role or office. The email cannot be changed."
              : "They receive an email with a link to set their own password."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
          {formError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <FieldGroup>
            <TextField control={form.control} name="name" label="Name" autoComplete="off" />
            {isEditing ? (
              <p className="text-sm text-muted-foreground">Email: {user.email}</p>
            ) : (
              <TextField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                autoComplete="off"
              />
            )}
            <SelectField control={form.control} name="role" label="Role" options={ROLE_OPTIONS} />
            <SelectField
              control={form.control}
              name="departmentId"
              label="Office"
              options={departments}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <SaveButton isPending={form.formState.isSubmitting}>
              {isEditing ? "Save changes" : "Create user"}
            </SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
