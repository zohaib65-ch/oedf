"use client";

import { GlobeIcon } from "lucide-react";
import { useWatch, type Control } from "react-hook-form";

import { CheckboxField } from "@/components/forms/checkbox-field";
import type { InstitutionFormValues } from "@/lib/validations/institution";

/** What the current choice means for visitors, so nobody has to guess why it is not showing. */
function outcome(isPublic: boolean, isActive: boolean): string {
  if (!isPublic) {
    return "Hidden from the website.";
  }
  return isActive
    ? "Visitors see it on the Institutions page (/institutions) and the home page."
    : "It shows on the website once its status is Active.";
}

interface WebsiteVisibilityFieldProps {
  control: Control<InstitutionFormValues>;
  /** Only someone who may publish can change it; anyone else sees it read-only. */
  canPublish: boolean;
}

/** The "show on the website" choice, in its own highlighted box, with what it will do. */
export function WebsiteVisibilityField({ control, canPublish }: WebsiteVisibilityFieldProps) {
  const [isPublic, status] = useWatch({ control, name: ["isPublic", "status"] });
  return (
    <div className="space-y-3 rounded-xl border border-gold/40 bg-gold/5 p-4">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <GlobeIcon className="size-4 text-gold-text" aria-hidden="true" />
        Website
      </p>
      <CheckboxField control={control} name="isPublic" isDisabled={!canPublish}>
        Show on the public website while Active
        {canPublish ? "" : " (a Director decides)"}
      </CheckboxField>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {outcome(isPublic, status === "ACTIVE")}
      </p>
    </div>
  );
}
