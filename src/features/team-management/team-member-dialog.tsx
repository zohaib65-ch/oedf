"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { ImageFields } from "@/components/portal/image-fields";
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
import { FieldGroup } from "@/components/ui/field";
import { applyApiErrors } from "@/lib/api/apply-api-errors";
import { apiPatch, apiPost } from "@/lib/api/client";
import {
  MAX_TEAM_BIO_LENGTH,
  MAX_TEAM_NAME_LENGTH,
  MAX_TEAM_POSITION_LENGTH,
  teamMemberFormSchema,
  type TeamMemberFormInput,
  type TeamMemberFormValues,
} from "@/lib/validations/team";

const KNOWN_FIELDS: ReadonlySet<string> = new Set([
  "name",
  "position",
  "bio",
  "isPublished",
  "image",
  "imageAlt",
]);

const EMPTY: TeamMemberFormValues = {
  name: "",
  position: "",
  bio: "",
  isPublished: true,
  imageAlt: "",
};

export interface TeamMemberItem {
  id: string;
  name: string;
  position: string;
  bio: string;
  isPublished: boolean;
  /** The form's value for the saved photo, or nothing. */
  image?: TeamMemberFormValues["image"];
  imageAlt: string;
  /** The saved photo as visitors see it. */
  photo: { url: string; width: number; height: number; alt: string } | null;
}

/** Adds or edits one team member in a dialog. */
export function TeamMemberDialog({ member }: { member?: TeamMemberItem }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const defaults: TeamMemberFormValues = member
    ? {
        name: member.name,
        position: member.position,
        bio: member.bio,
        isPublished: member.isPublished,
        image: member.image,
        imageAlt: member.imageAlt,
      }
    : EMPTY;
  const form = useForm<TeamMemberFormValues, unknown, TeamMemberFormInput>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: defaults,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    try {
      if (member) {
        await apiPatch(`/team-members/${member.id}`, values);
        toast.success("Team member saved.");
      } else {
        await apiPost("/team-members", values);
        toast.success("Team member added.");
      }
      setIsOpen(false);
      router.refresh();
    } catch (error: unknown) {
      setFormError(applyApiErrors(error, form.setError, KNOWN_FIELDS));
    }
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          form.reset(defaults);
          setFormError(undefined);
        }
      }}
    >
      <DialogTrigger asChild>
        {member ? (
          <Button variant="outline" size="sm">
            <PencilIcon aria-hidden="true" />
            Edit<span className="sr-only"> {member.name}</span>
          </Button>
        ) : (
          <Button>
            <PlusIcon aria-hidden="true" />
            New team member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{member ? "Edit team member" : "New team member"}</DialogTitle>
          <DialogDescription>
            Shown on the public Team page. A new person goes to the end of the list.
          </DialogDescription>
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
            <FieldGroup>
              <FieldGroup className="sm:grid sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="name"
                  label="Name"
                  placeholder="For example Ayesha Khan"
                  maxLength={MAX_TEAM_NAME_LENGTH}
                />
                <TextField
                  control={form.control}
                  name="position"
                  label="Position"
                  placeholder="For example Program Manager"
                  maxLength={MAX_TEAM_POSITION_LENGTH}
                />
              </FieldGroup>
              <TextareaField
                control={form.control}
                name="bio"
                label="Short bio"
                placeholder="A sentence or two about their work and background"
                description={`Optional. Up to ${String(MAX_TEAM_BIO_LENGTH)} characters.`}
                rows={4}
                maxLength={MAX_TEAM_BIO_LENGTH}
              />
              <ImageFields control={form.control} currentImage={member?.photo ?? null} />
              <CheckboxField control={form.control} name="isPublished">
                Published (shown on the public Team page)
              </CheckboxField>
            </FieldGroup>
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
            <SaveButton isPending={form.formState.isSubmitting}>Save team member</SaveButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
