import { z } from "zod";

import { imageShape, objectIdText, requireImageAlt, shortText } from "@/lib/validations/common";

export const MAX_TEAM_NAME_LENGTH = 100;
export const MAX_TEAM_POSITION_LENGTH = 120;
export const MAX_TEAM_BIO_LENGTH = 600;
const MAX_TEAM_MEMBERS = 200;

/** One person on the Team page. The photo is optional; with one, its description is required. */
export const teamMemberFormSchema = z
  .object({
    name: shortText("Name", MAX_TEAM_NAME_LENGTH),
    position: shortText("Position", MAX_TEAM_POSITION_LENGTH),
    bio: z
      .string()
      .trim()
      .max(MAX_TEAM_BIO_LENGTH, `Keep the bio under ${String(MAX_TEAM_BIO_LENGTH)} characters`),
    isPublished: z.boolean(),
    ...imageShape,
  })
  .superRefine(requireImageAlt);

/** Every team member's ID in the new order, first to last. */
export const teamOrderSchema = z.object({
  ids: z.array(objectIdText).min(1).max(MAX_TEAM_MEMBERS),
});

export type TeamMemberFormValues = z.input<typeof teamMemberFormSchema>;
export type TeamMemberFormInput = z.infer<typeof teamMemberFormSchema>;
export type TeamOrderInput = z.infer<typeof teamOrderSchema>;
