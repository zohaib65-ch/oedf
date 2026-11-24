"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toastApiError, useApiAction } from "@/lib/api/use-api-action";

interface ConfirmButtonProps {
  /** The button text, also used on the confirm button unless `confirmLabel` is given. */
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "outline" | "destructive";
  /** Runs after the person confirms. A failure is shown in a toast and the dialog stays open. */
  onConfirm: () => Promise<void>;
}

/** A button that asks before it acts, for publishing, closing, archiving and deleting. */
export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel = label,
  variant = "default",
  onConfirm,
}: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { run, isPending } = useApiAction(onConfirm);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant={variant === "destructive" ? "outline" : variant}>{label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={isPending}
            onClick={(event) => {
              // Keep the dialog open until the server answers, so a failure can be retried.
              event.preventDefault();
              run()
                .then(() => {
                  setIsOpen(false);
                })
                .catch(toastApiError);
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
