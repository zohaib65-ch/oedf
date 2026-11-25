"use client";

import { useState, type ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { SaveButton } from "@/components/portal/save-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { applyApiErrors } from "@/lib/api/apply-api-errors";

interface ActionDialogProps<T extends FieldValues> {
  /** The trigger and submit text, for example "Ask for clarification". */
  label: string;
  /** Read by screen readers after the trigger's label, to say which office it acts for. */
  context: string;
  title: string;
  description: string;
  form: UseFormReturn<T>;
  /** The field names the server may report errors for. */
  knownFields: ReadonlySet<string>;
  onSubmit: (values: T) => Promise<void>;
  variant?: "default" | "outline";
  children: ReactNode;
}

/** A directive action that needs a few fields: a button, then a dialog with the form. */
export function ActionDialog<T extends FieldValues>({
  label,
  context,
  title,
  description,
  form,
  knownFields,
  onSubmit,
  variant = "default",
  children,
}: ActionDialogProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      await onSubmit(values);
      setIsOpen(false);
      form.reset();
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, knownFields));
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          {label}
          <span className="sr-only"> ({context})</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="flex min-h-0 flex-1 flex-col gap-5"
        >
          <DialogBody className="space-y-5">
            {formError ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            {children}
          </DialogBody>
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
            <SaveButton isPending={form.formState.isSubmitting}>{label}</SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
