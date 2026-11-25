"use client";

import type { LucideIcon } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toastApiError, useApiAction } from "@/lib/api/use-api-action";

interface ConfirmButtonProps {
  /** The button text, also used on the confirm button unless `confirmLabel` is given. */
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "outline" | "destructive";
  /** Shows only this icon (for a table row), with `label` as its name and tooltip. */
  icon?: LucideIcon;
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
  icon: Icon,
  onConfirm,
}: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { run, isPending } = useApiAction(onConfirm);

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {Icon ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={label}
                className={
                  variant === "destructive" ? "text-destructive hover:text-destructive" : ""
                }
              >
                <Icon aria-hidden="true" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ) : (
        <AlertDialogTrigger asChild>
          <Button variant={variant}>{label}</Button>
        </AlertDialogTrigger>
      )}
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
