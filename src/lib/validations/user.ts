import { z } from "zod";

import { ROLES } from "@/lib/constants/enums";
import { emailText, listQuerySchema, nameText, objectIdText } from "@/lib/validations/common";

const roleChoice = z.enum(ROLES, { error: "Choose a role" });

export const createUserSchema = z.object({
  name: nameText("Name"),
  email: emailText,
  role: roleChoice,
  departmentId: objectIdText,
});

export const updateUserSchema = z
  .object({
    name: nameText("Name"),
    role: roleChoice,
    departmentId: objectIdText,
    isActive: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change");

/** The role filter's "All roles" choice. It means no filter, and never reaches a query. */
export const ALL_ROLES = "ALL";

export const listUsersQuerySchema = listQuerySchema.extend({
  role: z
    .preprocess(
      (value) => (value === ALL_ROLES || value === "" ? undefined : value),
      z.enum(ROLES).optional(),
    )
    .catch(undefined),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
