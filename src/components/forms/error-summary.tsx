"use client";

import { AlertCircleIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import type { FieldErrors } from "react-hook-form";

import { fieldId } from "@/components/forms/field-ids";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorItem {
  path: string;
  message: string;
}

/** Walks react-hook-form's nested error object into a flat list of `path` and message. */
function flattenErrors(errors: FieldErrors, parent = ""): ErrorItem[] {
  return Object.entries(errors).flatMap(([key, value]) => {
    if (!value || typeof value !== "object") {
      return [];
    }
    const path = parent ? `${parent}.${key}` : key;
    if ("message" in value && typeof value.message === "string") {
      return [{ path, message: value.message }];
    }
    return flattenErrors(value as FieldErrors, path);
  });
}

interface ErrorSummaryProps {
  errors: FieldErrors;
  /** The question's label for each field path, so a message says which field it is about. */
  labels: Record<string, string>;
  /** Changes each time the summary should take focus (a failed Next or Submit). */
  focusKey: number;
}

/** Lists every problem at the top of the form. Each item jumps to its field. */
export function ErrorSummary({ errors, labels, focusKey }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const handledFocusKey = useRef(0);
  const items = flattenErrors(errors).filter((item) => labels[item.path]);
  const hasItems = items.length > 0;

  // The errors can arrive one render after the request to focus, so focus once both are there.
  useEffect(() => {
    if (focusKey > handledFocusKey.current && hasItems) {
      handledFocusKey.current = focusKey;
      ref.current?.focus();
    }
  }, [focusKey, hasItems]);

  if (items.length === 0) {
    return null;
  }
  return (
    <Alert variant="destructive" ref={ref} tabIndex={-1}>
      <AlertCircleIcon aria-hidden="true" />
      <AlertTitle>Please fix {items.length === 1 ? "this problem" : "these problems"}</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {items.map((item) => (
            <li key={item.path}>
              <a
                href={`#${fieldId(item.path)}`}
                className="underline underline-offset-2"
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(fieldId(item.path))?.focus();
                }}
              >
                {labels[item.path]}: {item.message}
              </a>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
